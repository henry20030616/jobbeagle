// 檢查 API Key 對應的專案資訊
require('dotenv').config({ path: '.env.local' });

async function checkAPIKeyProject() {
  console.log('🔍 檢查 API Key 對應的專案資訊\n');
  
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ 找不到 API Key');
    return;
  }

  console.log(`API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 10)}`);
  console.log('');

  // 嘗試獲取專案資訊
  try {
    // 方法1: 嘗試獲取模型列表（這會告訴我們 API Key 是否有效）
    console.log('1️⃣ 測試 API Key 並獲取可用資訊...');
    const modelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await fetch(modelsUrl);
    
    if (response.status === 401) {
      console.error('❌ API Key 無效或已過期');
      return;
    }

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Key 有效');
      
      // 嘗試從回應中獲取專案資訊（如果有的話）
      if (data.models && data.models.length > 0) {
        console.log(`   找到 ${data.models.length} 個可用模型`);
      }
    } else {
      const errorText = await response.text();
      console.log(`   狀態碼: ${response.status}`);
      console.log(`   回應: ${errorText.substring(0, 200)}`);
    }
  } catch (error) {
    console.error(`❌ 檢查失敗: ${error.message}`);
  }

  console.log('\n📋 如何確認 API Key 對應的專案：');
  console.log('');
  console.log('方法 1: 在 Google AI Studio 中查看');
  console.log('   1. 前往：https://aistudio.google.com/apikey');
  console.log('   2. 找到你的 API Key（後綴 ...byiCkAkHtc）');
  console.log('   3. 點擊該 API Key 查看詳情');
  console.log('   4. 查看 "Project name" 或 "Project number"');
  console.log('');
  console.log('方法 2: 在 Google Cloud Console 中檢查');
  console.log('   1. 前往：https://console.cloud.google.com/apis/credentials');
  console.log('   2. 找到你的 API Key');
  console.log('   3. 查看它屬於哪個專案');
  console.log('');
  console.log('💡 根據截圖，你有多個 jobbeagle 專案：');
  console.log('   - gen-lang-client-0292265367 (目前選中)');
  console.log('   - gen-lang-client-0459682640');
  console.log('   - jobbeagle');
  console.log('');
  console.log('建議：');
  console.log('1. 在 Google AI Studio 確認 API Key 對應的專案 ID');
  console.log('2. 選擇該專案來檢查配額設定');
  console.log('3. 確認該專案的配額等級（Tier 1 或 Free tier）');
  console.log('');
}

checkAPIKeyProject().catch(console.error);
