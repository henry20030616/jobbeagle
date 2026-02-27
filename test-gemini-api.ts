import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 載入環境變數
dotenv.config({ path: '.env.local' });

async function testGeminiAPI() {
  console.log('🔍 開始測試 Gemini API Key 和專案連結...\n');

  const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ 找不到 API Key');
    console.log('   請確認 .env.local 中有設定 GOOGLE_GEMINI_API_KEY 或 GEMINI_API_KEY');
    return;
  }

  console.log('✅ API Key 已找到');
  console.log(`   Key 長度: ${apiKey.length} 字元`);
  console.log(`   Key 前綴: ${apiKey.substring(0, 10)}...`);
  console.log(`   Key 後綴: ...${apiKey.substring(apiKey.length - 10)}`);
  console.log('');

  // 測試 1: 檢查 API Key 格式
  console.log('1️⃣ 檢查 API Key 格式...');
  if (apiKey.startsWith('AIza')) {
    console.log('   ✅ API Key 格式正確（以 AIza 開頭）');
  } else {
    console.log('   ⚠️  API Key 格式可能不正確（應以 AIza 開頭）');
  }
  console.log('');

  // 測試 2: 嘗試獲取模型列表（這會告訴我們 API Key 是否有效以及對應的專案）
  console.log('2️⃣ 測試 API Key 有效性（獲取可用模型列表）...');
  try {
    const modelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await fetch(modelsUrl);
    
    if (response.status === 401) {
      console.error('   ❌ API Key 無效或已過期 (401)');
      console.log('   請檢查：');
      console.log('   - API Key 是否正確複製');
      console.log('   - API Key 是否已刪除或過期');
      console.log('   - 是否在 Google AI Studio 中重新生成了新的 Key');
      return;
    }

    if (response.status === 403) {
      console.error('   ❌ API Key 權限不足 (403)');
      console.log('   請檢查：');
      console.log('   - API Key 是否有正確的權限');
      console.log('   - 專案是否已啟用 Generative Language API');
      return;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`   ❌ 請求失敗 (${response.status})`);
      console.error(`   錯誤: ${errorText.substring(0, 200)}`);
      return;
    }

    const data = await response.json();
    console.log('   ✅ API Key 有效！');
    
    if (data.models && Array.isArray(data.models)) {
      const geminiModels = data.models
        .filter((m: any) => m.name?.includes('gemini'))
        .map((m: any) => m.name?.replace('models/', '') || '');
      
      console.log(`   📊 找到 ${geminiModels.length} 個 Gemini 模型`);
      console.log('   🔍 檢查是否包含目標模型...');
      
      const targetModel = 'gemini-2.0-flash-lite';
      if (geminiModels.includes(targetModel)) {
        console.log(`   ✅ 找到目標模型: ${targetModel}`);
      } else {
        console.log(`   ⚠️  未找到目標模型: ${targetModel}`);
        console.log(`   可用模型範例: ${geminiModels.slice(0, 5).join(', ')}`);
      }
    }
    console.log('');

    // 測試 3: 嘗試簡單的 API 呼叫
    console.log('3️⃣ 測試實際 API 呼叫（使用 gemini-2.0-flash-lite）...');
    try {
      const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`;
      const testResponse = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: '請回覆 "Hello"' }]
          }]
        }),
      });

      if (testResponse.status === 429) {
        console.warn('   ⚠️  配額用盡 (429)');
        console.log('   這表示 API Key 有效，但配額已用完');
        console.log('   請檢查 Google Cloud Console 的配額設定');
      } else if (testResponse.ok) {
        const testData = await testResponse.json();
        const text = testData.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log('   ✅ API 呼叫成功！');
        console.log(`   回應: ${text.substring(0, 50)}...`);
      } else {
        const errorText = await testResponse.text();
        console.error(`   ❌ API 呼叫失敗 (${testResponse.status})`);
        console.error(`   錯誤: ${errorText.substring(0, 200)}`);
      }
    } catch (err: any) {
      console.error(`   ❌ 測試失敗: ${err.message}`);
    }
    console.log('');

    // 測試 4: 檢查專案資訊（從 API Key 無法直接獲取，但可以從錯誤訊息推斷）
    console.log('4️⃣ 專案連結確認...');
    console.log('   📝 注意：API Key 本身不包含專案資訊');
    console.log('   💡 請在 Google AI Studio 確認：');
    console.log('      - 這個 API Key 屬於哪個專案');
    console.log('      - 專案的配額設定（Tier 1 或 Free tier）');
    console.log('      - 專案是否已啟用付費');
    console.log('');

  } catch (error: any) {
    console.error('   ❌ 測試失敗:', error.message);
  }

  console.log('✨ 測試完成！');
  console.log('');
  console.log('📋 下一步：');
  console.log('1. 確認 API Key 在 Google AI Studio 中對應的專案');
  console.log('2. 檢查該專案的配額設定：https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas');
  console.log('3. 確認 Vercel 環境變數是否與本地 .env.local 一致');
}

testGeminiAPI().catch(console.error);
