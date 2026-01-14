import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { LoadingProvider } from '@/contexts/LoadingContext';
import Head from 'next/head';
// ✅ NEW: Import auto-retry service and Zustand store
import { useAutoRetry } from '@/projects/clipperstream/hooks/useAutoRetry';
import { useClipStore } from '@/projects/clipperstream/store/clipStore';

export default function App({ Component, pageProps }: AppProps) {
  // ✅ NEW: Get processAllPendingClips from Zustand store
  const processAllPendingClips = useClipStore(state => state.processAllPendingClips);

  // ✅ NEW: Mount auto-retry service (runs for entire app lifetime)
  useAutoRetry(processAllPendingClips);

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
