import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from 'react'

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    return () => {
      // Cleanup WebSocket server on app shutdown
      if (global.wss) {
        global.wss.close()
      }
    }
  }, [])

  return <Component {...pageProps} />;
}
