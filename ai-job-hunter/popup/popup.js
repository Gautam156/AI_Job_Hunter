
import { getProfile } from '../scripts/storage.js';
import { fetchJobs } from '../scripts/ai.js';

const resultsEl = document.getElementById('results');
const btnSearch = document.getElementById('btnSearch');
const planBadge = document.getElementById('planBadge');

async function initPlanBadge() {
  const res = await chrome.runtime.sendMessage({ type: 'AJH_GET_PLAN' });
  const plan = (res && res.plan) ? res.plan : 'free';
  planBadge.textContent = String(plan).toUpperCase();
}

function renderJobs(jobs) {
  resultsEl.innerHTML = '';
  jobs.forEach(job => {
    const li = document.createElement('li');
    li.className = 'item';
    li.innerHTML = `
      <div class="title">${job.title || ''}</div>
      <div class="meta">${job.company || ''} • ${job.location || ''}</div>
      <div class="actions">
        <button data-open="${job.url || ''}">Open</button>
        <button class="ghost" data-open="${job.url || ''}">Apply</button>
      </div>`;
    resultsEl.appendChild(li);
  });
}

async function onSearch() {
  btnSearch.disabled = true;
  try {
    const profile = await getProfile();
    if (!profile?.name) {
      if (confirm('No profile found. Create one now?')) {
        chrome.tabs.create({ url: chrome.runtime.getURL('profile/profile.html') });
      }
      return;
    }
    const q = (profile.skills || []).slice(0, 5).join(' ');
    const location = 'India'; // TODO: add location field in profile
    const jobs = await fetchJobs({ q, location, userId: profile?.id });
    renderJobs(jobs);
  } catch (e) {
    alert(`Job search failed: ${e.message}`);
  } finally {
    btnSearch.disabled = false;
  }
}

resultsEl.addEventListener('click', async (e) => {
  const a = e.target.closest('button');
  if (!a) return;
  const openUrl = a.dataset.open;
  if (openUrl) chrome.tabs.create({ url: openUrl });
});

document.getElementById('openProfile').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('profile/profile.html') });
});

document.getElementById('openOptions').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

btnSearch.addEventListener('click', onSearch);
initPlanBadge();
