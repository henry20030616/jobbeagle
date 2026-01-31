# 调试步骤 - 报告保存问题

## 🔍 请按照以下步骤测试

### 步骤 1: 打开浏览器控制台
```
按 F12 (Windows) 或 Cmd+Option+I (Mac)
切换到 "Console" 标签
```

### 步骤 2: 清空控制台
```
点击 🚫 图标清空所有日志
```

### 步骤 3: 确认已登入
```
检查右上角是否显示 "登出" 按钮
如果显示 "登入"，请先登入
```

### 步骤 4: 生成报告
```
1. 填写职缺资讯
2. 上传履历
3. 点击 "启动 AI 战略分析"
4. 等待报告生成完成
```

### 步骤 5: 仔细查看控制台日志

**必须看到以下日志（按顺序）：**

```
🚀 [Frontend] 開始生成報告...
(AI 分析过程)
💾 [DB] 準備保存報告到數據庫...
💾 [DB] 用戶狀態: 已登入 (ID: xxx)
💾 [DB] 插入數據: {user_id: 'xxx', job_title: 'xxx', ...}
✅ [DB Success] 報告已成功保存！
✅ [DB Success] 報告 ID: xxx
✅ [DB Success] 職位標題: xxx
✅ [DB Success] 保存時間: xxx
📦 [Frontend] 收到回應: {saved: true, hasReport: true}
✅ [Frontend] 報告已設置到狀態
✅ [Frontend] 報告已保存，開始刷新列表...
(等待 3 秒)
🔄 [Frontend] 正在載入最新報告列表...
📊 [Page] 開始載入報告列表...
✅ [Page] 成功載入 X 份報告
📋 [Page] 報告列表: [{id: 'xxx', title: 'xxx', time: 'xxx'}, ...]
✅ [Page] recentReports 狀態已更新
✅ [Frontend] 報告列表刷新完成
```

### 步骤 6: 检查问题

#### 如果看到 "用戶未登入"
```
⚠️  [DB] 用戶未登入，報告將不會保存到數據庫
```
**解决方案：** 先登入后再生成报告

#### 如果看到 "儲存失敗"
```
❌ [DB Error] 儲存失敗: [错误信息]
```
**解决方案：** 
1. 复制完整错误信息
2. 检查 Supabase 数据库是否正常
3. 执行 migrate-add-missing-fields.sql

#### 如果看到 "saved: false"
```
📦 [Frontend] 收到回應: {saved: false, hasReport: true}
```
**解决方案：** 用户未登入或后端保存失败

#### 如果载入 0 份报告
```
✅ [Page] 成功載入 0 份報告
```
**解决方案：**
1. 检查数据库是否有记录
2. 检查 RLS policies
3. 执行以下 SQL：
```sql
SELECT id, user_id, job_title, created_at
FROM analysis_reports
ORDER BY created_at DESC
LIMIT 10;
```

### 步骤 7: 返回首页并验证

```
1. 点击 "返回首页列表"
2. 查找右上角的 "近期分析報告" 按钮
3. 确认按钮显示数字 (X/10)
4. 点击按钮
5. 确认新报告出现在列表顶部
```

## 📝 如果仍然失败

请提供以下信息：

1. **完整的控制台日志**（从开始生成到刷新完成）
2. **是否已登入**（是/否）
3. **Supabase 查询结果**：
```sql
-- 查询所有报告
SELECT id, user_id, job_title, created_at
FROM analysis_reports
ORDER BY created_at DESC
LIMIT 10;

-- 查询当前用户 ID
SELECT auth.uid();
```

4. **浏览器和系统信息**
