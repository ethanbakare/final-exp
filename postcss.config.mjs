/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    // Tailwind scans for class names from `base`, which otherwise defaults to the
    // process's working directory. Pin it to this project so a dev server started
    // from another folder (e.g. `next dev <this dir>` run elsewhere) still sees
    // every class used here.
    '@tailwindcss/postcss': { base: import.meta.dirname },
  },
};

export default config;
