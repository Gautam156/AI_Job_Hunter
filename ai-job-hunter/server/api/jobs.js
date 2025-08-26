
import Cors from 'micro-cors';
import fetch from 'node-fetch';

const cors = Cors();

function allowOrigin(res) {
  const allowed = (process.env.ALLOWED_ORIGINS || '*');
  res.setHeader('Access-Control-Allow-Origin', allowed);
  res.setHeader('Access-Control-Allow-Headers', 'content-type,x-user-id');
}

const FREE_LIMIT = Number(process.env.FREE_LIMIT_JOBS || 5);
const PRO_LIMIT = Number(process.env.PRO_LIMIT_JOBS || 1000);
const counters = new Map();
function todayKey() { return new Date().toISOString().slice(0,10); }
function bumpAndCheck(userId, plan) {
  const key = `${todayKey()}:${userId || 'anonymous'}:jobs`;
  const next = (counters.get(key) || 0) + 1;
  counters.set(key, next);
  const limit = plan === 'pro' ? PRO_LIMIT : FREE_LIMIT;
  if (next > limit) return { ok: false, error: 'limit_exceeded' };
  return { ok: true };
}

export default cors(async (req, res) => {
  allowOrigin(res);
  if (req.method === 'OPTIONS') return res.end();

  try {
    const userId = req.headers['x-user-id'] || 'anonymous';
    const url = new URL(req.url, 'http://localhost');
    const q = url.searchParams.get('q') || '';
    const location = url.searchParams.get('location') || '';
    const page = url.searchParams.get('page') || '1';

    const plan = 'free'; // TODO: switch to real plan lookup once DB/webhook wired.

    const lim = bumpAndCheck(userId, plan);
    if (!lim.ok) return res.status(402).json({ ok: false, error: 'free_plan_daily_job_search_limit_reached' });

    const r = await fetch(`https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(q + ' ' + location)}&page=${page}`, {
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
      }
    });

    const data = await r.json();
    const results = (data?.data || []).map((d) => ({
      id: d.job_id,
      title: d.job_title,
      company: d.employer_name,
      location: d.job_city || d.job_country,
      url: d.job_apply_link || d.job_google_link || ''
    }));

    return res.status(200).json({ ok: true, results });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: 'job_search_failed' });
  }
});
