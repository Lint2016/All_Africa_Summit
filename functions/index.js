require("dotenv").config(); // Load .env file
const functions = require("firebase-functions");
const paypal = require("@paypal/checkout-server-sdk");
const admin = require("firebase-admin");
const crypto = require("crypto");
if (!admin.apps.length) {
  admin.initializeApp();
}

// PayPal environment setup
function environment() {
  // Try to get credentials from environment variables (v2)
  let clientId = process.env.PAYPAL_CLIENT_ID || "";
  let clientSecret = process.env.PAYPAL_CLIENT_SECRET || "";

  // v2: functions.config() removed; rely solely on environment variables

  // Remove any whitespace that might be present
  clientId = clientId.trim();
  clientSecret = clientSecret.trim();

  console.log("PayPal Client ID:", clientId ? "***" + clientId.slice(-4) : "Not found");

  if (!clientId || !clientSecret) {
    console.error("PayPal credentials not configured");
    // eslint-disable-next-line max-len
    throw new Error("PayPal credentials not configured. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET environment variables.");
  }

  return new paypal.core.LiveEnvironment(clientId, clientSecret);
}

function client() {
  return new paypal.core.PayPalHttpClient(environment());
}

// Create PayPal order
exports.createOrder = functions.https.onCall(async (data) => {
  let order; // declare outside try/catch to avoid "before initialization"
  try {
    if (!data) throw new Error("No data provided");

    const amount = String(data.amount || "0.50").trim();
    const currency = String(data.currency || "USD").toUpperCase().trim();
    const returnUrl = data.returnUrl ? String(data.returnUrl).trim() : "";
    const cancelUrl = data.cancelUrl ? String(data.cancelUrl).trim() : "";

    if (!/^\d+(\.\d{1,2})?$/.test(amount)) {
      throw new Error("Invalid amount format. Use format: \"120.00\"");
    }

    // Create the simplest possible order
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");

    // Build body and include application_context only if URLs are provided
    const body = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount,
          },
          ...(data && data.customId ? {custom_id: String(data.customId).slice(0, 127)} : {}),
        },
      ],
    };

    if (returnUrl && cancelUrl) {
      body.application_context = {
        return_url: returnUrl,
        cancel_url: cancelUrl,
        brand_name: "All Africa Apostolic Summit",
        landing_page: "GUEST_CHECKOUT",
        user_action: "PAY_NOW",
      };
    }

    // Use official SDK method to set body
    request.requestBody(body);

    // Execute the request
    console.log("Creating PayPal order with data:", JSON.stringify(body, null, 2));
    order = await client().execute(request);

    console.log("PayPal order created successfully");
    console.log("Order ID:", order.result.id);
    console.log("Status:", order.result.status);

    return {
      id: order.result.id,
      links: order.result.links,
      status: order.result.status,
    };
  } catch (err) {
    try {
      // Log more details if available from PayPal SDK error
      if (err && err.statusCode && err.headers) {
        console.error("PayPal API Error Status:", err.statusCode);
        console.error("PayPal API Error Headers:", err.headers);
      }
      if (err && err.message) {
        console.error("PayPal API Error Message:", err.message);
      }
      if (err && err.result) {
        console.error("PayPal API Error Details:", JSON.stringify(err.result, null, 2));
      }
    } catch (_) {
      // ignore logging issues
    }
    console.error("PayPal createOrder error:", err);
    throw new functions.https.HttpsError("internal", err.message);
  }
});

