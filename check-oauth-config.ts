/**
 * OAuth 配置檢查工具
 * 執行：npx tsx check-oauth-config.ts
 */

import { createClient } from './lib/supabase/browser';

async function checkOAuthConfig() {
  console.log('🔍 開始檢查 OAuth 配置...\n');

  // 1. 檢查環境變數
  console.log('1️⃣ 檢查環境變數:');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    console.error('   ❌ NEXT_PUBLIC_SUPABASE_URL 未設定');
    console.log('   💡 請在 .env.local 中設定 NEXT_PUBLIC_SUPABASE_URL');
  } else {
    console.log('   ✅ NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
  }

  if (!supabaseKey) {
    console.error('   ❌ NEXT_PUBLIC_SUPABASE_ANON_KEY 未設定');
    console.log('   💡 請在 .env.local 中設定 NEXT_PUBLIC_SUPABASE_ANON_KEY');
  } else {
    console.log('   ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey.substring(0, 20) + '...');
  }

  if (!supabaseUrl || !supabaseKey) {
    console.log('\n⚠️  環境變數未完整設定，無法繼續檢查。');
    return;
  }

  // 2. 檢查 Supabase 連線
  console.log('\n2️⃣ 檢查 Supabase 連線:');
  try {
    const supabase = createClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('   ❌ 無法連線到 Supabase:', error.message);
    } else {
      console.log('   ✅ Supabase 連線正常');
      if (session) {
        console.log('   ℹ️  目前有活躍的 session');
      } else {
        console.log('   ℹ️  目前沒有活躍的 session');
      }
    }
  } catch (err: any) {
    console.error('   ❌ 連線時發生錯誤:', err.message);
  }

  // 3. 檢查 Provider 設定（需要手動確認）
  console.log('\n3️⃣ Provider 設定檢查（需要手動確認）:');
  console.log('   請在 Supabase Dashboard 中確認以下項目：');
  console.log('   📍 路徑：Authentication → Providers → Google');
  console.log('   ☑️  Enable Google provider 是否已開啟');
  console.log('   ☑️  Client ID (for OAuth) 是否已填入');
  console.log('   ☑️  Client Secret (for OAuth) 是否已填入');
  
  // 提取 Project ID
  if (supabaseUrl) {
    const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    if (match) {
      const projectId = match[1];
      console.log('\n4️⃣ 重新導向 URI 設定:');
      console.log('   請在 Google Cloud Console 中確認以下 URI 已設定：');
      console.log(`   ✅ https://${projectId}.supabase.co/auth/v1/callback`);
      console.log('\n   📍 Google Cloud Console 路徑：');
      console.log('      API 和服務 → 憑證 → OAuth 2.0 用戶端 ID');
      console.log('      → 已授權的重新導向 URI');
    }
  }

  console.log('\n📚 更多資訊：');
  console.log('   - 詳細設定步驟：GOOGLE_OAUTH_SETUP.md');
  console.log('   - 故障排除指南：TROUBLESHOOTING.md');
  console.log('\n✨ 檢查完成！');
}

// 執行檢查
checkOAuthConfig().catch(console.error);
