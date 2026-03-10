// JobBeagle 浏览器插件 - Popup 脚本

// 根據環境切換（開發/生產）
const WEBSITE_URL = 'https://www.jobbeagle.com';
// 開發環境使用: 'http://localhost:3001'

document.addEventListener('DOMContentLoaded', () => {
  const captureBtn = document.getElementById('captureBtn');
  const openWebBtn = document.getElementById('openWebBtn');
  const statusDiv = document.getElementById('status');
  const infoDiv = document.getElementById('info');

  // 检查当前页面
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentUrl = tabs[0].url;
    
    if (currentUrl.includes('104.com.tw/job/') || currentUrl.includes('linkedin.com/jobs/')) {
      infoDiv.textContent = '✅ 已檢測到職缺頁面，點擊按鈕開始抓取';
      captureBtn.disabled = false;
    } else {
      infoDiv.textContent = '❌ 請先瀏覽 104 或 LinkedIn 的職缺頁面';
      captureBtn.disabled = true;
    }
  });

  // 抓取職缺按鈕
  captureBtn.addEventListener('click', async () => {
    captureBtn.disabled = true;
    showStatus('loading', '🔄 正在抓取職缺內容...');

    try {
      // 获取当前标签页
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // 执行内容脚本抓取数据
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: extractJobData
      });

      const jobData = results[0].result;

      if (!jobData || !jobData.title) {
        throw new Error('無法抓取職缺資訊，請確認頁面已完全載入');
      }

      showStatus('loading', '📤 正在準備數據...');

      // 組合完整描述
      let fullDescription = jobData.fullText || '';
      
      // 使用 base64 編碼（避免 URL 特殊字符問題）
      const encodedData = btoa(encodeURIComponent(fullDescription));
      
      // 檢查數據大小（URL 有長度限制）
      if (encodedData.length > 8000) {
        // 數據太大，使用本地存儲
        const jobId = `ext_${Date.now()}`;
        localStorage.setItem(`jobbeagle_job_${jobId}`, fullDescription);
        
        showStatus('success', '✅ 成功！正在開啟分析頁面...');
        
        setTimeout(() => {
          chrome.tabs.create({
            url: `${WEBSITE_URL}?from=extension&jobId=${jobId}&source=${jobData.source}`
          });
          window.close();
        }, 1000);
      } else {
        // 數據較小，直接通過 URL 傳遞
        showStatus('success', '✅ 成功！正在開啟分析頁面...');
        
        setTimeout(() => {
          chrome.tabs.create({
            url: `${WEBSITE_URL}?from=extension&job=${encodedData}&source=${jobData.source}`
          });
          window.close();
        }, 1000);
      }

    } catch (error) {
      console.error('Error:', error);
      showStatus('error', `❌ ${error.message}`);
      captureBtn.disabled = false;
    }
  });

  // 开启网站按钮
  openWebBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://www.jobbeagle.com' });
  });
});

function showStatus(type, message) {
  const statusDiv = document.getElementById('status');
  statusDiv.className = `status ${type}`;
  statusDiv.textContent = message;
  statusDiv.style.display = 'block';
}

// 抓取職缺資料的函數（會在頁面中執行）
function extractJobData() {
  const url = window.location.href;
  let data = {
    title: '',
    company: '',
    description: '',
    salary: '',
    location: '',
    requirements: '',
    benefits: '',
    source: ''
  };

  // 檢測是 104 還是 LinkedIn
  if (url.includes('104.com.tw')) {
    data.source = '104';
    
    // 104 選擇器
    data.title = document.querySelector('.job-header__title')?.textContent?.trim() || 
                 document.querySelector('h1')?.textContent?.trim() || '';
    
    data.company = document.querySelector('.job-header__company-name')?.textContent?.trim() || 
                   document.querySelector('[data-qa="company-name"]')?.textContent?.trim() || '';
    
    data.salary = document.querySelector('.job-header__salary')?.textContent?.trim() || 
                  document.querySelector('[data-qa="salary"]')?.textContent?.trim() || '';
    
    data.location = document.querySelector('.job-header__location')?.textContent?.trim() || '';
    
    // 職缺描述
    const descElement = document.querySelector('.job-description') || 
                       document.querySelector('[data-qa="job-description"]');
    data.description = descElement?.textContent?.trim() || '';
    
    // 職務要求
    const reqElement = document.querySelector('.job-requirement') ||
                      document.querySelector('[data-qa="job-requirement"]');
    data.requirements = reqElement?.textContent?.trim() || '';
    
  } else if (url.includes('linkedin.com')) {
    data.source = 'LinkedIn';
    
    // LinkedIn 選擇器
    data.title = document.querySelector('.job-details-jobs-unified-top-card__job-title')?.textContent?.trim() ||
                 document.querySelector('h1')?.textContent?.trim() || '';
    
    data.company = document.querySelector('.job-details-jobs-unified-top-card__company-name')?.textContent?.trim() ||
                   document.querySelector('[data-test-job-details-company-name]')?.textContent?.trim() || '';
    
    data.location = document.querySelector('.job-details-jobs-unified-top-card__bullet')?.textContent?.trim() || '';
    
    // 職缺描述
    const descElement = document.querySelector('.jobs-description__content') ||
                       document.querySelector('.jobs-box__html-content');
    data.description = descElement?.textContent?.trim() || '';
  }

  // 組合完整描述
  let fullDescription = '';
  if (data.title) fullDescription += `職位：${data.title}\n\n`;
  if (data.company) fullDescription += `公司：${data.company}\n\n`;
  if (data.salary) fullDescription += `薪資：${data.salary}\n\n`;
  if (data.location) fullDescription += `地點：${data.location}\n\n`;
  if (data.description) fullDescription += `職缺描述：\n${data.description}\n\n`;
  if (data.requirements) fullDescription += `職務要求：\n${data.requirements}\n\n`;
  if (data.benefits) fullDescription += `福利待遇：\n${data.benefits}`;

  data.fullText = fullDescription;

  return data;
}
