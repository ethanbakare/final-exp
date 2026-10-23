/**
 * Server-only file locations for the navbar tuner's API routes.
 *
 * The voice editor's route resolves files with process.cwd(), which lands in the wrong checkout
 * when a dev server is started from another folder. These paths come from the project itself:
 * walk up from this module's own location (the compiled bundle lives inside the checkout's
 * distDir, so it is always under the right checkout) to the folder that holds next.config.mjs.
 * process.cwd() is only the fallback when no project root is found above the bundle.
 */
import fs from 'fs';
import path from 'path';

const findProjectRoot = (): string => {
  let dir = __dirname;
  for (let i = 0; i < 12; i++) {
    if (fs.existsSync(path.join(dir, 'next.config.mjs')) && fs.existsSync(path.join(dir, 'package.json'))) return dir;
    const up = path.dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  // Not found above the bundle (e.g. a hosted deployment that ships only the traced server
  // files): fall back to the working folder, which is what this route used before. Never throw:
  // the shared studio-profiles route imports this, and the voice pages depend on it.
  return process.cwd();
};

export const PROJECT_ROOT = findProjectRoot();
/** Saved tuner profiles, next to the voice editor's *-profiles.json files at the project root. */
export const PROFILES_FILE = path.join(PROJECT_ROOT, 'site-nav-profiles.json');
/** The live bar's settings file (static import in SiteNavGate). */
export const NAV_SITE_FILE = path.join(PROJECT_ROOT, 'src', 'projects', 'site-nav', 'nav-site.json');
