
import Cors from 'micro-cors';
import Stripe from 'stripe';

const cors = Cors();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const config = { api: { bodyParser: false } };

function allowOrigin(res) {
  const allowed = (process.env.ALLOWED_ORIGINS || '*');
  res.setHeader('Access-Control-Allow-Origin', allowed);
}

export default cors(async (req, res) => {
  allowOrigin(res);
  if (req.method === 'OPTIONS') return res.end();
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const sig = req.headers['stripe-signature'];
  let event;
  try {
    const raw = await new Promise((resolve) => {
      let data = '';
      req.on('data', (chunk) => (data += chunk));
      req.on('end', () => resolve(Buffer.from(data)));
    });
    event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // TODO: persist Pro status in a DB keyed by userId (from metadata)
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('Pro activated for user:', session.metadata?.userId);
  }

  res.json({ received: true });
});