exports.createOzowPaymentHttp = functions.https.onRequest(async (req, res) => {
  const allowOrigin = req.headers.origin || '*';
  res.set("Access-Control-Allow-Origin", allowOrigin);
  res.set("Vary", "Origin");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.status(204).send(""); return;
  }
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed"); return;
  }
  try {
    const db = admin.firestore();
    const siteCode = (process.env.OZOW_SITE_CODE || "").trim();
    const privateKey = (process.env.OZOW_PRIVATE_KEY || "").trim();
    // eslint-disable-next-line max-len
    const successUrl = (process.env.OZOW_SUCCESS_URL || "https://aaasummit.co.za/register.html?ozow=success").trim();
    // eslint-disable-next-line max-len
    const cancelUrl = (process.env.OZOW_CANCEL_URL || "https://aaasummit.co.za/register.html?ozow=cancel").trim();
    const notifyUrl = (process.env.OZOW_NOTIFY_URL || "").trim();
    const errorUrl = (process.env.OZOW_ERROR_URL || "https://aaasummit.co.za/register.html?ozow=error").trim();
    let body = {};
    if (req.body) {
      if (typeof req.body === "object") {
        body = req.body;
      } else if (typeof req.body === "string") {
        try { body = JSON.parse(req.body); } catch (_) { body = {}; }
      }
    }
    const amount = String(body.amount || "1.00").trim();
    const currencyCode = String(body.currencyCode || "ZAR").trim().toUpperCase();
    const countryCode = String(body.countryCode || "ZA").trim().toUpperCase();
    const customer = body.customer || {};
    let firstName = String(customer.firstName || body.firstName || '').trim();
    let lastName = String(customer.lastName || body.lastName || '').trim();
    let email = String(customer.email || body.email || '').trim();
    if (!firstName && (customer.fullName || body.fullName)) {
      const parts = String(customer.fullName || body.fullName).trim().split(/\s+/);
      firstName = parts[0] || '';
      if (!lastName && parts.length > 1) lastName = parts.slice(1).join(" ");
    }
    // Normalize email to ensure we have it if provided under different keys
    if (!email && typeof body.emailAddress === "string") {
      email = String(body.emailAddress).trim();
    }
    if (!siteCode) { res.status(500).json({error: "Missing siteCode"}); return; }
    if (!privateKey) { res.status(500).json({error: "Missing private key"}); return; }
    if (!email) { res.status(400).json({error: "Missing email"}); return; }
    if (!firstName) { firstName = (email.split('@')[0] || 'Guest'); }
    if (!/^\d+(\.\d{1,2})?$/.test(amount)) {
      res.status(400).json({error: "Invalid amount"}); return;
    }
    const rawTx = String(body.transactionReference || ("INV-" + Date.now())).trim();
    const rawBankRef = String(body.bankReference || "AAA-2026").trim();
    const sanitize = (s) => s.replace(/[^0-9A-Za-z]/g, "").toUpperCase().slice(0, 20);
    const transactionReference = sanitize(rawTx) || ("INV" + Date.now());
    const nameBaseRaw = firstName ? (firstName + (lastName ? lastName[0] : "")) : (email ? email.split('@')[0] : "");
    const nameRef = nameBaseRaw ? sanitize("AAAS" + nameBaseRaw) : "";
    const bankReferenceSafe = nameRef || (sanitize(rawBankRef) || "AAA2026");
    const payload = {
      siteCode,
      countryCode,
      currencyCode,
      amount,
      transactionReference,
      bankReference: bankReferenceSafe,
      cancelUrl,
      successUrl,
      errorUrl,
      ...(notifyUrl ? { notifyUrl } : {}),
    };
    const canonical = JSON.stringify(payload);
    const hash = crypto.createHmac('sha256', privateKey).update(canonical).digest('hex');
    const fields = { ...payload, hash };
    await db.collection('payments').doc(transactionReference).set({
      gateway: 'ozow', amount, currencyCode, countryCode, bankReference: bankReferenceSafe,
      customer: { firstName, lastName, email }, status: 'initiated',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    res.status(200).json({ redirectPost: { url: 'https://pay.ozow.com/', fields } });
  } catch (e) {
    res.status(500).json({ error: e && e.message ? e.message : 'Server error' });
  }
});

