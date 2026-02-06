import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  RadialVariant,
  RadialSettings,
  RadialProfile,
  RADIAL_VARIANTS,
  RADIAL_VARIANT_LABELS,
  RADIAL_DEFAULTS,
  RADIAL_API_KEYS,
  pickUnusedName,
} from "../types";
import { audioService } from "../services/audioService";
import RadialGalleryAudioControls from "./RadialGalleryAudioControls";
import RadialGalleryCell, { CELL_BORDER } from "./RadialGalleryCell";
import RadialGalleryNavBar from "./RadialGalleryNavBar";

const DEFAULT_ID = "default";

/* ── Migrate old tick* keys to bar* ── */
function migrateSettings(s: Record<string, unknown>): Record<string, unknown> {
  const renames: Record<string, string> = {
    tickWidth: "barWidth", tickGap: "barGap", tickColor: "barColor",
    minTickLength: "minBarLength", maxTickLength: "maxBarLength",
  };
  const out = { ...s };
  for (const [old, cur] of Object.entries(renames)) {
    if (old in out && !(cur in out)) out[cur] = out[old];
    delete out[old];
  }
  return out;
}

/* ── API helpers ── */

async function fetchProfiles(variant: RadialVariant): Promise<RadialProfile[]> {
  try {
    const res = await fetch(`/api/studio-profiles?variant=${RADIAL_API_KEYS[variant]}`);
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((p: RadialProfile) => ({
      ...p,
      settings: migrateSettings(p.settings as unknown as Record<string, unknown>) as unknown as RadialSettings,
    }));
  } catch { return []; }
}

