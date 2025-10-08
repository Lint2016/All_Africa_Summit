// netlify/functions/create-order.js
export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { amount, currency = "USD" } = JSON.parse(event.body || "{}");

  const PAYPAL_BASE = process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

    const clientId = process.env.PAYPAL_CLIENT_ID;
const secret = process.env.PAYPAL_SECRET;

  const auth = Buffer.from(
    `${clientId}:${secret}`
  ).toString("base64");

  // 1. Get access token
  const tokenRes = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const { access_token } = await tokenRes.json();

  // 2. Create order
  const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || "";
  const returnUrl = siteUrl ? `${siteUrl}/index.html?paypal=return` : "https://example.com/return";
  const cancelUrl = siteUrl ? `${siteUrl}/index.html?paypal=cancel` : "https://example.com/cancel";

  const orderRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        { amount: { currency_code: currency, value: amount } }
      ],
      application_context: {
        return_url: returnUrl,
        cancel_url: cancelUrl,
      }
    }),
  });

  const order = await orderRes.json();
  const approval = order.links.find((l) => l.rel === "approve").href;

  return {
    statusCode: 200,
    body: JSON.stringify({ approval }),
  };
}
