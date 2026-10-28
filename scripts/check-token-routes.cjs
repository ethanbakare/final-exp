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


// --- module stubs used only by checkSiblingRoutes() -----------------------
// formidable: parse() hands back req.__fields / req.__files.
// node-fetch: forwards to the mocked global fetch.
// axios: post() rejects with whatever axiosImpl returns.
let stubsOn = false;
let axiosImpl = null;
function fakeFormidableFactory() {
  return { parse: (req, cb) => cb(null, req.__fields || {}, req.__files || {}) };
}
class FakeIncomingForm {
  parse(req, cb) { cb(null, req.__fields || {}, req.__files || {}); }
}
const fakeFormidable = Object.assign(fakeFormidableFactory, {
  __esModule: true,
  default: fakeFormidableFactory,
  IncomingForm: FakeIncomingForm,
});
const fakeNodeFetch = { __esModule: true, default: (...a) => global.fetch(...a) };
const fakeAxios = {
  __esModule: true,
  isAxiosError: (e) => !!(e && e.isAxiosError),
  post: async () => { throw axiosImpl(); },
};
fakeAxios.default = fakeAxios;
const origLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (stubsOn) {
    if (request === "formidable") return fakeFormidable;
    if (request === "node-fetch") return fakeNodeFetch;
    if (request === "axios") return fakeAxios;
  }
  return origLoad.call(this, request, parent, isMain);
};

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

const isNoStore = (res) => /no-store/.test(String(res.headers["cache-control"] || ""));

