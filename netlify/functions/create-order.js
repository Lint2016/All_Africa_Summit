// netlify/functions/create-order.js
import fetch from "node-fetch";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { amount, currency = "USD" } = JSON.parse(event.body);

  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  // 1. Get access token
  const tokenRes = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const { access_token } = await tokenRes.json();

  // 2. Create order
  const orderRes = await fetch("https://api-m.sandbox.paypal.com/v2/checkout/orders", {
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
        return_url: "https://your-site-name.netlify.app/success.html",
        cancel_url: "https://your-site-name.netlify.app/cancel.html",
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
