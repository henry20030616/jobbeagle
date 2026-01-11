
import React from 'react';
import { X, Zap, ArrowRight, MousePointerClick, Copy, Keyboard, CheckCircle2 } from 'lucide-react';

interface ExtensionGuideProps {
  onClose: () => void;
}

const ExtensionGuide: React.FC<ExtensionGuideProps> = ({ onClose }) => {
  
  /**
   * 純粹複製模式 (Pure Copy Mode)
   * 
   * 這是最穩定、絕對不會失敗的版本。
   * 
   * 邏輯：
   * 1. 抓取文字。
   * 2. 複製到剪貼簿。
   * 3. 顯示 Alert 告訴使用者：「複製好了，請切換分頁貼上」。
   * 
   * 優點：
   * - 不會被 Popup Blocker 擋住。
   * - 不會有 URL 長度限制。
   * - 適用於所有瀏覽器。
   */
  const rawCode = `
    (function(){
      /* 1. 智慧抓取 */
      var t = window.getSelection().toString();
      if (!t) {
        var selectors = [
          '.job-description__content',
          '#job-details',
          '.jobs-description__content', 
          'div[class*="JobDescription"]',
          'main', 'article', 'body'
        ];
        for(var i=0; i<selectors.length; i++) {
           var el = document.querySelector(selectors[i]);
           if(el && el.innerText.length > 100) { t = el.innerText; break; }
        }
      }
      
      if(!t || t.length < 50) { 
        alert('⚠️ 抓取失敗：無法自動偵測職缺內容。\\n\\n請「手動選取」文字後，再點擊一次書籤。'); 
        return; 
      }

      /* 2. 暴力複製 (確保成功) */
      try {
        var dummy = document.createElement("textarea");
        document.body.appendChild(dummy);
        dummy.value = t;
        dummy.select();
        document.execCommand("copy");
        document.body.removeChild(dummy);
        
        /* 3. 引導使用者 */
        alert('✅ 職缺內容已複製！ (' + t.length + ' 字)\\n\\n請切換回「AI 分析工具」分頁，並按下 [Ctrl+V] 貼上即可。');
      } catch(e) {
        alert('❌ 複製失敗，請手動複製。');
      }
    })();
  `;

  const minifiedCode = rawCode.replace(/\s+/g, ' ').trim();
  const bookmarkletHref = `javascript:${encodeURIComponent(minifiedCode)}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500/20 p-2 rounded-lg">
              <Zap className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">一鍵複製工具</h2>
              <p className="text-sm text-slate-400">解決所有無法抓取、無法跳轉的問題</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-8">
          
          {/* Step 1: Install */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
               <h3 className="text-lg font-semibold text-white flex items-center">
                <span className="bg-emerald-600 text-xs px-2 py-0.5 rounded-full mr-3">STEP 1</span>
                安裝 (拖曳下方按鈕)
              </h3>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-xl border border-dashed border-emerald-500/50 flex flex-col items-center text-center">
              <p className="text-slate-300 mb-4 text-sm">
                 請將此按鈕拖曳到書籤列 (覆蓋舊的)：
              </p>
              
              {/* THE DRAGGABLE BUTTON */}
              <a 
                href={bookmarkletHref}
                className="cursor-grab active:cursor-grabbing bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-emerald-500/25 flex items-center transform transition-transform hover:scale-105 group"
                onClick={(e) => e.preventDefault()}
                title="拖曳我到書籤列"
              >
                <Copy className="w-5 h-5 mr-2" />
                ⚡ 一鍵複製
              </a>
            </div>
          </div>

          {/* Usage Guide */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <span className="bg-slate-600 text-xs px-2 py-0.5 rounded-full mr-3">STEP 2</span>
              使用流程 (保證成功)
            </h3>
            
            <div className="flex items-center justify-between bg-slate-800 p-4 rounded-lg border border-slate-700 relative overflow-hidden">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-700/20">
                  <ArrowRight className="w-24 h-24" />
               </div>

               <div className="z-10 flex flex-col items-center w-1/3 text-center space-y-2">
                  <div className="bg-slate-700 p-3 rounded-full">
                    <MousePointerClick className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="text-sm font-medium text-slate-200">1. 點擊書籤</div>
                  <div className="text-xs text-slate-500">在求職網站頁面</div>
               </div>
               
               <div className="z-10 flex flex-col items-center w-1/3 text-center space-y-2">
                  <div className="bg-slate-700 p-3 rounded-full">
                    <CheckCircle2 className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="text-sm font-medium text-slate-200">2. 看到成功提示</div>
                  <div className="text-xs text-slate-500">內容已存入剪貼簿</div>
               </div>

               <div className="z-10 flex flex-col items-center w-1/3 text-center space-y-2">
                  <div className="bg-slate-700 p-3 rounded-full">
                    <Keyboard className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="text-sm font-medium text-slate-200">3. 回來按貼上</div>
                  <div className="text-xs text-slate-500">Ctrl + V</div>
               </div>
            </div>
          </div>
          
          <div className="bg-amber-900/20 border border-amber-500/30 p-4 rounded-lg flex items-start">
             <div className="shrink-0 mr-3 mt-1">
                <Zap className="w-5 h-5 text-amber-400" />
             </div>
             <div className="text-sm text-amber-200">
               <strong>懶人密技：</strong> 其實您也可以直接把 <strong>「職缺網址」</strong> 貼到輸入框，AI 會自動上網分析！只有當遇到需登入驗證的網站時，才需要使用這個書籤工具。
             </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            了解
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExtensionGuide;
