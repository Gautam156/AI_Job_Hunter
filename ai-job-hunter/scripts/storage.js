
// Unified storage helpers + schema/versioning + plan management

export const STORAGE_KEYS = {
  PROFILE: 'ajh_profile',
  RESUME_BLOB: 'ajh_resume_blob', // { name, dataUrl }
  PLAN: 'ajh_plan', // 'free' | 'pro'
  SETTINGS: 'ajh_settings',
  MIGRATION: 'ajh_migration',
  USAGE: 'ajh_usage' // { date: 'YYYY-MM-DD', coverCount: number, searchCount: number }
};

export const DEFAULTS = {
  profile: {
    id: null, // generated UUID
    name: '',
    email: '',
    phone: '',
    skills: [], // ["JavaScript","React",...]
    experience: '', // free text
    lastUpdated: 0
  },
  plan: 'free',
  settings: {
    autofillEnabled: true,
    coverLetterTone: 'professional' // professional | friendly | concise
  },
  migration: { version: 1 },
  usage: { date: '', coverCount: 0, searchCount: 0 }
};

export async function get(key, fallback = null) {
  const r = await chrome.storage.sync.get([key]);
  return r[key] ?? fallback;
}

export async function set(key, value) {
  await chrome.storage.sync.set({ [key]: value });
}

export async function getProfile() {
  const p = await get(STORAGE_KEYS.PROFILE);
  if (!p) return DEFAULTS.profile;
  return p;
}

export async function saveProfile(profile) {
  const toSave = { ...DEFAULTS.profile, ...profile, lastUpdated: Date.now() };
  await set(STORAGE_KEYS.PROFILE, toSave);
  return toSave;
}

export async function getPlan() {
  return (await get(STORAGE_KEYS.PLAN, DEFAULTS.plan));
}

export async function setPlan(plan) {
  await set(STORAGE_KEYS.PLAN, plan);
}

export async function getSettings() {
  return (await get(STORAGE_KEYS.SETTINGS, DEFAULTS.settings));
}

export async function saveSettings(settings) {
  const merged = { ...DEFAULTS.settings, ...settings };
  await set(STORAGE_KEYS.SETTINGS, merged);
  return merged;
}

export async function saveResumeBlob(file) {
  // store as dataUrl to keep simple in MV3
  const dataUrl = await new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
  const payload = { name: file.name, dataUrl };
  await set(STORAGE_KEYS.RESUME_BLOB, payload);
  return payload;
}

export async function getResumeBlob() {
  return (await get(STORAGE_KEYS.RESUME_BLOB));
}

export function uuid() {
  return crypto.randomUUID();
}

// Simple client-side counter (defense-in-depth; real limits in backend)
export async function getUsage() {
  const u = await get(STORAGE_KEYS.USAGE, DEFAULTS.usage);
  const today = new Date().toISOString().slice(0,10);
  if (u.date !== today) {
    const fresh = { date: today, coverCount: 0, searchCount: 0 };
    await set(STORAGE_KEYS.USAGE, fresh);
    return fresh;
  }
  return u;
}

export async function bumpUsage(kind) {
  const u = await getUsage();
  if (kind === 'cover') u.coverCount += 1;
  if (kind === 'search') u.searchCount += 1;
  await set(STORAGE_KEYS.USAGE, u);
  return u;
}