// --- run -----------------------------------------------------------------
let failures = 0;
function check(route, label, ok, detail = "") {
  if (!ok) failures += 1;
  process.stdout.write(`${ok ? "PASS" : "FAIL"}  ${route.name}  ${label}${detail ? "  (" + detail + ")" : ""}\n`);
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
  check(route, `prod upstream failure: ${res.statusCode} has Cache-Control no-store`, isNoStore(res));
  check(route, "prod upstream failure: body has no env key", !has(res));
  fetchImpl = route.upstreamOk;

  // upstream error body that echoes the key must never reach the client or the log
  const MARKER = "UPSTREAM_BODY_MARKER_" + crypto.randomBytes(6).toString("hex");
  fetchImpl = () => jsonResponse(401, { error: { message: `Incorrect API key provided: ${secret} ${MARKER}`, key: secret, code: MARKER } });
  errorLog.length = 0;
  res = await call(handler, { headers: { origin: ALLOWED } });
  check(route, "upstream error body containing the key: error status", res.statusCode >= 400, `status ${res.statusCode}`);
  check(route, "upstream error body containing the key: not in response", !has(res));
  check(route, "upstream error body containing the key: not in server log", !errorLog.some((l) => l.includes(secret)));
  check(route, "upstream error body marker: not in response", !bodyText(res).includes(MARKER));
  check(route, "upstream error body marker: not in any log line", !errorLog.some((l) => l.includes(MARKER)));
  fetchImpl = route.upstreamOk;

  // 4. production, foreign Origin / no Origin
  res = await call(handler, { headers: { origin: "https://evil.example" } });
  check(route, "prod foreign Origin: 403", res.statusCode === 403, `status ${res.statusCode}`);
  check(route, "prod foreign Origin: 403 has Cache-Control no-store", isNoStore(res));
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
  check(route, "POST: 405 has Cache-Control no-store", isNoStore(res));
  check(route, "POST: body has no env key", !has(res));

  // 7. rate limit per IP
  const ip = "198.51.100." + (Math.floor(Math.random() * 200) + 1);
  const statuses = [];
  for (let i = 0; i < route.rateLimit + 1; i++) {
    const r = await call(handler, { ip, headers: { origin: ALLOWED } });
    statuses.push(r.statusCode);
    if (r.statusCode === 429) check(route, "rate limit: 429 has Cache-Control no-store", isNoStore(r));
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
  // VoiceTextWrapperLive must hand the JWT to the SDK as { accessToken }:
  // a bare string is treated as an API key (sent as ["token", key]), so
  // the short-lived JWT would be rejected.
  {
    const src = fs.readFileSync(path.join(srcRoot, "projects/voiceinterface/components/VoiceTextWrapperLive.tsx"), "utf8");
    const calls = src.match(/createClient\(([^)]*)\)/g) || [];
    check(route, "VoiceTextWrapperLive.tsx: createClient({ accessToken })",
      calls.length > 0 && calls.every((c) => /^createClient\(\s*\{\s*accessToken(\s*:\s*accessToken)?\s*\}\s*\)$/.test(c)),
      JSON.stringify(calls));
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

// --- sibling routes: upstream / SDK error text never reaches a response or a log
async function checkSiblingRoutes() {
  const os = require("os");
  const MARKER = "UPSTREAM_BODY_MARKER_" + crypto.randomBytes(6).toString("hex");
  const secret = "fake_" + crypto.randomBytes(20).toString("hex");
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "token-route-check-"));
  const writeTmp = (name, bytes) => {
    const f = path.join(tmpDir, name + "-" + crypto.randomBytes(4).toString("hex"));
    fs.writeFileSync(f, bytes);
    return f;
  };
  const audioBytes = Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), crypto.randomBytes(400)]);
  const pngBytes = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47]), crypto.randomBytes(100)]);
  const errBody = { error: { message: `upstream says ${MARKER}`, code: MARKER, type: MARKER } };

  // Capture every console channel while these routes run.
  const logs = [];
  const saved = {};
  for (const m of ["log", "info", "warn", "error", "debug"]) {
    saved[m] = console[m];
    console[m] = (...args) => logs.push(args.map((a) => {
      if (typeof a === "string") return a;
      try { return JSON.stringify(a, a instanceof Error ? Object.getOwnPropertyNames(a) : undefined); } catch { return String(a); }
    }).join(" ") + " " + args.map((a) => (a instanceof Error ? String(a.stack || a.message) : "")).join(" "));
  }
  const envSaved = { ...process.env };
  Object.assign(process.env, {
    NODE_ENV: "development",
    DEEPGRAM_API_KEY: secret, OPENAI_API_KEY: secret, OPENROUTER_API_KEY: secret, GEMINI_API_KEY: secret,
  });
  stubsOn = true;
  fetchImpl = () => jsonResponse(401, errBody);
  axiosImpl = () => Object.assign(new Error(`Request failed: ${MARKER}`), {
    isAxiosError: true, response: { status: 500, data: { error: MARKER, detail: MARKER } },
  });

  const routes = [
    ["ai-confidence-tracker/transcribe", "pages/api/ai-confidence-tracker/transcribe.ts",
      () => ({ method: "POST", __files: { audio: { filepath: writeTmp("a.wav", audioBytes), mimetype: "audio/wav" } } })],
    ["clipperstream/transcribe (deepgram)", "pages/api/clipperstream/transcribe.ts",
      () => ({ method: "POST", __fields: {}, __files: { audio: { filepath: writeTmp("a.webm", audioBytes), mimetype: "audio/webm" } } })],
    ["clipperstream/transcribe (whisper)", "pages/api/clipperstream/transcribe.ts",
      () => ({ method: "POST", __fields: { provider: ["whisper"] }, __files: { audio: { filepath: writeTmp("b.webm", audioBytes), mimetype: "audio/webm" } } })],
    ["voice-interface/transcribe", "pages/api/voice-interface/transcribe.ts",
      () => ({ method: "POST", __files: { audio: { filepath: writeTmp("c.webm", audioBytes), mimetype: "audio/webm" } } })],
    ["clipperstream/format-text", "pages/api/clipperstream/format-text.ts",
      () => ({ method: "POST", body: { rawText: "hello there this is a test" } })],
    ["clipperstream/generate-title", "pages/api/clipperstream/generate-title.ts",
      () => ({ method: "POST", body: { transcription: "hello there this is a test" } })],
    ["tictactoe/arena", "pages/api/tictactoe/arena.ts",
      () => ({ method: "POST", body: { currentPlayer: "claude", requestId: "r1", gameState: {
        board: [[null, null, null], [null, null, null], [null, null, null]], activeMoves: [], currentPlayer: "X",
        turnNumber: 1, gameStatus: "playing", isGameActive: true, moveHistory: [], maxTurns: 50, moveDecayLimit: 3 } } })],
    ["trace/parse-voice", "pages/api/trace/parse-voice.ts",
      () => ({ method: "POST", body: { base64Audio: "AAAA", mimeType: "audio/webm" } })],
    ["trace/parse-receipt", "pages/api/trace/parse-receipt.ts",
      () => ({ method: "POST", body: { base64Image: "AAAA", mimeType: "image/png" } })],
    ["receipt-scanner/process", "pages/api/receipt-scanner/process.ts",
      () => ({ method: "POST", __fields: {}, __files: { file: { filepath: writeTmp("r.png", pngBytes), originalFilename: "r.png" } } })],
  ];
  try {
    for (const [name, rel, mk] of routes) {
      const route = { name: `sibling ${name}` };
      const file = path.join(srcRoot, rel);
      if (!fs.existsSync(file)) { check(route, "route file exists", false, rel); continue; }
      let res;
      logs.length = 0;
      try {
        delete require.cache[file];
        const mod = require(file);
        const handler = mod.default || mod;
        const opts = mk();
        const req = makeReq({ method: opts.method, body: opts.body });
        req.__files = opts.__files; req.__fields = opts.__fields;
        res = makeRes();
        await handler(req, res);
      } catch (err) {
        check(route, "handler ran", false, err && err.name);
        continue;
      }
      const body = bodyText(res);
      const logText = logs.join("\n");
      check(route, "upstream error marker not in response", !body.includes(MARKER), `status ${res.statusCode}`);
      check(route, "upstream error marker not in any log line", !logText.includes(MARKER));
      check(route, "env key not in response or log", !body.includes(secret) && !logText.includes(secret));
    }
  } finally {
    stubsOn = false;
    for (const m of Object.keys(saved)) console[m] = saved[m];
    for (const k of Object.keys(process.env)) if (!(k in envSaved)) delete process.env[k];
    Object.assign(process.env, envSaved);
    fetchImpl = null;
    // Remove only the files this check created, then its own empty dir.
    try {
      for (const f of fs.readdirSync(tmpDir)) fs.unlinkSync(path.join(tmpDir, f));
      fs.rmdirSync(tmpDir);
    } catch {}
  }
}

(async () => {
  console.log(`checking token routes under ${srcRoot}`);
  const realError = console.error;
  const realConsole = { log: console.log, info: console.info, warn: console.warn, debug: console.debug };
  console.error = captureError;
  console.log = console.info = console.warn = console.debug = captureError;
  for (const route of ROUTES) {
    try {
      await runRoute(route);
    } catch (err) {
      check(route, "handler ran without throwing", false, err && err.message);
    }
  }
  await checkOriginAllowlist();
  checkClientTokenErrors();
  await checkSiblingRoutes();
  console.error = realError;
  Object.assign(console, realConsole);
  console.log(failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
})();
