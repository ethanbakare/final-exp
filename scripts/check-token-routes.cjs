#!/usr/bin/env node
/**
 * Checks that token-minting API routes never return the server's secret
 * key and that they are guarded (GET only, production Origin/Referer
 * allowlist, per-IP rate limit, no-store).
 *
 * Each route handler is loaded straight from TypeScript source (compiled
 * in memory with the project's own `typescript` package), `fetch` is
 * mocked, and the env key is a random fake value generated per run.
 * No network calls, no real keys.
 *
 * Usage:
 *   node scripts/check-token-routes.cjs            # checks ./src
 *   node scripts/check-token-routes.cjs <srcRoot>  # checks another tree
 * Exit code 0 = all checks pass, 1 = at least one failed.
 */
"use strict";

const path = require("path");
const fs = require("fs");
const Module = require("module");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..");
const srcRoot = path.resolve(process.argv[2] || path.join(repoRoot, "src"));
const ts = require(path.join(repoRoot, "node_modules", "typescript"));

// --- load .ts files and the "@/..." alias -------------------------------
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  if (request.startsWith("@/")) {
    request = path.join(srcRoot, request.slice(2));
  }
  try {
    return origResolve.call(this, request, parent, ...rest);
  } catch (err) {
    for (const ext of [".ts", ".tsx"]) {
      if (fs.existsSync(request + ext)) return request + ext;
    }
    // Packages resolve from the repo's node_modules even when srcRoot is
    // an extracted copy elsewhere.
    return origResolve.call(this, request, {
      ...parent,
      paths: [path.join(repoRoot, "node_modules")],
    }, ...rest);
  }
};
for (const ext of [".ts", ".tsx"]) {
  require.extensions[ext] = function (module, filename) {
    const source = fs.readFileSync(filename, "utf8");
    const out = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
        jsx: ts.JsxEmit.ReactJSX,
      },
      fileName: filename,
    });
    module._compile(out.outputText, filename);
  };
}

// --- tiny req/res mocks --------------------------------------------------
let ipCounter = 0;
function makeReq({ method = "GET", headers = {}, body, ip, socketIp, query } = {}) {
  ipCounter += 1;
  const defaultIp = ip || `10.${Math.floor(ipCounter / 250)}.${ipCounter % 250}.1`;
  return {
    method,
    // Normal requests carry the same client IP in every header, so both
    // the old and the new clientIp() give each test case its own bucket.
    headers: { "x-forwarded-for": defaultIp, "x-vercel-forwarded-for": defaultIp, ...headers },
    body,
    query: query || {},
    socket: { remoteAddress: socketIp || defaultIp },
  };
}
function makeRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; return this; },
    getHeader(k) { return this.headers[k.toLowerCase()]; },
    status(code) { this.statusCode = code; return this; },
    json(obj) { this.body = obj; this.ended = true; return this; },
    send(obj) { this.body = obj; this.ended = true; return this; },
    end(obj) { if (obj !== undefined) this.body = obj; this.ended = true; return this; },
  };
  return res;
}
function bodyText(res) {
  return typeof res.body === "string" ? res.body : JSON.stringify(res.body ?? null);
}

// --- fetch mock ----------------------------------------------------------
let fetchImpl = null;
const fetchCalls = [];
global.fetch = async (url, init) => {
  fetchCalls.push({ url: String(url), init });
  if (!fetchImpl) throw new Error("unexpected fetch " + url);
  return fetchImpl(String(url), init);
};
function jsonResponse(status, obj) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: String(status),
    headers: new Map([["content-type", "application/json"]]),
    json: async () => obj,
    text: async () => JSON.stringify(obj),
  };
}

// --- route table ---------------------------------------------------------
const ALLOWED = "https://allowed.example";
const ROUTES = [
  {
    name: "voice-interface/deepgram-token",
    file: "pages/api/voice-interface/deepgram-token.ts",
    envVar: "DEEPGRAM_API_KEY",
    rateLimit: 10,
    upstreamOk: (url) =>
      url.includes("api.deepgram.com/v1/auth/grant")
        ? jsonResponse(200, { access_token: "jwt.fake.token", expires_in: 30 })
        : jsonResponse(404, {}),
    expectToken: (body) => body && body.access_token === "jwt.fake.token",
    upstreamCallOk: (call, secret) =>
      call.url === "https://api.deepgram.com/v1/auth/grant" &&
      call.init.method === "POST" &&
      call.init.headers.Authorization === `Token ${secret}` &&
      JSON.parse(call.init.body).ttl_seconds === 30,
  },
  {
    name: "voice-interface/openai-realtime-token",
    file: "pages/api/voice-interface/openai-realtime-token.ts",
    envVar: "OPENAI_API_KEY",
    rateLimit: 5,
    upstreamOk: (url) =>
      url.includes("api.openai.com/v1/realtime/client_secrets")
        ? jsonResponse(200, { value: "ek_fake_client_secret" })
        : jsonResponse(404, {}),
    expectToken: (body) => body && body.key === "ek_fake_client_secret",
  },
];

