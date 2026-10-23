import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* The tab icon is the bare M, no background: the SVG switches black (light tabs) /
            white (dark tabs). Browsers that support SVG favicons use the SVG; the 48x48 ICO
            (a transparent dark M) is the fallback for those that don't (e.g. Safari). Every
            icon URL carries a ?v= query to bust cached icons: bump v whenever the icon changes. */}
        <link rel="icon" href="/favicon.svg?v=2" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico?v=2" sizes="48x48" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=2" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
