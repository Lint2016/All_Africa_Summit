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

    if (!/^\d+(\.\d{1,2})?$/.test(amount)) {
      throw new Error("Invalid amount format. Use format: \"200.00\"");
    }

    // Create order
    const createRequest = new paypal.orders.OrdersCreateRequest();
    createRequest.prefer("return=representation");
    createRequest.requestBody({
      intent: "CAPTURE",
      purchase_units: [{amount: {currency_code: currency, value: amount}}],
    });

    order = await client().execute(createRequest);

    // Update order with return URLs
    const patchRequest = new paypal.orders.OrdersPatchRequest(order.result.id);
    patchRequest.requestBody([
      {
        op: "add",
        path: "/application_context",
        value: {
          return_url: `http://127.0.0.1:5500/register.html?success=true`,
          cancel_url: "http://127.0.0.1:5500/register.html?success=false",
        },
      },
    ]);

    await client().execute(patchRequest);

    return {
      id: order.result.id,
      links: order.result.links,
      status: order.result.status,
    };
  } catch (err) {
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
