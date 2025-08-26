
import Cors from 'micro-cors';
import { json } from 'micro';
import OpenAI from 'openai';

const cors = Cors();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function allowOrigin(res) {
  const allowed = (process.env.ALLOWED_ORIGINS || '*');
  res.setHeader('Access-Control-Allow-Origin', allowed);
  res.setHeader('Access-Control-Allow-Headers', 'content-type,x-user-id');
}

function todayKey() {
  return new Date().toISOString().slice(0,10);
}

// Simple in-memory per-day limiter (stateless deployments may reset; add DB later)
const FREE_LIMIT = Number(process.env.FREE_LIMIT_COVER || 3);
const PRO_LIMIT = Number(process.env.PRO_LIMIT_COVER || 1000);
const counters = new Map(); // key: `${date}:${userId}` -> count

function bumpAndCheck(userId, plan) {
  const date = todayKey();
  const key = `${date}:${userId || 'anonymous'}`;
  const next = (counters.get(key) || 0) + 1;
  counters.set(key, next);
  const limit = plan === 'pro' ? PRO_LIMIT : FREE_LIMIT;
  if (next > limit) return { ok: false, error: 'limit_exceeded' };
  return { ok: true };
}

export default cors(async (req, res) => {
  allowOrigin(res);
  if (req.method === 'OPTIONS') return res.end();
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  try {
    const userId = req.headers['x-user-id'] || 'anonymous';
    const body = await json(req);
    const { profile, job } = body || {};

    // NOTE: Without a persistent DB, we treat everyone as FREE; change when webhook/DB added.
    const plan = 'free';

    const lim = bumpAndCheck(userId, plan);
    if (!lim.ok) return res.status(402).json({ ok: false, error: 'free_plan_daily_cover_letter_limit_reached' });

    const skills = Array.isArray(profile?.skills) ? profile.skills.join(', ') : '';
    const system = `You are an expert recruiter writing tailored, concise cover letters. Keep it under 220 words unless specified.`;
    const user = `Write a cover letter for ${profile?.name || 'the candidate'} applying for ${job?.title || 'the role'} at ${job?.company || 'the company'}.` +
      ` Candidate skills: ${skills}. Candidate experience: ${profile?.experience || ''}.` +
      ` Tone: ${profile?.coverLetterTone || 'professional'}.`;

    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      temperature: 0.7
    });

    const text = resp.choices?.[0]?.message?.content?.trim() || '';
    return res.status(200).json({ ok: true, letter: text });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: 'cover_letter_failed' });
  }
});