async function persistProfiles(variant: RadialVariant, profiles: RadialProfile[]) {
  try {
    await fetch(`/api/studio-profiles?variant=${RADIAL_API_KEYS[variant]}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profiles),
    });
  } catch { /* ignore */ }
}

/* ── Component ── */

export default function RadialPlayground() {
  // ── State ────────────────────────────────────────────────────

  const [activeVariant, setActiveVariant] = useState<RadialVariant>("outward");

  const [activeProfileId, setActiveProfileId] = useState<Record<RadialVariant, string>>({
    outward: DEFAULT_ID, bidirectional: DEFAULT_ID, inward: DEFAULT_ID,
  });

  const [profilesByVariant, setProfilesByVariant] = useState<Record<RadialVariant, RadialProfile[]>>({
    outward: [], bidirectional: [], inward: [],
  });

  const [editingSettings, setEditingSettings] = useState<Record<RadialVariant, RadialSettings>>({
    outward: { ...RADIAL_DEFAULTS.outward },
    bidirectional: { ...RADIAL_DEFAULTS.bidirectional },
    inward: { ...RADIAL_DEFAULTS.inward },
  });

  const [audioActive, setAudioActive] = useState(false);
  const [showEnvelopeCeiling, setShowEnvelopeCeiling] = useState(false);
  const [freqData, setFreqData] = useState<Uint8Array | null>(null);

  const sectionRefs = useRef<Record<RadialVariant, HTMLDivElement | null>>({
    outward: null, bidirectional: null, inward: null,
  });

  // Pending scroll target — consumed by useEffect after React commits
  const pendingScrollRef = useRef<{ variant: RadialVariant; profileId: string } | null>(null);

  // ── Derived ──────────────────────────────────────────────────

  const currentProfileId = activeProfileId[activeVariant];
  const currentProfiles = profilesByVariant[activeVariant];
  const currentSettings = editingSettings[activeVariant];
  const isDefaultActive = currentProfileId === DEFAULT_ID;

  const activeProfile = isDefaultActive
    ? null
    : currentProfiles.find(p => p.id === currentProfileId) ?? null;

  const activeProfileName = isDefaultActive
    ? "Default"
    : activeProfile?.name ?? "Default";

  const bookmarkCount = Object.values(profilesByVariant)
    .flat()
    .filter(p => p.bookmarked).length;

  // Dirty check: compare editing settings against stored profile (normalized with defaults)
  const isDirty = (() => {
    if (isDefaultActive) {
      return JSON.stringify(RADIAL_DEFAULTS[activeVariant]) !== JSON.stringify(currentSettings);
    }
    if (!activeProfile) return false;
    const stored = { ...RADIAL_DEFAULTS[activeVariant], ...activeProfile.settings };
    return JSON.stringify(stored) !== JSON.stringify(currentSettings);
  })();

  // ── Audio loop ───────────────────────────────────────────────

  useEffect(() => {
    let raf: number;
    const tick = () => {
      if (audioActive) {
        const data = audioService.getFrequencyData();
        setFreqData(data ? new Uint8Array(data) : null);
      } else {
        setFreqData(null);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [audioActive]);

  // ── Data fetching ────────────────────────────────────────────

  useEffect(() => {
    Promise.all(
      RADIAL_VARIANTS.map(v => fetchProfiles(v).then(profiles => [v, profiles] as const))
    ).then(results => {
      const map: Record<RadialVariant, RadialProfile[]> = { outward: [], bidirectional: [], inward: [] };
      for (const [v, profiles] of results) map[v] = profiles;
      setProfilesByVariant(map);
    });
  }, []);

  // ── Cell selection ───────────────────────────────────────────

  const selectProfile = useCallback((variant: RadialVariant, profileId: string) => {
    setActiveVariant(variant);
    setActiveProfileId(prev => ({ ...prev, [variant]: profileId }));

    if (profileId === DEFAULT_ID) {
      setEditingSettings(prev => ({ ...prev, [variant]: { ...RADIAL_DEFAULTS[variant] } }));
    } else {
      const profile = profilesByVariant[variant].find(p => p.id === profileId);
      if (profile) {
        setEditingSettings(prev => ({
          ...prev,
          [variant]: { ...RADIAL_DEFAULTS[variant], ...profile.settings },
        }));
      }
    }
  }, [profilesByVariant]);

  // ── Scroll helper ────────────────────────────────────────────
  // Sets a pending scroll target. The useEffect below picks it up
  // after React has committed DOM changes, so positions are stable.

  const scrollToCell = useCallback((v: RadialVariant, profileId: string) => {
    pendingScrollRef.current = { variant: v, profileId };
  }, []);

  // Execute pending scroll after every render
  useEffect(() => {
    const pending = pendingScrollRef.current;
    if (!pending) return;
    pendingScrollRef.current = null;
    const el = document.querySelector(
      `[data-cell-key="${pending.variant}:${pending.profileId}"]`
    ) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  // ── Profile CRUD ─────────────────────────────────────────────

  const deleteProfile = useCallback(async (variant: RadialVariant, profileId: string) => {
    const next = profilesByVariant[variant].filter(p => p.id !== profileId);
    setProfilesByVariant(prev => ({ ...prev, [variant]: next }));
    if (activeProfileId[variant] === profileId) {
      setActiveProfileId(prev => ({ ...prev, [variant]: DEFAULT_ID }));
      setEditingSettings(prev => ({ ...prev, [variant]: { ...RADIAL_DEFAULTS[variant] } }));
    }
    await persistProfiles(variant, next);
  }, [profilesByVariant, activeProfileId]);

  const saveProfile = useCallback(async (name: string) => {
    const variant = activeVariant;
    const profile: RadialProfile = {
      id: `r-${crypto.randomUUID()}`,
      name,
      settings: { ...editingSettings[variant] },
      lastModified: Date.now(),
    };
    const next = [...profilesByVariant[variant], profile];
    setProfilesByVariant(prev => ({ ...prev, [variant]: next }));
    setActiveProfileId(prev => ({ ...prev, [variant]: profile.id }));
    await persistProfiles(variant, next);
    scrollToCell(variant, profile.id);
  }, [activeVariant, editingSettings, profilesByVariant, scrollToCell]);

  const updateProfile = useCallback(async () => {
    const variant = activeVariant;
    const id = activeProfileId[variant];
    if (id === DEFAULT_ID) return;
    const next = profilesByVariant[variant].map(p =>
      p.id === id ? { ...p, settings: { ...editingSettings[variant] }, lastModified: Date.now() } : p
    );
    setProfilesByVariant(prev => ({ ...prev, [variant]: next }));
    await persistProfiles(variant, next);
  }, [activeVariant, activeProfileId, editingSettings, profilesByVariant]);

  // ── Bookmark toggle ─────────────────────────────────────────

  const toggleBookmark = useCallback(async (variant: RadialVariant, profileId: string) => {
    if (profileId === DEFAULT_ID) return;
    const next = profilesByVariant[variant].map(p =>
      p.id === profileId ? { ...p, bookmarked: !p.bookmarked } : p
    );
    setProfilesByVariant(prev => ({ ...prev, [variant]: next }));
    await persistProfiles(variant, next);
  }, [profilesByVariant]);

  // ── Nav bar callbacks ────────────────────────────────────────

  const handleVariantChange = useCallback((v: RadialVariant) => {
    setActiveVariant(v);
    const id = activeProfileId[v];
    scrollToCell(v, id);
    selectProfile(v, activeProfileId[v]);
  }, [activeProfileId, selectProfile, scrollToCell]);

  const handleProfileSelectFromNav = useCallback((index: number) => {
    const variant = activeVariant;
    if (index === -1) {
      selectProfile(variant, DEFAULT_ID);
      scrollToCell(variant, DEFAULT_ID);
    } else {
      const profiles = profilesByVariant[variant];
      if (profiles[index]) {
        selectProfile(variant, profiles[index].id);
        scrollToCell(variant, profiles[index].id);
      }
    }
  }, [activeVariant, profilesByVariant, selectProfile, scrollToCell]);

  const handleSettingsChange = useCallback((partial: Partial<RadialSettings>) => {
    setEditingSettings(prev => ({
      ...prev,
      [activeVariant]: { ...prev[activeVariant], ...partial },
    }));
  }, [activeVariant]);

  const handleReset = useCallback(() => {
    setEditingSettings(prev => ({
      ...prev,
      [activeVariant]: { ...RADIAL_DEFAULTS[activeVariant] },
    }));
    setActiveProfileId(prev => ({ ...prev, [activeVariant]: DEFAULT_ID }));
  }, [activeVariant]);

  // ── Get settings for a cell ──────────────────────────────────

  const getCellSettings = useCallback((variant: RadialVariant, profileId: string): RadialSettings => {
    if (variant === activeVariant && profileId === activeProfileId[variant]) {
      return editingSettings[variant];
    }
    if (profileId === DEFAULT_ID) return RADIAL_DEFAULTS[variant];
    const profile = profilesByVariant[variant].find(p => p.id === profileId);
    return profile ? { ...RADIAL_DEFAULTS[variant], ...profile.settings } : RADIAL_DEFAULTS[variant];
  }, [activeVariant, activeProfileId, editingSettings, profilesByVariant]);

  // ── Render ───────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0F0F11] text-white select-none">
      <RadialGalleryAudioControls onAudioActive={setAudioActive} />

      <div className="px-8 pt-8 pb-32">
        {RADIAL_VARIANTS.map((variant, variantIndex) => {
          const profiles = profilesByVariant[variant];
          const isActiveSection = variant === activeVariant;

          return (
            <div
              key={variant}
              ref={el => { sectionRefs.current[variant] = el; }}
              className="mb-12"
            >
              <h2 className="text-2xl font-bold mb-6 text-white">
                {variantIndex + 1} — {RADIAL_VARIANT_LABELS[variant]}
              </h2>

              <div
                className="inline-flex flex-wrap"
                style={{ marginLeft: -CELL_BORDER, marginTop: -CELL_BORDER }}
              >
                {/* Default cell */}
                <RadialGalleryCell
                  variant={variant}
                  settings={getCellSettings(variant, DEFAULT_ID)}
                  profileName="Default"
                  profileId={DEFAULT_ID}
                  isActive={activeProfileId[variant] === DEFAULT_ID && isActiveSection}
                  isDefault={true}
                  isBookmarked={false}
                  frequencyData={isActiveSection ? freqData : null}
                  isActiveSection={isActiveSection}
                  showEnvelopeCeiling={isActiveSection ? showEnvelopeCeiling : false}
                  onSelect={() => selectProfile(variant, DEFAULT_ID)}
                />

                {/* Saved profile cells */}
                {profiles.map(profile => (
                  <RadialGalleryCell
                    key={profile.id}
                    variant={variant}
                    settings={getCellSettings(variant, profile.id)}
                    profileName={profile.name}
                    profileId={profile.id}
                    isActive={activeProfileId[variant] === profile.id && isActiveSection}
                    isDefault={false}
                    isBookmarked={!!profile.bookmarked}
                    frequencyData={isActiveSection ? freqData : null}
                    isActiveSection={isActiveSection}
                    showEnvelopeCeiling={isActiveSection ? showEnvelopeCeiling : false}
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

      <RadialGalleryNavBar
        activeVariant={activeVariant}
        activeProfileName={activeProfileName}
        profileNames={currentProfiles.map(p => p.name)}
        settings={currentSettings}
        isDirty={isDirty}
        isDefault={isDefaultActive}
        isBookmarked={!!activeProfile?.bookmarked}
        bookmarkCount={bookmarkCount}
        suggestedName={pickUnusedName(profilesByVariant)}
        onVariantChange={handleVariantChange}
        onProfileSelect={handleProfileSelectFromNav}
        onSettingsChange={handleSettingsChange}
        onSave={saveProfile}
        onUpdate={updateProfile}
        onReset={handleReset}
        onBookmarkToggle={() => toggleBookmark(activeVariant, currentProfileId)}
        showEnvelopeCeiling={showEnvelopeCeiling}
        onShowEnvelopeCeilingChange={setShowEnvelopeCeiling}
      />
    </div>
  );
}
