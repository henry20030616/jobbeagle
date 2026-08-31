# Stripe Setup Guide for JobBeagle

This guide will help you set up Stripe for JobBeagle payments.

## 1. Create a Stripe Account

1. Go to https://stripe.com
2. Click "Sign up" (or "Start now")
3. Fill in your business information:
   - **Business name:** JobBeagle (or your company name)
   - **Country:** Taiwan (or your country)
   - **Email:** Your email
4. Complete the verification process

---

## 2. Get Your API Keys

### Test Mode Keys (for development)

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your keys:
   - **Publishable key:** Starts with `pk_test_`
   - **Secret key:** Click "Reveal test key", starts with `sk_test_`

3. Add to `.env.local`:
   ```bash
   STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
   ```

### Live Mode Keys (for production)

**⚠️ Only switch to live mode after testing is complete**

1. Complete Stripe account verification
2. Go to https://dashboard.stripe.com/apikeys
3. Copy your live keys:
   - **Publishable key:** Starts with `pk_live_`
   - **Secret key:** Starts with `sk_live_`

---

## 3. Create Products and Prices

### Product 1: Job Fit Snapshot

1. Go to https://dashboard.stripe.com/test/products
2. Click "+ Create product"
3. Fill in:
   - **Name:** Job Fit Snapshot
   - **Description:** AI-powered job match analysis snapshot
   - **Pricing model:** One time
   - **Price:** $3.00 USD
4. Click "Save product"
5. Copy the **Price ID** (starts with `price_`)
6. Add to `.env.local`:
   ```bash
   STRIPE_PRICE_SINGLE_JOB_FIT_SNAPSHOT=price_YOUR_ID_HERE
   ```

### Product 2: Interview Strategy Guide

1. Click "+ Create product"
2. Fill in:
   - **Name:** Interview Strategy Guide
   - **Description:** Comprehensive interview preparation and salary strategy
   - **Pricing model:** One time
   - **Price:** $9.99 USD
3. Click "Save product"
4. Copy the **Price ID**
5. Add to `.env.local`:
   ```bash
   STRIPE_PRICE_SINGLE_INTERVIEW_STRATEGY_GUIDE=price_YOUR_ID_HERE
   ```

### Product 3: Standard Subscription

1. Click "+ Create product"
2. Fill in:
   - **Name:** Standard Subscription
   - **Description:** 100 Job Fit Snapshot + 5 Interview Strategy Guide per month
   - **Pricing model:** Recurring
   - **Price:** $19.99 USD
   - **Billing period:** Monthly
3. Click "Save product"
4. Copy the **Price ID**
5. Add to `.env.local`:
   ```bash
   STRIPE_PRICE_STANDARD_SUB=price_YOUR_ID_HERE
   ```

### Product 4: Advanced Subscription

1. Click "+ Create product"
2. Fill in:
   - **Name:** Advanced Subscription
   - **Description:** 300 Job Fit Snapshot + 15 Interview Strategy Guide per month
   - **Pricing model:** Recurring
   - **Price:** $39.99 USD
   - **Billing period:** Monthly
3. Click "Save product"
4. Copy the **Price ID**
5. Add to `.env.local`:
   ```bash
   STRIPE_PRICE_ADVANCED_SUB=price_YOUR_ID_HERE
   ```

---

## 4. Set Up Webhooks

Webhooks allow Stripe to notify your app when payments succeed or subscriptions change.

### Development (localhost testing)

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
   ```bash
   # macOS (Homebrew)
   brew install stripe/stripe-cli/stripe
   
   # Or download from https://github.com/stripe/stripe-cli/releases
   ```

2. Login to Stripe CLI:
   ```bash
   stripe login
   ```

3. Forward webhooks to localhost:
   ```bash
   stripe listen --forward-to localhost:3000/api/payment/webhook
   ```

