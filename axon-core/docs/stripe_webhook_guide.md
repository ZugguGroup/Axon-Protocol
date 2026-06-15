# Stripe CLI & Webhook Local Testing Guide

This guide explains how developers can mock and verify subscription webhook lifecycles in their local development environment without needing real Stripe API keys.

---

## 1. Quick Local Upgrade (No Stripe Required)
If you want to instantly upgrade a user account to `Pro` during local development, use the built-in simulation endpoint.

Send a POST request with the user's dashboard JWT token:
```bash
curl -X POST http://localhost:8000/v1/billing/simulate-upgrade?plan=pro \
  -H "Authorization: Bearer <YOUR_DASHBOARD_JWT_TOKEN>"
```

---

## 2. Testing via Stripe Webhook Endpoint (`/v1/billing/webhook`)
When the billing provider is set to `"mock"` (default in `.env.example`), the server bypasses Stripe signature validation and parses incoming JSON events directly. This allows you to simulate webhook events using standard REST clients.

### A. Upgrading a User to Pro (`subscription.updated`)
Send the following payload to `POST http://localhost:8000/v1/billing/webhook`:

```json
{
  "type": "subscription.updated",
  "user_id": "YOUR_USER_UUID",
  "plan": "pro"
}
```

### B. Downgrading/Canceling a Subscription (`subscription.deleted`)
Send the following payload to `POST http://localhost:8000/v1/billing/webhook`:

```json
{
  "type": "subscription.deleted",
  "user_id": "YOUR_USER_UUID"
}
```

---

## 3. Testing with Stripe CLI (For Real stripe Integrations)
To test the actual Stripe checkout redirection and signature verification flow:

### Step 1: Install the Stripe CLI
Download and login with the Stripe CLI:
```powershell
stripe login
```

### Step 2: Forward Webhooks
Forward Stripe events to your local FastAPI server. Note down the webhook secret displayed in the terminal:
```powershell
stripe listen --forward-to localhost:8000/v1/billing/webhook
```

### Step 3: Configure `.env`
Update your server's `.env` config:
```env
BILLING_PROVIDER=stripe
STRIPE_API_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Step 4: Trigger Mock Events
Use Stripe CLI to trigger standard event templates:
```powershell
# Trigger a customer subscription update (upgrade)
stripe trigger customer.subscription.updated

# Trigger a customer subscription deletion (cancellation)
stripe trigger customer.subscription.deleted
```

The CLI will sign the payloads and forward them to your FastAPI server, where the webhook engine will verify the signature and sync user subscription plans instantly.