exports.createOzowPayment = functions.https.onCall(async (data) => {
  try {
    if (!data) throw new functions.https.HttpsError("invalid-argument", "Missing data");
    const db = admin.firestore();
    const siteCode = (process.env.OZOW_SITE_CODE || "").trim();
    const privateKey = (process.env.OZOW_PRIVATE_KEY || "").trim();
    const successUrl = (process.env.OZOW_SUCCESS_URL || "https://aaasummit.co.za/register.html?ozow=success").trim();
    const cancelUrl = (process.env.OZOW_CANCEL_URL || "https://aaasummit.co.za/register.html?ozow=cancel").trim();
    const notifyUrl = (process.env.OZOW_NOTIFY_URL || "").trim();
    const amount = String(data.amount || "1.00").trim();
    const currencyCode = String(data.currencyCode || "ZAR").trim().toUpperCase();
    const countryCode = String(data.countryCode || "ZA").trim().toUpperCase();
    const bankReference = String(data.bankReference || "AAA-2026").trim();
    const customer = data.customer || {};
    let firstName = String(customer.firstName || data.firstName || "").trim();
    let lastName = String(customer.lastName || data.lastName || "").trim();
    if (!firstName && (customer.fullName || data.fullName)) {
      const parts = String(customer.fullName || data.fullName).trim().split(/\s+/);
      firstName = parts[0] || "";
      if (!lastName && parts.length > 1) lastName = parts.slice(1).join(" ");
    }
    let email = String(customer.email || data.email || "").trim();
    if (!email && typeof data.emailAddress === "string") {
      email = String(data.emailAddress).trim();
    }
    try {
      console.log("[createOzowPayment] raw data:", JSON.stringify(data));
    } catch (_) {
      console.log("[createOzowPayment] raw data: [unserializable]");
    }
    try {
      console.log("[createOzowPayment] received fields:", {
        customer,
        topLevelFirstName: data.firstName || null,
        topLevelLastName: data.lastName || null,
        topLevelEmail: data.email || null,
        emailAddress: typeof data.emailAddress === "string" ? data.emailAddress : null,
      });
      console.log("[createOzowPayment] computed customer:", { firstName, lastName, email });
    } catch (_) {
      // ignore logging errors
    }
    // eslint-disable-next-line max-len
    if (!email) throw new functions.https.HttpsError("invalid-argument", "Missing email");
    if (!firstName) { firstName = (email.split('@')[0] || "Guest"); }
    if (!siteCode) throw new functions.https.HttpsError("failed-precondition", "Missing siteCode");
    // eslint-disable-next-line max-len
    if (!privateKey) throw new functions.https.HttpsError("failed-precondition", "Missing private key");
    // eslint-disable-next-line max-len
    if (!/^\d+(\.\d{1,2})?$/.test(amount)) throw new functions.https.HttpsError("invalid-argument", "Invalid amount");
    const sanitize = (s) => s.replace(/[^0-9A-Za-z]/g, "").toUpperCase().slice(0, 20);
    const txBase = String(data.transactionReference || ("INV-" + Date.now())).trim();
    const brBase = String(data.bankReference || "AAA-2026").trim();
    const transactionReference = sanitize(txBase) || ("INV" + Date.now());
    const bankReferenceSafe = sanitize(brBase) || "AAA2026";
    const payload = {
      siteCode,
      countryCode,
      currencyCode,
      amount,
      transactionReference,
      bankReference: bankReferenceSafe,
      cancelUrl: cancelUrl,
      successUrl: successUrl,
      errorUrl: errorUrl,
      ...(notifyUrl ? {notifyUrl} : {}),
    };
    const canonical = JSON.stringify(payload);
    const hash = crypto.createHmac("sha256", privateKey).update(canonical).digest("hex");
    const fields = {...payload, hash};
    await db.collection("payments").doc(transactionReference).set({
      gateway: "ozow",
      amount,
      currencyCode,
      countryCode,
      bankReference: bankReferenceSafe,
      customer: {firstName, lastName, email},
      status: "initiated",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, {merge: true});
    return {redirectPost: {url: "https://pay.ozow.com/", fields}};
  } catch (err) {
    if (err instanceof functions.https.HttpsError) throw err;
    // eslint-disable-next-line max-len
    throw new functions.https.HttpsError("internal", err && err.message ? err.message : "Unknown error");
  }
});

exports.ozowNotify = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }
    const privateKey = (process.env.OZOW_PRIVATE_KEY || "").trim();
    if (!privateKey) {
      res.status(500).send("Missing private key");
      return;
    }
    const body = req.body || {};
    const tx = String(body.transactionReference || "").trim();
    if (!tx) {
      res.status(400).send("Missing transactionReference");
      return;
    }
    const db = admin.firestore();
    await db.collection("payments").doc(tx).set({
      status: String(body.status || "unknown").toLowerCase(),
      raw: body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    res.status(200).send("OK");
  } catch (e) {
    res.status(500).send("Server error");
  }
});

