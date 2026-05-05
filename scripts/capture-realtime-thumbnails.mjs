/**
 * Capture orb thumbnails for each saved realtime-state profile + the
 * production /voiceinterface/realtime page. Drives the running dev
 * server with Playwright, screenshots the canvas only (no card
 * borders, no dev-tool overlays), saves to /public/thumbnails/.
 *
 * Output: 328×328 PNGs at the orb's CSS size — true thumbnails.
 *
 * Usage (assumes `npm run dev` is running):
 *   node scripts/capture-realtime-thumbnails.mjs
 *   PORT=3000 node scripts/capture-realtime-thumbnails.mjs
 */
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const PORT = process.env.PORT ?? 3002;
const ORIGIN = `http://localhost:${PORT}`;
const ROOT = path.resolve(import.meta.dirname, '..');
const PROFILES_PATH = path.join(ROOT, 'realtime-state-profiles.json');
const STATES_OUT = path.join(ROOT, 'public', 'thumbnails', 'realtime-states');
const PROD_OUT = path.join(ROOT, 'public', 'thumbnails', 'realtime-production.png');

const slug = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

async function waitForCanvasReady(page) {
  // Wait until a canvas exists and has been sized by R3F.
  await page.waitForFunction(
    () => {
      const c = document.querySelector('canvas');
      return !!c && c.width > 0 && c.height > 0;
    },
    null,
    { timeout: 15000 },
  );
  // One extra frame to let the JS animator settle into the active state's target.
  await page.waitForTimeout(1200);
}

const THUMB_SIZE = 256;

async function captureCanvas(page, outFile) {
  // Inset the clip a few pixels inside the canvas bounding rect to
  // exclude any 1-2px border or shadow from parent containers
  // (e.g. .voice-realtime-card's outline that bled into earlier
  // captures).
  const INSET = 4;
  const rect = await page.evaluate((inset) => {
    const c = document.querySelector('canvas');
    if (!c) return null;
    const r = c.getBoundingClientRect();
    return {
      x: r.x + inset,
      y: r.y + inset,
      width: r.width - inset * 2,
      height: r.height - inset * 2,
    };
  }, INSET);
  if (!rect) throw new Error('canvas not found');
  const buf = await page.screenshot({
    clip: rect,
    omitBackground: false,
    type: 'png',
  });
  const sharp = (await import('sharp')).default;
  const resized = await sharp(buf).resize(THUMB_SIZE, THUMB_SIZE, { fit: 'cover' }).png().toBuffer();
  await writeFile(outFile, resized);
  console.log('  ->', path.relative(ROOT, outFile), `(${THUMB_SIZE}×${THUMB_SIZE})`);
}

async function selectProfileByName(page, name) {
  // Open the profile dropdown — trigger button uses min-w-[100px].
  await page.evaluate(() => {
    const triggers = Array.from(document.querySelectorAll('button'));
    const target = triggers.find((b) =>
      b.className.includes('min-w-[100px]'),
    );
    target?.click();
  });
  await page.waitForTimeout(200);

  // Click the dropdown item whose textContent matches the profile name.
  // Items use `div.min-h-[32px]` regardless of cursor state.
  const clicked = await page.evaluate((targetName) => {
    const items = Array.from(document.querySelectorAll('div'));
    const target = items.find((el) => {
      if (!el.className?.includes?.('min-h-[32px]')) return false;
      // Strip pencil icon — measure only the text.
      return (el.textContent ?? '').trim() === targetName;
    });
    if (!target) return false;
    target.click();
    return true;
  }, name);
  if (!clicked) {
    throw new Error(`Could not find profile item "${name}" in dropdown`);
  }
}

async function main() {
  await mkdir(STATES_OUT, { recursive: true });
  await mkdir(path.dirname(PROD_OUT), { recursive: true });
  const profiles = JSON.parse(await readFile(PROFILES_PATH, 'utf-8'));

  // Playwright's default chromium-headless-shell has WebGL disabled,
  // which makes Three.js fail to mount. Use headed mode so a real
  // chromium window opens with full GPU/WebGL support. Window
  // appears briefly while capturing, then closes.
  const browser = await chromium.launch({ headless: false });
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();

  // ── Saved profiles on /voiceinterface/realtime-states ─────────
  console.log(`Capturing ${profiles.length} profile(s) from realtime-states…`);
  await page.goto(`${ORIGIN}/voiceinterface/realtime-states`, {
    waitUntil: 'domcontentloaded',
  });
  await waitForCanvasReady(page);

  for (const profile of profiles) {
    console.log(`profile: ${profile.name}`);
    await selectProfileByName(page, profile.name);
    // Animator ramps to the new profile's targets — wait for it.
    await page.waitForTimeout(900);
    const out = path.join(STATES_OUT, `${slug(profile.name)}.png`);
    await captureCanvas(page, out);
  }

  // ── Production realtime page ─────────────────────────────────
  console.log('Capturing /voiceinterface/realtime…');
  await page.goto(`${ORIGIN}/voiceinterface/realtime`, {
    waitUntil: 'domcontentloaded',
  });
  await waitForCanvasReady(page);
  await captureCanvas(page, PROD_OUT);

  await browser.close();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