4. Copy the webhook signing secret (starts with `whsec_`)
5. Add to `.env.local`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
   ```

### Production (live webhook)

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click "+ Add endpoint"
3. Fill in:
   - **Endpoint URL:** `https://www.jobbeagle.com/api/payment/webhook`
   - **Events to send:**
     - `checkout.session.completed`
     - `invoice.payment_succeeded`
     - `customer.subscription.deleted`
4. Click "Add endpoint"
5. Copy the **Signing secret**
6. Update `.env.local` (and sync to Vercel):
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
   ```

---

## 5. Enable Stripe Billing Portal

The billing portal allows customers to manage their subscriptions (update payment method, view invoices, cancel).

### Test Mode

1. Go to https://dashboard.stripe.com/test/settings/billing/portal
2. Enable these features:
   - ✅ **Update payment method**
   - ✅ **View invoices**
   - ✅ **Cancel subscriptions** (set to "Cancel at period end")
3. Click "Save"

### Live Mode

Repeat the above steps at https://dashboard.stripe.com/settings/billing/portal

---

## 6. Test Your Integration

### Test Cards

Use these test card numbers in Stripe Checkout:

| Card Number | Scenario |
|-------------|----------|
| `4242 4242 4242 4242` | Success |
| `4000 0025 0000 3155` | Requires 3D Secure |
| `4000 0000 0000 9995` | Declined |

- **Expiry:** Any future date (e.g., 12/34)
- **CVC:** Any 3 digits (e.g., 123)
- **ZIP:** Any 5 digits (e.g., 12345)

### Test Flow

1. Start your dev server: `npm run dev`
2. Login to JobBeagle
3. Go to a checkout flow (e.g., buy a Job Fit Snapshot)
4. Use test card `4242 4242 4242 4242`
5. Complete purchase
6. Check:
   - ✅ Webhook received in Stripe CLI
   - ✅ Credits added to your account
   - ✅ Order marked as "succeeded" in database

---

## 7. Deploy to Production

### Sync Environment Variables to Vercel

```bash
# From your project directory
bash scripts/ops/sync-vercel-env.sh
```

This will sync all environment variables from `.env.local` to Vercel production.

### Switch to Live Mode

**⚠️ Only do this after testing is complete**

1. Complete Stripe account verification
2. Create the same 4 products in **Live Mode**
3. Create a live webhook endpoint
4. Update `.env.local` with live keys:
   ```bash
   STRIPE_SECRET_KEY=sk_live_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRICE_SINGLE_JOB_FIT_SNAPSHOT=price_...
   STRIPE_PRICE_SINGLE_INTERVIEW_STRATEGY_GUIDE=price_...
   STRIPE_PRICE_STANDARD_SUB=price_...
   STRIPE_PRICE_ADVANCED_SUB=price_...
   ```
5. Sync to Vercel: `bash scripts/ops/sync-vercel-env.sh`
6. Redeploy: `npx vercel deploy --prod`

---

## 8. Troubleshooting

### "Billing is not configured" error

**Cause:** Missing Stripe API keys

**Fix:**
1. Check `.env.local` has `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
2. Restart dev server: `npm run dev`
3. If on Vercel, run: `bash scripts/ops/sync-vercel-env.sh` and redeploy

### "Stripe price not configured" error

**Cause:** Missing Price IDs

**Fix:**
1. Check all 4 price IDs are set in `.env.local`
2. Make sure Price IDs match your Stripe Dashboard
3. Restart dev server / redeploy

### Webhook signature verification failed

**Cause:** Wrong webhook secret

**Fix:**
1. If testing locally: Make sure Stripe CLI is running (`stripe listen`)
2. If on production: Check webhook secret matches Stripe Dashboard
3. Update `.env.local` and restart

### "No subscription found" in billing portal

**Cause:** Customer has no active subscriptions

**Fix:**
1. Complete a test subscription purchase first
2. Check Stripe Dashboard → Customers to verify subscription exists

---

## Need Help?

- Stripe Documentation: https://stripe.com/docs
- Stripe Support: https://support.stripe.com
- JobBeagle Issues: Open a GitHub issue
