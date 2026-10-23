import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { LoadingProvider } from '@/contexts/LoadingContext';
import Head from 'next/head';
import SiteNavGate from '@/projects/site-nav/SiteNavGate';
import { pageTitleFor } from '@/projects/site-nav/SiteNavGlass';
// ✅ NEW: Import auto-retry service and Zustand store
import { useAutoRetry } from '@/projects/clipperstream/hooks/useAutoRetry';
import { useClipStore } from '@/projects/clipperstream/store/clipStore';

export default function App({ Component, pageProps, router }: AppProps) {
  const title = pageTitleFor(router.pathname);
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
        {title && <title>{title}</title>}
      </Head>
      <SiteNavGate />
      <Component {...pageProps} />
    </LoadingProvider>
  );
}
