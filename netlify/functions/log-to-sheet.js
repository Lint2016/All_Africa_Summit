// netlify/functions/log-to-sheet.js
export async function handler(event) {
  const data = JSON.parse(event.body);
  const SHEET_URL = process.env.GSHEET_WEBHOOK_URL; // set in Netlify env vars

  try {
    await fetch(SHEET_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return { statusCode: 200, body: JSON.stringify({status: "ok"}) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({error: err.message}) };
  }
}
