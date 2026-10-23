import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* The tab icon is the bare M, no background: the SVG switches black (light tabs) /
            white (dark tabs). Only the SVG is linked, so no browser that supports it picks
            the ICO; /favicon.ico (a transparent dark M) is still served for anything that
            requests it by default. */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
