
import { getProfile, saveProfile, saveResumeBlob, uuid } from '../scripts/storage.js';

const $ = (id) => document.getElementById(id);

async function load() {
  const p = await getProfile();
  if (!p.id) p.id = uuid();
  $('name').value = p.name || '';
  $('email').value = p.email || '';
  $('phone').value = p.phone || '';
  $('skills').value = (p.skills || []).join(', ');
  $('experience').value = p.experience || '';
}

async function save() {
  const current = await getProfile();
  const profile = {
    id: current.id || uuid(),
    name: $('name').value.trim(),
    email: $('email').value.trim(),
    phone: $('phone').value.trim(),
    skills: $('skills').value.split(',').map(s => s.trim()).filter(Boolean),
    experience: $('experience').value.trim()
  };
  await saveProfile(profile);

  const file = document.getElementById('resume').files?.[0];
  if (file) await saveResumeBlob(file);

  alert('Profile saved.');
}

load();
document.getElementById('save').addEventListener('click', save);
