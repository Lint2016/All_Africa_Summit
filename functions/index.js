require("dotenv").config(); // Load .env file
const functions = require("firebase-functions");
const paypal = require("@paypal/checkout-server-sdk");

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

  return new paypal.core.SandboxEnvironment(clientId, clientSecret);
}

function client() {
  return new paypal.core.PayPalHttpClient(environment());
}

// Create PayPal order
exports.createOrder = functions.https.onCall(async (data) => {
  let order; // declare outside try/catch to avoid "before initialization"
  try {
    if (!data) throw new Error("No data provided");

    const amount = String(data.amount || "200.00").trim();
    const currency = String(data.currency || "USD").toUpperCase().trim();
    const returnUrl = data.returnUrl ? String(data.returnUrl).trim() : "";
    const cancelUrl = data.cancelUrl ? String(data.cancelUrl).trim() : "";

    if (!/^\d+(\.\d{1,2})?$/.test(amount)) {
      throw new Error("Invalid amount format. Use format: \"200.00\"");
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
        },
      ],
    };

    if (returnUrl && cancelUrl) {
      body.application_context = {
        return_url: returnUrl,
        cancel_url: cancelUrl,
        brand_name: "All Africa Apostolic Summit",
        landing_page: "LOGIN",
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
