exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": event.headers.origin || "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "POST is required." })
    };
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return {
      statusCode: 501,
      headers,
      body: JSON.stringify({ error: "Stripe is not configured on this Netlify site." })
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Request body must be JSON." })
    };
  }

  const amount = Number(payload.amount || 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "A positive amount is required." })
    };
  }

  const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || "https://nevels1953.com";
  const successUrl = payload.successUrl || process.env.STRIPE_SUCCESS_URL || `${siteUrl}/?stripe=success`;
  const cancelUrl = payload.cancelUrl || process.env.STRIPE_CANCEL_URL || `${siteUrl}/?stripe=cancel`;
  const title = String(payload.title || "Budget Flow Pro payment").slice(0, 120);
  const currency = String(payload.currency || process.env.STRIPE_CURRENCY || "usd").toLowerCase();
  const cents = Math.round(amount * 100);

  const form = new URLSearchParams();
  form.append("mode", "payment");
  form.append("success_url", successUrl);
  form.append("cancel_url", cancelUrl);
  form.append("line_items[0][quantity]", "1");
  form.append("line_items[0][price_data][currency]", currency);
  form.append("line_items[0][price_data][unit_amount]", String(cents));
  form.append("line_items[0][price_data][product_data][name]", title);
  form.append("metadata[app]", "Budget Flow Pro");
  if (payload.billId) {
    form.append("metadata[bill_id]", String(payload.billId).slice(0, 80));
  }

  try {
    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: form
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: data.error && data.error.message ? data.error.message : "Stripe checkout failed." })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: data.url, id: data.id })
    };
  } catch (error) {
    return {
      statusCode: 502,
      headers,
      body: JSON.stringify({ error: error.message || "Stripe request failed." })
    };
  }
};
