
import { getSettings, saveSettings, getPlan } from '../scripts/storage.js';
import { API_BASE } from '../scripts/config.js';

const $ = (id) => document.getElementById(id);

async function load() {
  const settings = await getSettings();
  const plan = await getPlan();
  $('plan').textContent = String(plan).toUpperCase();
  $('autofillEnabled').checked = !!settings.autofillEnabled;
  $('coverLetterTone').value = settings.coverLetterTone || 'professional';
}

async function save() {
  await saveSettings({
    autofillEnabled: $('autofillEnabled').checked,
    coverLetterTone: $('coverLetterTone').value
  });
  alert('Settings saved.');
}

async function upgrade() {
  // Requires backend Stripe create-session endpoint; opens Checkout in a new tab
  const profile = await chrome.storage.sync.get(['ajh_profile']).then(r => r.ajh_profile);
  const r = await fetch(`${API_BASE}/stripe/create-session`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: profile?.id, email: profile?.email })
  });
  const data = await r.json();
  if (data?.ok && data.url) {
    chrome.tabs.create({ url: data.url });
  } else {
    alert('Failed to start checkout');
  }
}

load();
$('save').addEventListener('click', save);
$('upgrade').addEventListener('click', upgrade);
