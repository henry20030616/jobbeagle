# Paddle Setup Guide for JobBeagle

This guide walks you through setting up Paddle as the payment provider for JobBeagle.

## Why Paddle?

- **Zero upfront cost** — Pay only when you earn (5% transaction fee)
- **Merchant of Record (MoR)** — Paddle handles VAT/sales tax globally
- **Professional subscription management** — Built-in customer portal, auto-renewal, dunning
- **Taiwan-friendly** — Works with Taiwanese merchants without a US company
- **Global payment methods** — Credit cards, PayPal, Apple Pay, Google Pay

## Prerequisites

- A Paddle account (sign up at https://paddle.com)
- Access to your `.env.local` file
- Admin access to Vercel (for production deployment)

---

## Step 1: Create Paddle Account

1. Go to https://vendors.paddle.com/signup
2. Sign up with your email
3. Complete the onboarding process
4. **Start in Sandbox mode** (for testing)

---

## Step 2: Get API Keys

### Sandbox API Key (for development)

1. Log in to https://sandbox-vendors.paddle.com
2. Navigate to **Developer Tools** → **Authentication**
3. Click **"Generate Key"**
4. Copy the API Key (starts with `live_` or `test_`)
5. Add to `.env.local`:

```bash
PADDLE_API_KEY=your_sandbox_api_key_here
PADDLE_ENVIRONMENT=sandbox
```

### Production API Key (for live payments)

*Switch to production keys only after testing is complete.*

1. Log in to https://vendors.paddle.com (production dashboard)
2. Navigate to **Developer Tools** → **Authentication**
3. Generate a production API Key
4. Update `.env.local`:

```bash
PADDLE_API_KEY=your_production_api_key_here
PADDLE_ENVIRONMENT=production
```

---

## Step 3: Create Products & Prices

Create 4 products in the Paddle Dashboard (**Catalog** → **Products**):

### Product 1: Job Fit Snapshot

- **Name:** Job Fit Snapshot
- **Description:** AI-powered job fit analysis in seconds
- **Price:** $3.00 USD
- **Type:** One-time payment
- **Copy the Price ID** (e.g., `pri_01jhw2q...`) → Add to `.env.local`:

```bash
PADDLE_PRICE_SINGLE_JOB_FIT_SNAPSHOT=pri_01jhw2q...
```

### Product 2: Interview Strategy Guide

- **Name:** Interview Strategy Guide
- **Description:** Complete interview preparation with company insights
- **Price:** $9.99 USD
- **Type:** One-time payment
- **Copy the Price ID** → Add to `.env.local`:

```bash
PADDLE_PRICE_SINGLE_INTERVIEW_STRATEGY_GUIDE=pri_01jhw2r...
```

### Product 3: Standard Subscription

- **Name:** JobBeagle Standard
- **Description:** 100 Job Fit Snapshots + 5 Interview Strategy Guides per month
- **Price:** $19.99 USD / month
- **Type:** Recurring subscription (monthly)
- **Copy the Price ID** → Add to `.env.local`:

```bash
PADDLE_PRICE_STANDARD_SUB=pri_01jhw2s...
```

### Product 4: Advanced Subscription

- **Name:** JobBeagle Advanced
- **Description:** 300 Job Fit Snapshots + 15 Interview Strategy Guides per month
- **Price:** $39.99 USD / month
- **Type:** Recurring subscription (monthly)
- **Copy the Price ID** → Add to `.env.local`:

```bash
PADDLE_PRICE_ADVANCED_SUB=pri_01jhw2t...
```

---

## Step 4: Set Up Webhooks

Paddle sends events (payment completed, subscription canceled, etc.) via webhooks.

### Local Development (with Paddle CLI)

1. Install Paddle CLI:

```bash
npm install -g @paddle/paddle-cli
```

2. Login to Paddle:

```bash
paddle auth login
```

3. Forward webhooks to localhost:

```bash
paddle webhook forward --environment=sandbox --endpoint=http://localhost:3000/api/payment/webhook
```

4. Paddle CLI will display a webhook secret. Add it to `.env.local`:

```bash
PADDLE_WEBHOOK_SECRET=pdl_ntfset_...
```

### Production Webhooks

1. Log in to **Paddle Dashboard** (production)
2. Navigate to **Developer Tools** → **Notifications**
3. Click **"Add Notification Destination"**
4. Configure:
   - **Endpoint URL:** `https://www.jobbeagle.com/api/payment/webhook`
   - **Events to Subscribe:**
     - `transaction.completed`
     - `subscription.canceled`
     - `subscription.updated`
5. Copy the **Signing Secret** and add to Vercel environment variables:

```bash
npx vercel env add PADDLE_WEBHOOK_SECRET production
# Paste the secret when prompted
```

---

## Step 5: Test a Purchase

### 5.1 Start Development Server

```bash
npm run dev
```

### 5.2 Test Checkout Flow

1. Open http://localhost:3000
2. Log in with Google
3. Navigate to a job listing page (or pre-flight)
4. Click **"Buy Job Fit Snapshot ($3)"**
5. You'll be redirected to **Paddle Checkout**
6. Use Paddle test cards:
   - **Success:** `4242 4242 4242 4242`
   - **Decline:** `4000 0000 0000 0002`
   - Any future expiry date, any CVV

### 5.3 Verify Credits

After successful payment:
- Check your `/account` page
- Verify credits were added
- Check `orders` table in Supabase (status should be `succeeded`)

---

## Step 6: Configure Customer Portal

Paddle's **Customer Portal** lets users manage subscriptions (update card, cancel, view invoices).

1. Log in to **Paddle Dashboard**
2. Navigate to **Checkout** → **Customer Portal**
3. Enable the portal
4. Customize branding (optional):
   - Logo
   - Colors
   - Support email

**Users access the portal via:**
- **Sandbox:** https://sandbox-customer-portal.paddle.com
- **Production:** https://customer-portal.paddle.com

*JobBeagle directs users to this portal from `/account` → "Manage Subscription"*

---

## Step 7: Set Up Payouts (Taiwan Merchants)

1. Navigate to **Settings** → **Payouts**
2. Add bank account details:
   - **Country:** Taiwan
   - **Currency:** USD (recommended) or TWD
   - **Bank Name:** e.g., Cathay United Bank (國泰世華)
   - **SWIFT Code:** Get from your bank
   - **Account Number:** Your checking account

3. **Payout Schedule:**
   - Paddle pays out **NET-30** (30 days after transaction)
   - Minimum payout: $50

---

## Step 8: Go Live

### 8.1 Switch to Production Environment

Update `.env.local`:

```bash
PADDLE_ENVIRONMENT=production
PADDLE_API_KEY=your_production_api_key
PADDLE_WEBHOOK_SECRET=your_production_webhook_secret
```

### 8.2 Deploy to Vercel

```bash
# Sync all environment variables to Vercel
bash scripts/ops/sync-vercel-env.sh

# Deploy to production
npx vercel deploy --prod --yes
```

### 8.3 Activate Paddle Account

1. Complete **identity verification** in Paddle Dashboard
2. Add **business details** (if applicable)
3. Set up **payout account**
4. Switch from **Sandbox** to **Live** mode

### 8.4 Test Production Payment

1. Visit https://www.jobbeagle.com
2. Make a **real $3 purchase** (Job Fit Snapshot)
3. Use your own credit card
4. Verify:
   - Credits appear in your account
   - Order is recorded in Supabase
   - You receive Paddle confirmation email

---

## Environment Variables Summary

Add these to `.env.local` (development) and Vercel (production):

```bash
# Paddle Configuration
PADDLE_API_KEY=your_api_key
PADDLE_ENVIRONMENT=sandbox  # or 'production'
PADDLE_WEBHOOK_SECRET=your_webhook_secret

# Paddle Price IDs
PADDLE_PRICE_SINGLE_JOB_FIT_SNAPSHOT=pri_...
PADDLE_PRICE_SINGLE_INTERVIEW_STRATEGY_GUIDE=pri_...
PADDLE_PRICE_STANDARD_SUB=pri_...
PADDLE_PRICE_ADVANCED_SUB=pri_...
```

---

## Troubleshooting

### Webhook Events Not Received

1. Check Paddle webhook logs: **Developer Tools** → **Notifications** → **Event Logs**
2. Verify `PADDLE_WEBHOOK_SECRET` matches Paddle Dashboard
3. Ensure endpoint is publicly accessible (use ngrok for local testing)

### Credits Not Added After Payment

1. Check `/api/payment/webhook` logs in Vercel
2. Verify `transaction.completed` event was received
3. Check `orders` table in Supabase (status should be `succeeded`)

### Subscription Not Canceling

1. Verify user has an active subscription (`/api/account/subscription`)
2. Check Paddle Customer Portal for subscription status
3. Ensure user is logged in with the same email as subscription

---

## Support

- **Paddle Documentation:** https://developer.paddle.com
- **Paddle Support:** support@paddle.com
- **JobBeagle Issues:** File an issue in the GitHub repo

---

## Cost Comparison (vs. Stripe)

| Provider | Transaction Fee | Monthly Fee | MoR (handles tax) |
|----------|----------------|-------------|-------------------|
| **Paddle** | 5% + $0.50 | $0 | Yes ✅ |
| **Stripe** | 2.9% + $0.30 | $0 | No ❌ |
| **Stripe Atlas** | 2.9% + $0.30 | $500 setup + $100/yr | No ❌ |

**For $1,000 MRR:**
- Paddle: $50/month in fees
- Stripe: $29/month in fees (but you handle tax + need US company)
- **Breakeven:** ~$2,000 MRR (Paddle's simplicity often worth it below that)

---

## Next Steps

After Paddle is live:
1. Monitor transactions in **Paddle Dashboard** → **Transactions**
2. Track MRR in **Reports** → **Revenue**
3. Consider upgrading to **Paddle Retain** (automatic payment retry) if churn is high
4. Set up email notifications for failed payments

🎉 **You're ready to accept payments with Paddle!**
