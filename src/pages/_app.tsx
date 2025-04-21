import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { LoadingProvider } from '@/contexts/LoadingContext';
import Head from 'next/head';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <LoadingProvider>
      <Head>
        <meta 
          name="viewport" 
          content="width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=1.0" 
        />
      </Head>
      <Component {...pageProps} />
    </LoadingProvider>
  );
}
