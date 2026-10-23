import React, { useEffect } from 'react';
import { ClipMasterScreen } from '@/projects/clipperstream/components/ui/ClipMasterScreen';
import { useClipStore } from '@/projects/clipperstream/store/clipStore';
import ProjectPageBackground from '@/projects/new-home/components/ProjectPageBackground';

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
        }
      `}</style>
      <style jsx>{`
        /* Desktop card is a fixed 852px. Inside the frame it gives up the
           navbar height, the frame's 20px top and bottom inset, and a
           --clip-m margin above and below the card (so the dark card
           floats inside the frame like the Trace and AI Confidence
           interfaces instead of touching its top and bottom edges).
           RECORD stays on screen on 720-768px-tall laptops (never taller
           than 852, never shorter than 560 so short landscape phones
           scroll the frame instead of squeezing the card). */
        .page {
          --clip-m: 20px;
          --clip-h: max(560px, min(852px, calc(var(--clip-vh, 100vh) - var(--site-nav-h, 0px) - 40px - 2 * var(--clip-m))));
        }
        /* Phones and tablets: the frame is edge to edge (no 20px inset, see
           ProjectPageBackground), so only the navbar and --clip-m come off
           the height. The card is inset on all sides (--clip-m) with rounded
           corners so the dotted project background shows around it, rather
           than a full-bleed dark slab. */
        @media (max-width: 768px) {
          .page {
            --clip-m: 16px;
            --clip-h: max(520px, calc(var(--clip-vh, 100vh) - var(--site-nav-h, 0px) - 2 * var(--clip-m)));
          }
          /* Capped at a phone's width so tablets (up to 768px) still get a
             phone-shaped app, and the step to the 393px desktop card at
             769px is 37px rather than the app jumping from 736px. */
          .page :global(.master-screen) {
            width: min(calc(100% - 2 * var(--clip-m)), 430px);
            border-radius: 20px;
          }
        }
        .page :global(.master-screen) {
          height: var(--clip-h);
          min-height: 0;
          max-height: var(--clip-h);
        }
        /* The record screen (the inner .record-screen; the slide wrapper
           shares the class name) hard-codes 692px (852 - 160) on desktop
           and calc(100vh - 160px) at <=768px, taller than the capped card
           on short screens. Follow the card: its height minus the 160px
           RecordBar. */
        .page :global(.screen-slide .record-screen) {
          height: calc(var(--clip-h) - 160px);
        }
        .page {
          /* Background = the home-page AI DEMOS ClipStream card (light
             dotted grid), painted and framed by <ProjectPageBackground>,
             which also applies the site navbar offset. */
          width: 100%;
          box-sizing: border-box;
          padding: var(--clip-m) 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
              /* Size the card from the same dynamic viewport the frame uses (100dvh),
           so iOS URL-bar changes cannot desync card and frame. */
        @supports (height: 100dvh) {
          .page {
            --clip-vh: 100dvh;
          }
        }
      `}</style>
      <ProjectPageBackground variant="clipstream">
        <div className="page">
          {mounted ? (
            <ClipMasterScreen />
          ) : (
            <div style={{ width: 393, height: 852, background: '#1C1C1C', borderRadius: 8 }} />
          )}
        </div>
      </ProjectPageBackground>
    </>
  );
};

export default ClipperStream;
