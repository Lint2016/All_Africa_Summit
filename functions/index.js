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
  try {
    // Input validation
    if (!data) {
      throw new Error("No data provided");
    }

    const amount = String(data.amount || "200.00").trim();
    const currency = String(data.currency || "USD").toUpperCase().trim();

    // Validate amount format (should be a valid number with up to 2 decimal places)
    if (!/^\d+(\.\d{1,2})?$/.test(amount)) {
      throw new Error("Invalid amount format. Use format: \"200.00\"");
    }

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount,
          },
        },
      ],
    });

    const order = await client().execute(request);

    // Return the order ID and approval URL
    return {
      id: order.result.id,
      links: order.result.links, // This contains the approval URL
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
