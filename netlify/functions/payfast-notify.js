// netlify/functions/payfast-notify.js
// Basic ITN endpoint (logs only). For production, validate with PayFast and verify signature/IP.

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Raw body contains x-www-form-urlencoded from PayFast
    const body = event.body || '';
    console.log('PayFast ITN:', body);
    return { statusCode: 200, body: 'OK' };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}


