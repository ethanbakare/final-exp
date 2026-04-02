import React, { useEffect } from 'react';
import { ClipMasterScreen } from '@/projects/clipperstream/components/ui/ClipMasterScreen';
import { useClipStore } from '@/projects/clipperstream/store/clipStore';

const SAMPLE_CLIPS = [
  {
    id: 'sample-1',
    title: 'Delete Me (I\'m a Sample)',
    date: 'Apr 2, 2026',
    createdAt: Date.now() - 1000 * 60,
    rawText: `This clip was placed here by the developer so the app didn't look abandoned on first launch.

To delete it: go back to the home screen, hover over this clip on desktop to see the menu, or tap and hold on mobile. Delete lives in there.

You can't delete from inside a clip — just from the list.`,
    formattedText: `This clip was placed here by the developer so the app didn't look abandoned on first launch.

To delete it: go back to the home screen, hover over this clip on desktop to see the menu, or tap and hold on mobile. Delete lives in there.

You can't delete from inside a clip — just from the list.`,
    content: `This clip was placed here by the developer so the app didn't look abandoned on first launch.

To delete it: go back to the home screen, hover over this clip on desktop to see the menu, or tap and hold on mobile. Delete lives in there.

You can't delete from inside a clip — just from the list.`,
    status: null as null,
    currentView: 'formatted' as const,
    hasAnimated: true,
  },
  {
    id: 'sample-2',
    title: 'Your Recordings Never Get Lost',
    date: 'Apr 2, 2026',
    createdAt: Date.now() - 1000 * 60 * 2,
    rawText: `You know that feeling — you've been talking for 3 minutes, you stop, and it just didn't catch it. Gone.

That doesn't happen here. Every recording is saved to your device the moment you stop. If transcription fails, it retries. If you go offline, it queues and picks back up the moment you're online again.

What you said will always be transcribed. It cannot fail.`,
    formattedText: `You know that feeling — you've been talking for 3 minutes, you stop, and it just didn't catch it. Gone.

That doesn't happen here. Every recording is saved to your device the moment you stop. If transcription fails, it retries. If you go offline, it queues and picks back up the moment you're online again.

What you said will always be transcribed. It cannot fail.`,
    content: `You know that feeling — you've been talking for 3 minutes, you stop, and it just didn't catch it. Gone.

That doesn't happen here. Every recording is saved to your device the moment you stop. If transcription fails, it retries. If you go offline, it queues and picks back up the moment you're online again.

What you said will always be transcribed. It cannot fail.`,
    status: null as null,
    currentView: 'formatted' as const,
    hasAnimated: true,
  },
  {
    id: 'sample-3',
    title: 'Welcome to Clipstream',
    date: 'Apr 2, 2026',
    createdAt: Date.now() - 1000 * 60 * 3,
    rawText: `Tap RECORD. Speak. Tap DONE.

Your words come back as clean, formatted text — automatically copied to clipboard.

That's literally it. That's the whole thing.`,
    formattedText: `Tap RECORD. Speak. Tap DONE.

Your words come back as clean, formatted text — automatically copied to clipboard.

That's literally it. That's the whole thing.`,
    content: `Tap RECORD. Speak. Tap DONE.

Your words come back as clean, formatted text — automatically copied to clipboard.

That's literally it. That's the whole thing.`,
    status: null as null,
    currentView: 'formatted' as const,
    hasAnimated: true,
  },
];

const SEED_KEY = 'clipstream-samples-seeded';

const ClipperStream: React.FC = () => {
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem(SEED_KEY)) {
      sessionStorage.setItem(SEED_KEY, 'true');
      SAMPLE_CLIPS.forEach(clip => useClipStore.getState().addClip(clip));
    }
    setMounted(true);
  }, []);

  return (
    <>
      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          background-color: #ffffff;
        }
      `}</style>
      <style jsx>{`
        .page {
          min-height: 100vh;
          background-color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
      <div className="page">
        {mounted ? (
          <ClipMasterScreen />
        ) : (
          <div style={{ width: 393, height: 852, background: '#1C1C1C', borderRadius: 8 }} />
        )}
      </div>
    </>
  );
};

export default ClipperStream;
