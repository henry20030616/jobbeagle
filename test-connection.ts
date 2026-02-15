import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

async function testConnections() {
  console.log("🔍 開始測試連線...\n");

  // 測試 Supabase 環境變數
  console.log("1️⃣ 測試 Supabase 環境變數:");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    console.error("❌ NEXT_PUBLIC_SUPABASE_URL 未設定");
  } else {
    console.log("✅ NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl);
  }

  if (!supabaseKey) {
    console.error("❌ NEXT_PUBLIC_SUPABASE_ANON_KEY 未設定");
  } else {
    console.log("✅ NEXT_PUBLIC_SUPABASE_ANON_KEY:", supabaseKey.substring(0, 20) + "...");
  }

  // 測試 Supabase 連線
  if (supabaseUrl && supabaseKey) {
    try {
      console.log("\n2️⃣ 測試 Supabase 連線:");
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // 嘗試查詢一個簡單的表來測試連線
      const { data, error } = await supabase
        .from('analysis_reports')
        .select('id')
        .limit(1);

      if (error) {
        console.log("⚠️  Supabase 連線成功，但資料表可能尚未建立:", error.message);
        console.log("   提示: 請執行 supabase-schema.sql 來建立資料表");
      } else {
        console.log("✅ Supabase 連線成功！資料表可正常存取");
      }
    } catch (error: any) {
      console.error("❌ Supabase 連線失敗:", error.message);
    }
  } else {
    console.log("\n⚠️  跳過 Supabase 連線測試（環境變數未設定）");
  }

  // 測試 Gemini API
  console.log("\n3️⃣ 測試 Gemini API:");
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!geminiApiKey) {
    console.error("❌ GEMINI_API_KEY 未設定");
    console.log("\n📝 請在 .env.local 中設定 GEMINI_API_KEY");
  } else {
    console.log("✅ GEMINI_API_KEY 已設定");
    
    try {
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      
      console.log("   正在調用 Gemini API...");
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-lite',
        contents: {
          parts: [{ text: "請回覆 'Hello World'" }]
        }
      });

      const text = response.text || "";
      console.log("✅ Gemini API 回應成功！");
      console.log("   回應內容:", text);
      
      if (text.includes("Hello World") || text.toLowerCase().includes("hello")) {
        console.log("✅ 測試通過：API 正常運作");
      }
    } catch (error: any) {
      console.error("❌ Gemini API 調用失敗:", error.message);
      if (error.message.includes("API_KEY")) {
        console.log("   提示: 請檢查 GEMINI_API_KEY 是否正確");
      }
    }
  }

  console.log("\n✨ 測試完成！");
}

// 執行測試
testConnections().catch(console.error);
