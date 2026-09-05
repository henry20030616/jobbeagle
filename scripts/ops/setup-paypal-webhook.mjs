#!/usr/bin/env node
/**
 * Setup PayPal Live Webhook
 * Creates a webhook to receive payment notifications
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

const WEBHOOK_URL = 'https://www.jobbeagle.com/api/payment/webhook';

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
 * Create webhook
 */
async function createWebhook(token) {
  const response = await fetch(`${API_BASE}/v1/notifications/webhooks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      url: WEBHOOK_URL,
      event_types: [
        { name: 'PAYMENT.SALE.COMPLETED' },
        { name: 'PAYMENT.CAPTURE.COMPLETED' },
        { name: 'BILLING.SUBSCRIPTION.ACTIVATED' },
        { name: 'BILLING.SUBSCRIPTION.CANCELLED' },
        { name: 'BILLING.SUBSCRIPTION.SUSPENDED' },
        { name: 'BILLING.SUBSCRIPTION.UPDATED' },
        { name: 'BILLING.SUBSCRIPTION.EXPIRED' },
        { name: 'BILLING.SUBSCRIPTION.PAYMENT.FAILED' },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create webhook: ${error}`);
  }

  const data = await response.json();
  return data.id;
}

/**
 * Main setup
 */
async function main() {
  console.log('🚀 Setting up PayPal Live Webhook...\n');
  console.log(`📍 Environment: ${PAYPAL_ENVIRONMENT.toUpperCase()}`);
  console.log(`🌐 API Base: ${API_BASE}`);
  console.log(`📡 Webhook URL: ${WEBHOOK_URL}\n`);

  try {
    // Step 1: Get access token
    console.log('🔑 Getting access token...');
    const token = await getAccessToken();
    console.log('✅ Access token obtained\n');

    // Step 2: Create webhook
    console.log('📡 Creating webhook...');
    const webhookId = await createWebhook(token);
    console.log(`✅ Webhook ID: ${webhookId}\n`);

    // Step 3: Display results
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎉 PayPal Live Webhook configured!\n');
    console.log('📋 Add this to your .env.local:\n');
    console.log(`PAYPAL_WEBHOOK_ID=${webhookId}\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    return webhookId;
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

main();