// Paystack webhook: verify signature and update Firestore on charge.success
exports.paystackWebhook = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const secret = process.env.PAYSTACK_SECRET_KEY || "";
    if (!secret) {
      res.status(500).send("PAYSTACK_SECRET_KEY not configured");
      return;
    }

    const signature = req.header("x-paystack-signature");
    if (!signature) {
      res.status(400).send("Missing signature");
      return;
    }

    // Compute HMAC SHA512 of raw body
    const computed = crypto.createHmac("sha512", secret)
        .update(req.rawBody)
        .digest("hex");

    if (computed !== signature) {
      res.status(400).send("Invalid signature");
      return;
    }

    const event = req.body && req.body.event;
    const data = (req.body && req.body.data) || {};

    if (event === "charge.success") {
      const reference = data.reference || "";
      const amount = typeof data.amount === "number" ? data.amount : 0; // in minor units
      const currency = data.currency || "";
      const email = data.customer && data.customer.email ? data.customer.email : "";

      if (reference) {
        const db = admin.firestore();
        const q = await db
            .collection("registrations")
            .where("paystackRef", "==", reference)
            .limit(1)
            .get();

        if (!q.empty) {
          const doc = q.docs[0];
          const docRef = doc.ref;
          const current = doc.data() || {};
          const alreadyCompleted = (current.paymentStatus || "").toLowerCase() === "completed";
          if (!alreadyCompleted) {
            await docRef.set(
                {
                  paymentStatus: "completed",
                  paymentAmount: (amount / 100).toFixed(2),
                  currency: currency,
                  paystackReference: reference,
                  payerEmail: email,
                  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                },
                {merge: true},
            );
          }
        }
      }
    }

    res.status(200).send("OK");
  } catch (e) {
    console.error("paystackWebhook error:", e);
    res.status(500).send("Server error");
  }
});

// Verify Paystack transaction
exports.verifyPaystack = functions.https.onCall(async (data) => {
  try {
    if (!data || !data.reference) {
      throw new functions.https.HttpsError("invalid-argument", "Missing reference");
    }

    const secret = process.env.PAYSTACK_SECRET_KEY || "";
    if (!secret) {
      // eslint-disable-next-line max-len
      throw new functions.https.HttpsError("failed-precondition", "PAYSTACK_SECRET_KEY not configured");
    }

    // eslint-disable-next-line max-len
    const resp = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(data.reference)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secret}`,
        Accept: "application/json",
      },
    });

    const json = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      const msg = (json && json.message) ? json.message : "Paystack verify failed";
      throw new functions.https.HttpsError("internal", msg);
    }

    const status = json && json.data ? json.data.status : "";
    return {ok: status === "success", data: json.data || null};
  } catch (err) {
    console.error("verifyPaystack error:", err);
    if (err instanceof functions.https.HttpsError) throw err;
    throw new functions.https.HttpsError("internal", err.message || "Unknown error");
  }
});

exports.paypalWebhook = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const webhookId = process.env.PAYPAL_WEBHOOK_ID || "";
    if (!webhookId) {
      res.status(500).send("Webhook ID not configured");
      return;
    }

    const transmissionId = req.header("paypal-transmission-id");
    const transmissionTime = req.header("paypal-transmission-time");
    const certUrl = req.header("paypal-cert-url");
    const authAlgo = req.header("paypal-auth-algo");
    const transmissionSig = req.header("paypal-transmission-sig");
    const body = req.body;

    const clientId = process.env.PAYPAL_CLIENT_ID || "";
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET || "";
    if (!clientId || !clientSecret) {
      res.status(500).send("Credentials not configured");
      return;
    }

    const base = "https://api-m.paypal.com";
    const tokenResp = await fetch(`${base}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Authorization": "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    if (!tokenResp.ok) {
      res.status(500).send("Failed to get access token");
      return;
    }
    const tokenJson = await tokenResp.json();
    const accessToken = tokenJson.access_token;

    const verifyResp = await fetch(`${base}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: webhookId,
        webhook_event: body,
      }),
    });

    if (!verifyResp.ok) {
      res.status(400).send("Verification request failed");
      return;
    }
    const verifyJson = await verifyResp.json();
    if (verifyJson.verification_status !== "SUCCESS") {
      res.status(400).send("Invalid signature");
      return;
    }

    const eventType = body && body.event_type;
    if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
      // Placeholder for updating Firestore if needed
    }

    res.status(200).send("OK");
  } catch (e) {
    res.status(500).send("Server error");
  }
});

// Capture PayPal order
exports.captureOrder = functions.https.onCall(async (data) => {
  try {
    // Input validation
    if (!data) {
      throw new Error("No data provided");
    }

    const orderID = String(data.orderID || "").trim();
    if (!orderID) {
      throw new functions.https.HttpsError("invalid-argument", "Missing orderID");
    }

    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});

    const capture = await client().execute(request);
    return {status: "success", details: capture.result};
  } catch (err) {
    console.error("PayPal captureOrder error:", err);
    throw new functions.https.HttpsError("internal", err.message);
  }
});
