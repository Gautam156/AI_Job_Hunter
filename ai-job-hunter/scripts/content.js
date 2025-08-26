
import { getProfile, getSettings } from './storage.js';
import { generateCoverLetter } from './ai.js';

const BUBBLE_ID = 'ajh-action-bubble';

function looksLikeJobForm(form) {
  const text = (form.innerText + ' ' + form.outerHTML).toLowerCase();
  const cues = ['resume', 'cv', 'cover letter', 'application', 'apply', 'job'];
  return cues.some(c => text.includes(c));
}

function ensureStyle() {
  if (document.getElementById('ajh-inline-style')) return;
  const style = document.createElement('style');
  style.id = 'ajh-inline-style';
  style.textContent = `
    #${BUBBLE_ID} { position: fixed; bottom: 24px; right: 24px; z-index: 2147483647; }
    #${BUBBLE_ID} .ajh-card { background: #111827; color: white; padding: 12px 14px; border-radius: 12px; box-shadow: 0 6px 24px rgba(0,0,0,0.25); font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; }
    #${BUBBLE_ID} button { margin-right: 8px; padding: 8px 10px; border: none; border-radius: 8px; cursor: pointer; }
    #${BUBBLE_ID} .primary { background: #3b82f6; color: white; }
    #${BUBBLE_ID} .secondary { background: #374151; color: white; }
  `;
  document.documentElement.appendChild(style);
}

function injectBubble() {
  if (document.getElementById(BUBBLE_ID)) return;
  ensureStyle();
  const wrap = document.createElement('div');
  wrap.id = BUBBLE_ID;
  wrap.innerHTML = `
    <div class="ajh-card">
      <strong>AI Job Hunter</strong><br/>
      <div style="margin-top:8px">
        <button id="ajh-autofill" class="primary">Autofill</button>
        <button id="ajh-cover" class="secondary">Generate Cover Letter</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);

  document.getElementById('ajh-autofill').addEventListener('click', handleAutofill);
  document.getElementById('ajh-cover').addEventListener('click', handleCoverLetter);
}

async function handleAutofill() {
  const profile = await getProfile();
  const settings = await getSettings();
  if (!settings.autofillEnabled) return alert('Autofill is disabled in settings');

  const fillMap = {
    name: ['name', 'full name', 'applicant name'],
    email: ['email', 'e-mail'],
    phone: ['phone', 'mobile'],
  };

  const inputs = Array.from(document.querySelectorAll('input, textarea'));
  for (const el of inputs) {
    const meta = `${(el.name||'').toLowerCase()} ${(el.id||'').toLowerCase()} ${(el.placeholder||'').toLowerCase()}`;
    if (fillMap.name.some(k => meta.includes(k)) && profile.name) el.value = profile.name;
    if (fillMap.email.some(k => meta.includes(k)) && profile.email) el.value = profile.email;
    if (fillMap.phone.some(k => meta.includes(k)) && profile.phone) el.value = profile.phone;
  }
  alert('AI Job Hunter: Basic autofill completed. Review before submitting.');
}

async function handleCoverLetter() {
  try {
    const profile = await getProfile();
    const title = document.querySelector('h1,h2')?.innerText || document.title || '';
    const job = { title, company: window.location.hostname };
    const letter = await generateCoverLetter({ profile, job });

    const textareas = Array.from(document.querySelectorAll('textarea'))
      .sort((a,b) => (b.rows||3) - (a.rows||3));
    if (textareas[0]) {
      textareas[0].value = letter;
      textareas[0].dispatchEvent(new Event('input', { bubbles: true }));
      alert('Cover letter generated and inserted.');
    } else {
      await navigator.clipboard.writeText(letter);
      alert('Cover letter copied to clipboard. Paste it into the form.');
    }
  } catch (e) {
    alert(`Cover letter failed: ${e.message}`);
  }
}

function scanAndMount() {
  const forms = Array.from(document.forms);
  if (forms.some(looksLikeJobForm)) {
    injectBubble();
    chrome.runtime.sendMessage({ type: 'AJH_APPLY_PAGE_DETECTED' });
  }
}

scanAndMount();
const mo = new MutationObserver(() => scanAndMount());
mo.observe(document.documentElement, { childList: true, subtree: true });

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === 'AJH_AUTOFILL_REQUEST') handleAutofill();
});
