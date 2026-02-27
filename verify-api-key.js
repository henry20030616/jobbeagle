// 簡單的 API Key 驗證腳本
require('dotenv').config({ path: '.env.local' });

async function verifyAPIKey() {
  console.log('🔍 驗證 Gemini API Key 和專案連結\n');
  
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ 找不到 API Key');
    console.log('   請確認 .env.local 中有設定 GOOGLE_GEMINI_API_KEY');
    return;
  }

  console.log('✅ 本地環境變數中找到 API Key');
  console.log(`   Key 長度: ${apiKey.length} 字元`);
  console.log(`   Key 前綴: ${apiKey.substring(0, 10)}...`);
  console.log(`   Key 後綴: ...${apiKey.substring(apiKey.length - 10)}`);
  console.log('');

  // 檢查格式
  if (apiKey.startsWith('AIza')) {
    console.log('✅ API Key 格式正確（以 AIza 開頭）');
  } else {
    console.log('⚠️  API Key 格式可能不正確（應以 AIza 開頭）');
  }
  console.log('');

  // 測試 API Key 有效性
  console.log('🧪 測試 API Key 有效性...');
  try {
    const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`;
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Hello' }] }]
      }),
    });

    console.log(`   狀態碼: ${response.status}`);

    if (response.status === 401) {
      console.error('   ❌ API Key 無效或已過期');
      console.log('   💡 請檢查：');
      console.log('      - API Key 是否正確複製');
      console.log('      - 是否在 Google AI Studio 中重新生成了新的 Key');
    } else if (response.status === 403) {
      console.error('   ❌ API Key 權限不足');
      console.log('   💡 請檢查：');
      console.log('      - 專案是否已啟用 Generative Language API');
      console.log('      - API Key 是否有正確的權限');
    } else if (response.status === 429) {
      console.warn('   ⚠️  配額用盡（這表示 API Key 有效）');
      console.log('   💡 API Key 是有效的，但配額已用完');
      console.log('   💡 請檢查 Google Cloud Console 的配額設定');
    } else if (response.ok) {
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      console.log('   ✅ API Key 有效且可正常使用！');
      console.log(`   測試回應: ${text.substring(0, 50)}...`);
    } else {
      const errorText = await response.text();
      console.error(`   ❌ 請求失敗 (${response.status})`);
      console.error(`   錯誤: ${errorText.substring(0, 200)}`);
    }
  } catch (error) {
    console.error(`   ❌ 測試失敗: ${error.message}`);
  }

  console.log('\n📋 下一步檢查：');
  console.log('1. 確認這個 API Key 在 Google AI Studio 中對應的專案名稱');
  console.log('2. 檢查該專案的配額設定：');
  console.log('   https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas');
  console.log('3. 確認 Vercel 環境變數是否與本地一致：');
  console.log('   https://vercel.com/dashboard → 你的專案 → Settings → Environment Variables');
  console.log('');
}

verifyAPIKey().catch(console.error);
