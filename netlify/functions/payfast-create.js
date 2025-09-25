// netlify/functions/payfast-create.js
// Generates a signed PayFast redirect URL

import crypto from 'crypto';

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const amount = body.amount || '10.00';
    const buyer = body.buyer || {};

    const merchant_id = process.env.PAYFAST_MERCHANT_ID;
    const merchant_key = process.env.PAYFAST_MERCHANT_KEY;
    const passphrase = process.env.PAYFAST_PASSPHRASE || '';

    const isSandbox = process.env.PAYFAST_ENV !== 'live';
    const base = isSandbox
      ? 'https://sandbox.payfast.co.za/eng/process'
      : 'https://www.payfast.co.za/eng/process';

    const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || '';
    const return_url = siteUrl ? `${siteUrl}/index.html?payfast=return` : 'https://example.com/return';
    const cancel_url = siteUrl ? `${siteUrl}/index.html?payfast=cancel` : 'https://example.com/cancel';
    const notify_url = siteUrl ? `${siteUrl}/.netlify/functions/payfast-notify` : 'https://example.com/notify';

    const params = {
      merchant_id,
      merchant_key,
      amount,
      item_name: body.item_name || 'AAAS Registration',
      name_first: buyer.firstName || 'Guest',
      name_last: buyer.lastName || 'User',
      email_address: buyer.email || 'guest@example.com',
      return_url,
      cancel_url,
      notify_url
    };

    // Build signature string sorted by key
    const orderedKeys = Object.keys(params).sort();
    const pairs = orderedKeys.map((k) => `${k}=${encodeURIComponent(params[k]).replace(/%20/g, '+')}`);
    let signatureString = pairs.join('&');
    if (passphrase) {
      signatureString += `&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, '+')}`;
    }
    const signature = crypto.createHash('md5').update(signatureString).digest('hex');

    const url = `${base}?${pairs.join('&')}&signature=${signature}`;

    return { statusCode: 200, body: JSON.stringify({ redirect: url }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message || 'payfast error' }) };
  }
}


