import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* The tab icon is the M on a rounded cream tile, the same in light and dark tabs.
            Order: the ICO first (16/32/48 frames, the fallback for browsers without SVG
            favicons, e.g. Safari), the SVG last with sizes="any" so browsers that support it
            prefer it. The no-tile variant is kept, unserved, in design/favicon/set-a-no-tile.
            Every icon URL carries a ?v= query to bust cached icons: bump v whenever the icon
            changes. */}
        <link rel="icon" href="/favicon.ico?v=3" sizes="16x16 32x32 48x48" />
        <link rel="icon" href="/favicon.svg?v=3" type="image/svg+xml" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=3" sizes="180x180" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
