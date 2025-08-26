
import Cors from 'micro-cors';
import Stripe from 'stripe';
import { json } from 'micro';

const cors = Cors();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function allowOrigin(res) {
  const allowed = (process.env.ALLOWED_ORIGINS || '*');
  res.setHeader('Access-Control-Allow-Origin', allowed);
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
}

export default cors(async (req, res) => {
  allowOrigin(res);
  if (req.method === 'OPTIONS') return res.end();
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  try {
    const body = await json(req);
    const { userId, email } = body || {};

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        { price: process.env.STRIPE_PRICE_ID, quantity: 1 }
      ],
      customer_email: email,
      metadata: { userId },
      success_url: 'https://example.com/success',
      cancel_url: 'https://example.com/cancel'
    });

    return res.status(200).json({ ok: true, url: session.url });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: 'stripe_create_session_failed' });
  }
});
