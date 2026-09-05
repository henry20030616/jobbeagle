#!/usr/bin/env node
/**
 * Setup PayPal Live products and subscription plans
 * Creates all required products and plans for JobBeagle
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_ENVIRONMENT = process.env.PAYPAL_ENVIRONMENT || 'sandbox';

if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
  console.error('❌ Missing PayPal credentials in .env.local');
  console.error('   Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET');
  process.exit(1);
}

const API_BASE =
  PAYPAL_ENVIRONMENT === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

/**
 * Get PayPal access token
 */
async function getAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const response = await fetch(`${API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${auth}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Create a PayPal product
 */
async function createProduct(token, name, description) {
  const response = await fetch(`${API_BASE}/v1/catalogs/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name,
      description,
      type: 'SERVICE',
      category: 'SOFTWARE',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create product "${name}": ${error}`);
  }

  const data = await response.json();
  return data.id;
}

/**
 * Create a subscription plan
 */
async function createSubscriptionPlan(token, productId, name, description, price) {
  const response = await fetch(`${API_BASE}/v1/billing/plans`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      product_id: productId,
      name,
      description,
      billing_cycles: [
        {
          frequency: {
            interval_unit: 'MONTH',
            interval_count: 1,
          },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0, // Infinite
          pricing_scheme: {
            fixed_price: {
              value: price,
              currency_code: 'USD',
            },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 3,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create plan "${name}": ${error}`);
  }

  const data = await response.json();
  return data.id;
}

/**
 * Main setup
 */
async function main() {
  console.log('🚀 Setting up PayPal Live products and plans...\n');
  console.log(`📍 Environment: ${PAYPAL_ENVIRONMENT.toUpperCase()}`);
  console.log(`🌐 API Base: ${API_BASE}\n`);

  try {
    // Step 1: Get access token
    console.log('🔑 Getting access token...');
    const token = await getAccessToken();
    console.log('✅ Access token obtained\n');

    // Step 2: Create products
    console.log('📦 Creating products...');

    console.log('  → Creating "JobBeagle Subscriptions" product...');
    const subscriptionProductId = await createProduct(
      token,
      'JobBeagle Subscriptions',
      'Monthly subscription plans for JobBeagle job analysis service'
    );
    console.log(`  ✅ Product ID: ${subscriptionProductId}\n`);

    // Step 3: Create subscription plans
    console.log('💳 Creating subscription plans...');

    console.log('  → Creating Standard Subscription ($19.99/month)...');
    const standardPlanId = await createSubscriptionPlan(
      token,
      subscriptionProductId,
      'JobBeagle Standard',
      'Standard plan: 100 Job Fit Snapshots + 5 Interview Strategy Guides per month',
      '19.99'
    );
    console.log(`  ✅ Standard Plan ID: ${standardPlanId}`);

    console.log('  → Creating Advanced Subscription ($39.99/month)...');
    const advancedPlanId = await createSubscriptionPlan(
      token,
      subscriptionProductId,
      'JobBeagle Advanced',
      'Advanced plan: 300 Job Fit Snapshots + 15 Interview Strategy Guides per month',
      '39.99'
    );
    console.log(`  ✅ Advanced Plan ID: ${advancedPlanId}\n`);

    // Step 4: Display results
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎉 PayPal Live setup complete!\n');
    console.log('📋 Add these to your .env.local:\n');
    console.log(`PAYPAL_PLAN_STANDARD_SUB=${standardPlanId}`);
    console.log(`PAYPAL_PLAN_ADVANCED_SUB=${advancedPlanId}\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('⚠️  Note: One-time products ($3 Snapshot / $9.99 Guide) use');
    console.log('   PayPal Checkout API (no pre-created product ID needed).\n');

    return { standardPlanId, advancedPlanId };
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

main();