// Handlers log upstream failures; capture instead of printing.
const errorLog = [];
function captureError(...args) {
  errorLog.push(args.map((a) => (typeof a === "string" ? a : (() => { try { return JSON.stringify(a, a instanceof Error ? Object.getOwnPropertyNames(a) : undefined); } catch { return String(a); } })())).join(" "));
}

// --- run -----------------------------------------------------------------
let failures = 0;
function check(route, label, ok, detail = "") {
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${route.name}  ${label}${detail ? "  (" + detail + ")" : ""}`);
}

async function call(handler, reqOpts) {
  const req = makeReq(reqOpts);
  const res = makeRes();
  await handler(req, res);
  return res;
}

async function runRoute(route) {
  const file = path.join(srcRoot, route.file);
  if (!fs.existsSync(file)) {
    check(route, "handler file exists", false, file);
    return;
  }
  delete require.cache[file];
  const mod = require(file);
  const handler = mod.default || mod;

  const secret = "fake_" + crypto.randomBytes(20).toString("hex");
  process.env[route.envVar] = secret;
  delete process.env.TOKEN_ROUTE_ALLOWED_ORIGINS;
  delete process.env.VERCEL_URL;
  delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const has = (res) => bodyText(res).includes(secret);

  // 1. development, upstream OK
  process.env.NODE_ENV = "development";
  fetchImpl = route.upstreamOk;
  fetchCalls.length = 0;
  let res = await call(handler, {});
  if (route.upstreamCallOk) {
    const last = fetchCalls[fetchCalls.length - 1];
    check(route, "dev GET: upstream mint request shape", !!last && route.upstreamCallOk(last, secret));
  }
  check(route, "dev GET: body has no env key", !has(res), `status ${res.statusCode}`);
  check(route, "dev GET: returns short-lived token", res.statusCode === 200 && route.expectToken(res.body));
  check(route, "dev GET: Cache-Control no-store", String(res.headers["cache-control"] || "").includes("no-store"));

  // 2. production, allowed Referer (same-origin GET sends no Origin)
  process.env.NODE_ENV = "production";
  process.env.TOKEN_ROUTE_ALLOWED_ORIGINS = ALLOWED;
  res = await call(handler, { headers: { referer: ALLOWED + "/some/page" } });
  check(route, "prod GET allowed referer: body has no env key", !has(res), `status ${res.statusCode}`);
  check(route, "prod GET allowed referer: 200 + token", res.statusCode === 200 && route.expectToken(res.body));

  // 3. production, upstream mint fails -> error, never the key
  fetchImpl = () => jsonResponse(401, { err_msg: "nope" });
  res = await call(handler, { headers: { origin: ALLOWED } });
  check(route, "prod upstream failure: error status", res.statusCode >= 400, `status ${res.statusCode}`);
  check(route, "prod upstream failure: body has no env key", !has(res));
  fetchImpl = route.upstreamOk;

  // upstream error body that echoes the key must never reach the client or the log
  fetchImpl = () => jsonResponse(401, { error: { message: `Incorrect API key provided: ${secret}`, key: secret } });
  errorLog.length = 0;
  res = await call(handler, { headers: { origin: ALLOWED } });
  check(route, "upstream error body containing the key: error status", res.statusCode >= 400, `status ${res.statusCode}`);
  check(route, "upstream error body containing the key: not in response", !has(res));
  check(route, "upstream error body containing the key: not in server log", !errorLog.some((l) => l.includes(secret)));
  fetchImpl = route.upstreamOk;

  // 4. production, foreign Origin / no Origin
  res = await call(handler, { headers: { origin: "https://evil.example" } });
  check(route, "prod foreign Origin: 403", res.statusCode === 403, `status ${res.statusCode}`);
  check(route, "prod foreign Origin: body has no env key", !has(res));
  res = await call(handler, {});
  check(route, "prod no Origin/Referer: 403", res.statusCode === 403, `status ${res.statusCode}`);

  // 5. production, allowlist env unset -> fail closed
  delete process.env.TOKEN_ROUTE_ALLOWED_ORIGINS;
  res = await call(handler, { headers: { origin: ALLOWED } });
  check(route, "prod allowlist unset: 403 (fail closed)", res.statusCode === 403, `status ${res.statusCode}`);
  process.env.TOKEN_ROUTE_ALLOWED_ORIGINS = ALLOWED;

  // 6. method
  res = await call(handler, { method: "POST", headers: { origin: ALLOWED } });
  check(route, "POST: 405", res.statusCode === 405, `status ${res.statusCode}`);
  check(route, "POST: body has no env key", !has(res));

  // 7. rate limit per IP
  const ip = "198.51.100." + (Math.floor(Math.random() * 200) + 1);
  const statuses = [];
  for (let i = 0; i < route.rateLimit + 1; i++) {
    const r = await call(handler, { ip, headers: { origin: ALLOWED } });
    statuses.push(r.statusCode);
  }
  check(
    route,
    `rate limit: request ${route.rateLimit + 1} from one IP is 429`,
    statuses[route.rateLimit] === 429 && statuses.slice(0, route.rateLimit).every((s) => s === 200),
    `statuses ${statuses.join(",")}`,
  );
  const other = await call(handler, { headers: { origin: ALLOWED } });
  check(route, "rate limit: another IP still 200", other.statusCode === 200, `status ${other.statusCode}`);


  // 8. spoofed left-most X-Forwarded-For must not open a fresh bucket
  for (const variant of ["vercel", "no-platform-header"]) {
    const trueIp = "203.0.113." + (Math.floor(Math.random() * 200) + 1);
    const codes = [];
    for (let i = 0; i < route.rateLimit + 1; i++) {
      const spoofed = `${i + 1}.${i + 2}.${i + 3}.${i + 4}`;
      const headers = {
        origin: ALLOWED,
        "x-forwarded-for": `${spoofed}, ${trueIp}`,
        "x-vercel-forwarded-for": variant === "vercel" ? trueIp : undefined,
      };
      const r = await call(handler, { headers, socketIp: trueIp });
      codes.push(r.statusCode);
    }
    check(
      route,
      `spoofed XFF (${variant}): request ${route.rateLimit + 1} from one real IP is still 429`,
      codes[route.rateLimit] === 429,
      `last status ${codes[route.rateLimit]}`,
    );
  }

  delete process.env[route.envVar];
}

// --- production Origin/Referer allowlist (guard called directly) ---------
async function checkOriginAllowlist() {
  const route = { name: "tokenRouteGuard origin allowlist" };
  const file = path.join(srcRoot, "lib/tokenRouteGuard.ts");
  if (!fs.existsSync(file)) {
    check(route, "guard file exists", false);
    return;
  }
  delete require.cache[file];
  const { guardTokenRoute } = require(file);
  const ENV_KEYS = ["TOKEN_ROUTE_ALLOWED_ORIGINS", "VERCEL_PROJECT_PRODUCTION_URL", "VERCEL_URL", "VERCEL_BRANCH_URL"];
  const savedEnv = {};
  for (const k of [...ENV_KEYS, "NODE_ENV"]) savedEnv[k] = process.env[k];
  let n = 0;
  const run = (env, headers) => {
    for (const k of ENV_KEYS) delete process.env[k];
    Object.assign(process.env, env);
    process.env.NODE_ENV = "production";
    n += 1;
    const res = makeRes();
    // Unique bucket per call so the rate limit never interferes.
    const ok = guardTokenRoute(makeReq({ headers }), res, { bucket: `origin-test-${n}` });
    return { ok, status: ok ? 200 : res.statusCode };
  };
  const cases = [
    ["www Origin allowed when only VERCEL_PROJECT_PRODUCTION_URL=littleexp.com",
      { VERCEL_PROJECT_PRODUCTION_URL: "littleexp.com" }, { origin: "https://www.littleexp.com" }, true],
    ["apex Origin allowed when VERCEL_PROJECT_PRODUCTION_URL=littleexp.com",
      { VERCEL_PROJECT_PRODUCTION_URL: "littleexp.com" }, { origin: "https://littleexp.com" }, true],
    ["apex Origin allowed when VERCEL_PROJECT_PRODUCTION_URL=www.littleexp.com",
      { VERCEL_PROJECT_PRODUCTION_URL: "www.littleexp.com" }, { origin: "https://littleexp.com" }, true],
    ["www Referer allowed (same-origin GET, no Origin)",
      { VERCEL_PROJECT_PRODUCTION_URL: "littleexp.com" }, { referer: "https://www.littleexp.com/voice" }, true],
    ["lookalike Origin https://littleexp.com.evil.com denied",
      { VERCEL_PROJECT_PRODUCTION_URL: "littleexp.com" }, { origin: "https://littleexp.com.evil.com" }, false],
    ["lookalike Origin https://www.littleexp.com.evil.com denied",
      { VERCEL_PROJECT_PRODUCTION_URL: "littleexp.com" }, { origin: "https://www.littleexp.com.evil.com" }, false],
    ["lookalike Referer https://littleexp.com.evil.com/x denied",
      { VERCEL_PROJECT_PRODUCTION_URL: "littleexp.com" }, { referer: "https://littleexp.com.evil.com/x" }, false],
    ["prefix-lookalike Origin https://evillittleexp.com denied",
      { VERCEL_PROJECT_PRODUCTION_URL: "littleexp.com" }, { origin: "https://evillittleexp.com" }, false],
    ["http (not https) Origin denied",
      { VERCEL_PROJECT_PRODUCTION_URL: "littleexp.com" }, { origin: "http://www.littleexp.com" }, false],
    ["VERCEL_BRANCH_URL host allowed",
      { VERCEL_BRANCH_URL: "proj-git-feature-team.vercel.app" }, { origin: "https://proj-git-feature-team.vercel.app" }, true],
    ["VERCEL_URL host allowed",
      { VERCEL_URL: "proj-abc123-team.vercel.app" }, { origin: "https://proj-abc123-team.vercel.app" }, true],
    ["env entries trimmed + case-insensitive (lower-case Origin)",
      { TOKEN_ROUTE_ALLOWED_ORIGINS: "  HTTPS://Example.COM/ ,  https://Other.Example  " }, { origin: "https://example.com" }, true],
    ["env entries case-insensitive (upper-case Origin)",
      { TOKEN_ROUTE_ALLOWED_ORIGINS: "  HTTPS://Example.COM/ ,  https://Other.Example  " }, { origin: "https://OTHER.example" }, true],
    ["mixed-case VERCEL_PROJECT_PRODUCTION_URL",
      { VERCEL_PROJECT_PRODUCTION_URL: " LittleExp.com " }, { origin: "https://www.littleexp.com" }, true],
    ["nothing configured: denied (fail closed)",
      {}, { origin: "https://www.littleexp.com" }, false],
  ];
  for (const [label, env, headers, expectAllowed] of cases) {
    const r = run(env, headers);
    check(route, label, r.ok === expectAllowed, `status ${r.status}`);
  }
  for (const k of Object.keys(savedEnv)) {
    if (savedEnv[k] === undefined) delete process.env[k]; else process.env[k] = savedEnv[k];
  }
}

// --- client: token-route failures get their own message, not "check your microphone"
function checkClientTokenErrors() {
  const route = { name: "voiceinterface client token errors" };
  const helper = path.join(srcRoot, "projects/voiceinterface/utils/tokenRouteError.ts");
  if (!fs.existsSync(helper)) {
    check(route, "utils/tokenRouteError.ts exists", false);
  } else {
    delete require.cache[helper];
    const { TokenRouteError, tokenRouteErrorMessage } = require(helper);
    const msg = (status) => tokenRouteErrorMessage(new TokenRouteError(status), "Transcription");
    for (const status of [403, 429, 500, 502, 503]) {
      const m = msg(status);
      check(route, `status ${status}: message does not mention the microphone`, !!m && !/microphone/i.test(m), JSON.stringify(m));
    }
    check(route, "429 says too many requests", /too many requests/i.test(msg(429)), JSON.stringify(msg(429)));
    check(route, "403/5xx say unavailable", [403, 500, 502, 503].every((st) => /unavailable/i.test(msg(st))));
    check(route, "non-token errors are not classified", tokenRouteErrorMessage(new Error("NotAllowedError"), "Transcription") === null);
  }
  // Both components must throw TokenRouteError on a non-OK token response
  // and use the helper's message in their catch block.
  for (const [rel, tokenPath] of [
    ["projects/voiceinterface/components/VoiceTextWrapperLive.tsx", "/api/voice-interface/deepgram-token"],
    ["projects/voiceinterface/components/VoiceRealtimeOpenAI.tsx", "/api/voice-interface/openai-realtime-token"],
  ]) {
    const src = fs.readFileSync(path.join(srcRoot, rel), "utf8");
    const afterFetch = src.slice(src.indexOf(tokenPath), src.indexOf(tokenPath) + 900);
    check(route, `${path.basename(rel)}: non-OK token response throws TokenRouteError`,
      /if \(!response\.ok\)[\s\S]{0,120}throw new TokenRouteError\(response\.status\)/.test(afterFetch));
    check(route, `${path.basename(rel)}: catch shows tokenRouteErrorMessage`, /tokenRouteErrorMessage\(/.test(src));
  }
}

(async () => {
  console.log(`checking token routes under ${srcRoot}`);
  const realError = console.error;
  console.error = captureError;
  for (const route of ROUTES) {
    try {
      await runRoute(route);
    } catch (err) {
      check(route, "handler ran without throwing", false, err && err.message);
    }
  }
  await checkOriginAllowlist();
  checkClientTokenErrors();
  console.error = realError;
  console.log(failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
})();
