# Budget Flow Pro

Budget Flow Pro is a standalone web app for `nevels1953.com`. It includes a dashboard, monthly budget, expense ledger, bills, receipt OCR, Stripe payment actions, reports, local backups, and install support.

## Run locally

```bash
node server.js
```

Open `http://localhost:4173`.

## Stripe

Stripe Checkout is restored through the Netlify function at `/.netlify/functions/create-stripe-checkout`.

Set this environment variable on the Netlify site:

```text
STRIPE_SECRET_KEY=sk_live_or_test_key
```

Optional variables:

```text
STRIPE_SUCCESS_URL=https://nevels1953.com/?stripe=success
STRIPE_CANCEL_URL=https://nevels1953.com/?stripe=cancel
STRIPE_CURRENCY=usd
```

The browser app also supports a Stripe Payment Link template in Settings for client-only fallback links.

## Deploy

The site is static plus Netlify Functions. Netlify can deploy it directly from the `bnevels/budgetFlow` GitHub repository using:

```text
Publish directory: .
Build command: echo 'Deploying Budget Flow Pro'
Functions directory: netlify/functions
```
