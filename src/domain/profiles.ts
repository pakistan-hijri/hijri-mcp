/** Canonical prayer-time profiles accepted by hijri-api. */
import { AppError } from "../errors.js";
import type { ProfileId, PublicProfile } from "../types.js";

export const PROFILES = [
  { id: "sunni_hanafi", label: "Sunni (Hanafi)" },
  { id: "sunni_asr1", label: "Sunni (Asr 1)" },
  { id: "shia_jafari", label: "Shia (Jafari)" },
] as const satisfies readonly PublicProfile[];

const PROFILE_IDS = PROFILES.map((profile) => profile.id) as ProfileId[];

export function isProfileId(value: string): value is ProfileId {
  return PROFILE_IDS.includes(value as ProfileId);
}

export function assertProfile(value: string): ProfileId {
  if (!isProfileId(value)) {
    throw new AppError("UNKNOWN_PROFILE", `Unknown profile '${value}'.`, {
      details: { accepted: PROFILE_IDS, value },
    });
  }
  return value;
}

export function profileLabel(profile: ProfileId): string {
  const found = PROFILES.find((entry) => entry.id === profile);
  if (!found) {
    throw new AppError("UNKNOWN_PROFILE", `Unknown profile '${profile}'.`, {
      details: { accepted: PROFILE_IDS, value: profile },
    });
  }
  return found.label;
}

export function publicProfiles(): PublicProfile[] {
  return PROFILES.map((profile) => ({ ...profile }));
}
