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

  // If not found in environment variables, try config (v1)
  if ((!clientId || !clientSecret) && functions.config().paypal) {
    clientId = functions.config().paypal.client_id || "";
    clientSecret = functions.config().paypal.client_secret || "";
  }

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
