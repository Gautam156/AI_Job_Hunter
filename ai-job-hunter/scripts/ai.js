
import { API_BASE } from './config.js';
import { getPlan, getProfile, getUsage, bumpUsage } from './storage.js';

function headers(userId) {
  return {
    'Content-Type': 'application/json',
    'x-user-id': userId || 'anonymous'
  };
}

export async function generateCoverLetter({ profile, job }) {
  const plan = await getPlan();
  const usage = await getUsage();
  // Client-side guard (backend also enforces real limits)
  const FREE_LIMIT = 3;
  if (plan === 'free' && usage.coverCount >= FREE_LIMIT) {
    throw new Error(`Free plan limit reached (${FREE_LIMIT}/day). Upgrade to Pro for more.`);
  }

  const r = await fetch(`${API_BASE}/cover-letter`, {
    method: 'POST',
    headers: headers(profile?.id),
    body: JSON.stringify({ profile, job })
  });
  const data = await r.json();
  if (!data.ok) throw new Error(data.error || 'cover_letter_failed');
  await bumpUsage('cover');
  return data.letter;
}

export async function fetchJobs({ q, location, userId }) {
  const plan = await getPlan();
  const usage = await getUsage();
  const FREE_LIMIT = 5;
  if (plan === 'free' && usage.searchCount >= FREE_LIMIT) {
    throw new Error(`Free plan job search limit reached (${FREE_LIMIT}/day). Upgrade to Pro for more.`);
  }

  const r = await fetch(`${API_BASE}/jobs?q=${encodeURIComponent(q)}&location=${encodeURIComponent(location)}`, {
    headers: headers(userId)
  });
  const data = await r.json();
  if (!data.ok) throw new Error(data.error || 'job_search_failed');
  await bumpUsage('search');
  return data.results || [];
}
