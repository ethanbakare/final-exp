/**
 * GalleryScene – Main gallery page showing all orb profiles in a seamless grid.
 * Sections for each variant with a Default cell first, then saved profiles.
 * Bottom nav bar with controls, profile CRUD, and variant switching.
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import type { AudioData } from "../types";
import type {
  GalleryVariant,
  GallerySettings,
  GalleryProfile,
} from "../galleryTypes";
import {
  GALLERY_VARIANTS,
  GALLERY_VARIANT_LABELS,
  GALLERY_API_KEYS,
  GALLERY_DEFAULTS,
  GALLERY_CELL_SIZE,
  GALLERY_BORDER,
  pickUnusedName,
} from "../galleryTypes";
import { audioService } from "../services/audioService";
import GalleryCell from "./GalleryCell";
import GalleryNavBar from "./GalleryNavBar";
import GalleryAudioControls from "./GalleryAudioControls";

// ── API helpers ───────────────────────────────────────────────────

async function fetchProfiles(variant: GalleryVariant): Promise<GalleryProfile[]> {
  try {
    const key = GALLERY_API_KEYS[variant];
    const res = await fetch(`/api/studio-profiles?variant=${key}`);
    return await res.json();
  } catch {
    return [];
  }
}

async function persistProfiles(variant: GalleryVariant, profiles: GalleryProfile[]) {
  try {
    const key = GALLERY_API_KEYS[variant];
    await fetch(`/api/studio-profiles?variant=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profiles),
    });
  } catch (e) {
    console.error("Failed to persist gallery profiles", e);
  }
}

// ── Default profile ID per variant ────────────────────────────────

const DEFAULT_ID = "default";

// ── Zero audio ────────────────────────────────────────────────────

const ZERO_AUDIO: AudioData = { bass: 0, mid: 0, treble: 0, rms: 0 };

// ══════════════════════════════════════════════════════════════════
// ── Main Component ───────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════

const GalleryScene: React.FC = () => {
  // ── State ─────────────────────────────────────────────────────

  const [activeVariant, setActiveVariant] = useState<GalleryVariant>("thicken");
  const [activeProfileId, setActiveProfileId] = useState<
    Record<GalleryVariant, string>
  >({
    thicken: DEFAULT_ID,
    coralstone: DEFAULT_ID,
    coralstonedamped: DEFAULT_ID,
    coralmorph: DEFAULT_ID,
  });

  const [profilesByVariant, setProfilesByVariant] = useState<
    Record<GalleryVariant, GalleryProfile[]>
  >({
    thicken: [],
    coralstone: [],
    coralstonedamped: [],
    coralmorph: [],
  });

  // The "editing" settings for the currently selected cell
  const [editingSettings, setEditingSettings] = useState<
    Record<GalleryVariant, GallerySettings>
  >({
    thicken: { ...GALLERY_DEFAULTS.thicken },
    coralstone: { ...GALLERY_DEFAULTS.coralstone },
    coralstonedamped: { ...GALLERY_DEFAULTS.coralstonedamped },
    coralmorph: { ...GALLERY_DEFAULTS.coralmorph },
  });

  // Nav bar visibility
  const [showNavBar, setShowNavBar] = useState(true);

  // Audio state
  const [audioData, setAudioData] = useState<AudioData>(ZERO_AUDIO);
  const [audioActive, setAudioActive] = useState(false);

  // Goal toggle state
  const [goal, setGoal] = useState(0);
  const [isLooping, setIsLooping] = useState(false);

  // Section refs for scroll-to-section navigation
  const sectionRefs = useRef<Record<GalleryVariant, HTMLDivElement | null>>({
    thicken: null,
    coralstone: null,
    coralstonedamped: null,
    coralmorph: null,
  });

  // ── Derived ───────────────────────────────────────────────────

  const currentProfileId = activeProfileId[activeVariant];
  const currentProfiles = profilesByVariant[activeVariant];
  const currentEditingSettings = editingSettings[activeVariant];
  const isDefaultActive = currentProfileId === DEFAULT_ID;

  const activeProfile = isDefaultActive
    ? null
    : currentProfiles.find((p) => p.id === currentProfileId) ?? null;

  const activeProfileName = isDefaultActive
    ? "Default"
    : activeProfile?.name ?? "Default";

  const bookmarkCount = Object.values(profilesByVariant)
    .flat()
    .filter(p => p.bookmarked).length;

  const supportsGoal = activeVariant !== "coralstone";

  // Check if editing settings differ from stored profile
  const isDirty = activeProfile
    ? JSON.stringify(currentEditingSettings) !== JSON.stringify(activeProfile.settings)
    : !isDefaultActive;

  // ── Data fetching ─────────────────────────────────────────────

  useEffect(() => {
    Promise.all(
      GALLERY_VARIANTS.map((v) =>
        fetchProfiles(v).then((profiles) => [v, profiles] as const)
      )
    ).then((results) => {
      const map: Record<GalleryVariant, GalleryProfile[]> = {
        thicken: [],
        coralstone: [],
        coralstonedamped: [],
        coralmorph: [],
      };
      for (const [v, profiles] of results) {
        map[v] = profiles;
      }
      setProfilesByVariant(map);
    });
  }, []);

  // ── Audio loop ─────────────────────────────────────────────────

  useEffect(() => {
    let raf: number;
    const update = () => {
      if (audioActive) {
        setAudioData(audioService.getAudioData());
      } else {
        setAudioData(ZERO_AUDIO);
      }
      raf = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(raf);
  }, [audioActive]);

  // ── Goal loop ──────────────────────────────────────────────────

  useEffect(() => {
    if (!isLooping) return;
    const ms = editingSettings[activeVariant].thickenSpeed * 1000;
    const id = setInterval(() => setGoal((p) => (p === 0 ? 1 : 0)), ms);
    return () => clearInterval(id);
  }, [isLooping, activeVariant, editingSettings]);

  // ── Cell selection ────────────────────────────────────────────

  const selectProfile = useCallback(
    (variant: GalleryVariant, profileId: string) => {
      setActiveVariant(variant);
      setActiveProfileId((prev) => ({ ...prev, [variant]: profileId }));

      // Load the profile's settings into editing state
      if (profileId === DEFAULT_ID) {
        setEditingSettings((prev) => ({
          ...prev,
          [variant]: { ...GALLERY_DEFAULTS[variant] },
        }));
      } else {
        const profile = profilesByVariant[variant].find(
          (p) => p.id === profileId
        );
        if (profile) {
          setEditingSettings((prev) => ({
            ...prev,
            [variant]: { ...profile.settings },
          }));
        }
      }
    },
    [profilesByVariant]
  );

  // ── Profile CRUD ──────────────────────────────────────────────

  const deleteProfile = useCallback(
    async (variant: GalleryVariant, profileId: string) => {
      const current = profilesByVariant[variant];
      const next = current.filter((p) => p.id !== profileId);
      setProfilesByVariant((prev) => ({ ...prev, [variant]: next }));

      // If deleted the active one, fall back to Default
      if (activeProfileId[variant] === profileId) {
        setActiveProfileId((prev) => ({ ...prev, [variant]: DEFAULT_ID }));
        setEditingSettings((prev) => ({
          ...prev,
          [variant]: { ...GALLERY_DEFAULTS[variant] },
        }));
      }

      await persistProfiles(variant, next);
    },
    [profilesByVariant, activeProfileId]
  );

  const saveProfile = useCallback(
    async (name: string) => {
      const variant = activeVariant;
      const profile: GalleryProfile = {
        id: `g-${crypto.randomUUID()}`,
        name,
        settings: { ...editingSettings[variant] },
        lastModified: Date.now(),
      };
      const next = [...profilesByVariant[variant], profile];
      setProfilesByVariant((prev) => ({ ...prev, [variant]: next }));
      setActiveProfileId((prev) => ({ ...prev, [variant]: profile.id }));
      await persistProfiles(variant, next);
    },
    [activeVariant, editingSettings, profilesByVariant]
  );

  const updateProfile = useCallback(async () => {
    const variant = activeVariant;
    const id = activeProfileId[variant];
    if (id === DEFAULT_ID) return;

    const next = profilesByVariant[variant].map((p) =>
      p.id === id
        ? { ...p, settings: { ...editingSettings[variant] }, lastModified: Date.now() }
        : p
    );
    setProfilesByVariant((prev) => ({ ...prev, [variant]: next }));
    await persistProfiles(variant, next);
  }, [activeVariant, activeProfileId, editingSettings, profilesByVariant]);

  // ── Bookmark toggle ─────────────────────────────────────────

  const toggleBookmark = useCallback(async (variant: GalleryVariant, profileId: string) => {
    if (profileId === DEFAULT_ID) return;
    const next = profilesByVariant[variant].map(p =>
      p.id === profileId ? { ...p, bookmarked: !p.bookmarked } : p
    );
    setProfilesByVariant(prev => ({ ...prev, [variant]: next }));
    await persistProfiles(variant, next);
  }, [profilesByVariant]);

  // ── Nav bar callbacks ─────────────────────────────────────────

  const handleVariantChange = useCallback(
    (v: GalleryVariant) => {
      setActiveVariant(v);
      // Scroll to that section
      const el = sectionRefs.current[v];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      // Reset goal if new variant doesn't support it
      if (v === "coralstone") {
        setGoal(0);
        setIsLooping(false);
      }
      // Select Default for the new variant
      selectProfile(v, activeProfileId[v]);
    },
    [activeProfileId, selectProfile]
  );

  const handleProfileSelectFromNav = useCallback(
    (index: number) => {
      const variant = activeVariant;
      if (index === -1) {
        // Select Default
        selectProfile(variant, DEFAULT_ID);
      } else {
        const profiles = profilesByVariant[variant];
        if (profiles[index]) {
          selectProfile(variant, profiles[index].id);
        }
      }
    },
    [activeVariant, profilesByVariant, selectProfile]
  );

  const handleSettingsChange = useCallback(
    (partial: Partial<GallerySettings>) => {
      setEditingSettings((prev) => ({
        ...prev,
        [activeVariant]: { ...prev[activeVariant], ...partial },
      }));
    },
    [activeVariant]
  );

  const handleSave = useCallback(
    (name: string) => {
      saveProfile(name);
    },
    [saveProfile]
  );

  // ── Get the settings to display for a given cell ──────────────

  const getCellSettings = useCallback(
    (variant: GalleryVariant, profileId: string): GallerySettings => {
      // If this cell is the active one being edited, show the editing settings
      if (
        variant === activeVariant &&
        profileId === activeProfileId[variant]
      ) {
        return editingSettings[variant];
      }
      // Otherwise show stored profile settings
      if (profileId === DEFAULT_ID) {
        return GALLERY_DEFAULTS[variant];
      }
      const profile = profilesByVariant[variant].find(
        (p) => p.id === profileId
      );
      return profile ? profile.settings : GALLERY_DEFAULTS[variant];
    },
    [activeVariant, activeProfileId, editingSettings, profilesByVariant]
  );

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white select-none">
      {/* Audio controls (floating top-right) */}
      <GalleryAudioControls onAudioActive={setAudioActive} />

      {/* Nav bar toggle button (top-right) */}
      <button
        onClick={() => setShowNavBar((p) => !p)}
        className="fixed top-4 right-4 z-50 px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
      >
        {showNavBar ? "Hide Controls" : "Show Controls"}
      </button>

      {/* Page content with bottom padding for nav bar */}
      <div className="px-8 pt-8 pb-32">
        {GALLERY_VARIANTS.map((variant) => {
          const profiles = profilesByVariant[variant];
          const isActiveSection = variant === activeVariant;

          return (
            <div
              key={variant}
              ref={(el) => {
                sectionRefs.current[variant] = el;
              }}
              className="mb-12"
            >
              {/* Section header */}
              <h2
                className="text-2xl font-bold mb-6"
                style={{ color: "#1a1a2e" }}
              >
                {GALLERY_VARIANT_LABELS[variant]}
              </h2>

              {/* Seamless grid */}
              <div
                className="inline-flex flex-wrap"
                style={{
                  marginLeft: -GALLERY_BORDER,
                  marginTop: -GALLERY_BORDER,
                }}
              >
                {/* Default cell (always first, protected) */}
                <GalleryCell
                  variant={variant}
                  settings={getCellSettings(variant, DEFAULT_ID)}
                  profileName="Default"
                  profileId={DEFAULT_ID}
                  isActive={activeProfileId[variant] === DEFAULT_ID && isActiveSection}
                  isDefault={true}
                  isBookmarked={false}
                  audioData={audioData}
                  goal={variant === activeVariant ? goal : 0}
                  isActiveSection={isActiveSection}
                  onSelect={() => selectProfile(variant, DEFAULT_ID)}
                />

                {/* Saved profile cells */}
                {profiles.map((profile) => (
                  <GalleryCell
                    key={profile.id}
                    variant={variant}
                    settings={getCellSettings(variant, profile.id)}
                    profileName={profile.name}
                    profileId={profile.id}
                    isActive={activeProfileId[variant] === profile.id && isActiveSection}
                    isDefault={false}
                    isBookmarked={!!profile.bookmarked}
                    audioData={audioData}
                    goal={variant === activeVariant ? goal : 0}
                    isActiveSection={isActiveSection}
                    onSelect={() => selectProfile(variant, profile.id)}
                    onDelete={() => deleteProfile(variant, profile.id)}
                    onBookmarkToggle={() => toggleBookmark(variant, profile.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom navigation bar */}
      {showNavBar && (
        <GalleryNavBar
          activeVariant={activeVariant}
          activeProfileName={activeProfileName}
          profileNames={currentProfiles.map((p) => p.name)}
          settings={currentEditingSettings}
          isDirty={isDirty}
          isDefault={isDefaultActive}
          isBookmarked={!!activeProfile?.bookmarked}
          bookmarkCount={bookmarkCount}
          suggestedName={pickUnusedName(profilesByVariant)}
          onVariantChange={handleVariantChange}
          onProfileSelect={handleProfileSelectFromNav}
          onSettingsChange={handleSettingsChange}
          onSave={handleSave}
          onUpdate={updateProfile}
          onBookmarkToggle={() => toggleBookmark(activeVariant, currentProfileId)}
          goal={goal}
          hasGoal={supportsGoal}
          isLooping={isLooping}
          onGoalToggle={() => setGoal((p) => (p === 0 ? 1 : 0))}
          onLoopToggle={() => setIsLooping((p) => !p)}
        />
      )}
    </div>
  );
};

export default GalleryScene;
