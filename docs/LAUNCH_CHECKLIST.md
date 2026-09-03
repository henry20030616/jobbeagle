# 🚀 JobBeagle 上线检查清单

最后更新：2026-09-03

---

## 📋 目录
1. [支付系统](#1-支付系统)
2. [功能完整性](#2-功能完整性)
3. [安全性](#3-安全性)
4. [性能优化](#4-性能优化)
5. [数据库](#5-数据库)
6. [监控和日志](#6-监控和日志)
7. [法律合规](#7-法律合规)
8. [Chrome 扩展](#8-chrome-扩展)
9. [用户体验](#9-用户体验)
10. [营销准备](#10-营销准备)
11. [备份和恢复](#11-备份和恢复)
12. [上线步骤](#12-上线步骤)

---

## 1. 支付系统

### PayPal
- [ ] **身份验证完成**
  - [ ] PayPal Business 账户已通过审核
  - [ ] 能访问 Live 环境（developer.paypal.com）
  - [ ] 已创建 Live 应用
  - [ ] 已获取 Live Client ID 和 Secret

- [ ] **订阅计划已创建**
  - [ ] 运行 `node scripts/ops/setup-paypal.mjs` 创建 Live 计划
  - [ ] Standard 订阅：$19.99/月（100 Snapshot + 5 Guide）
  - [ ] Advanced 订阅：$39.99/月（300 Snapshot + 15 Guide）
  - [ ] 单次购买：$3（1 Snapshot）和 $9.99（1 Guide）

- [ ] **Webhook 配置**
  - [ ] Live webhook URL: `https://www.jobbeagle.com/api/payment/webhook`
  - [ ] Webhook ID 已写入 Vercel 环境变量
  - [ ] 测试 webhook 签名验证

- [ ] **环境变量（Vercel Production）**
  ```bash
  PAYPAL_CLIENT_ID=<Live Client ID>
  PAYPAL_CLIENT_SECRET=<Live Secret>
  PAYPAL_ENVIRONMENT=live
  PAYPAL_WEBHOOK_ID=<Live Webhook ID>
  PAYPAL_PLAN_STANDARD_SUB=<Live Standard Plan ID>
  PAYPAL_PLAN_ADVANCED_SUB=<Live Advanced Plan ID>
  ```

- [ ] **测试流程**
  - [ ] 用真实 PayPal 账户购买 $3 单次 Snapshot
  - [ ] 确认额度增加 1 次
  - [ ] 购买 Standard 订阅
  - [ ] 确认额度增加到 100 + 5
  - [ ] 查看下次扣款日期显示正确
  - [ ] 测试取消订阅功能
  - [ ] 测试自动续费（可能需要等待 1 个月）

---

## 2. 功能完整性

### 核心功能
- [ ] **Chrome 扩展**
  - [ ] 所有招聘网站正常抓取（LinkedIn, Indeed, ZipRecruiter, Glassdoor, GovernmentJobs, 104）
  - [ ] 一键发送到 jobbeagle.com/confirm
  - [ ] 用户登录状态同步

- [ ] **分析功能**
  - [ ] Job Fit Snapshot 生成正常（Gemini Flash-Lite，无搜索）
  - [ ] Interview Strategy Guide 生成正常（Gemini Pro + Search）
  - [ ] 评分和建议准确
  - [ ] PDF 导出功能正常

- [ ] **账户管理**
  - [ ] 注册/登录（Google OAuth）
  - [ ] 额度显示准确
  - [ ] 购买历史完整
  - [ ] 订阅管理（查看状态、取消、续费日期）
  - [ ] Career Context 设置
  - [ ] 账户删除（CCPA 合规）

- [ ] **支付流程**
  - [ ] 单次购买流程完整（选择 → 支付 → 回调 → 额度增加）
  - [ ] 订阅购买流程完整
  - [ ] 支付失败处理正确
  - [ ] 重复支付防护（幂等性）

### 边界情况
- [ ] **额度耗尽**
  - [ ] 0 额度时显示 paywall
  - [ ] 引导用户购买
  
- [ ] **错误处理**
  - [ ] API 超时重试
  - [ ] Gemini API 失败提示
  - [ ] PayPal 支付失败提示
  - [ ] 网络错误提示

---

## 3. 安全性

### API 安全
- [ ] **Rate Limiting**
  - [ ] `/api/analyze` 限速（60次/小时/IP）
  - [ ] `/api/extension-capture` 限速
  - [ ] `/api/checkout` 限速
  - [ ] `/api/payment/webhook` 限速（120次/小时/IP）

- [ ] **认证和授权**
  - [ ] 所有需要登录的 API 检查 auth
  - [ ] Service role key 仅在后端使用
  - [ ] Webhook 签名验证（PayPal HMAC-SHA256）

- [ ] **输入验证**
  - [ ] JD/Resume 文本过滤 prompt injection
  - [ ] 使用 `wrapUntrusted` 包装用户输入
  - [ ] 文件上传大小限制
  - [ ] SQL 注入防护（Supabase RLS）

- [ ] **敏感数据**
  - [ ] `.env.local` 不提交到 Git
  - [ ] Vercel 环境变量加密存储
  - [ ] 数据库密码/API key 定期轮换

### Supabase 安全
- [ ] **RLS（Row Level Security）启用**
  - [ ] `profiles` 表：用户只能读自己的
  - [ ] `analysis_reports` 表：用户只能读自己的
  - [ ] `orders` 表：用户只能读自己的

- [ ] **权限锁定（Migration 011）**
  - [ ] 客户端无法修改 credits
  - [ ] 客户端无法修改 membership_tier
  - [ ] 只有 service_role 和 SECURITY DEFINER RPCs 可以修改

- [ ] **RPCs 权限**
  - [ ] `increment_profile_credits` 仅 service_role 可调用
  - [ ] `decrement_*_credit` 仅 service_role 可调用

### 代码审查
- [ ] **运行安全测试**
  ```bash
  npm run gate:generated
  npm run test:security
  ```

- [ ] **无敏感信息泄露**
  - [ ] Console.log 无生产环境敏感信息
  - [ ] Error messages 不暴露内部细节

---

## 4. 性能优化

### 前端
- [ ] **加载速度**
  - [ ] Lighthouse Performance Score > 90
  - [ ] First Contentful Paint < 1.5s
  - [ ] Largest Contentful Paint < 2.5s

- [ ] **优化**
  - [ ] 图片懒加载
  - [ ] Code splitting（Next.js 自动）
  - [ ] CDN 加速（Vercel Edge Network）

### 后端
- [ ] **API 响应时间**
  - [ ] `/api/analyze` 平均 < 5s（Gemini 依赖）
  - [ ] `/api/account` 平均 < 200ms
  - [ ] `/api/checkout` 平均 < 1s

- [ ] **数据库查询**
  - [ ] 索引优化（user_id, external_checkout_id）
  - [ ] 连接池配置合理

---

## 5. 数据库

### Supabase
- [ ] **Migrations 已应用**
  ```bash
  node scripts/ops/supabase-apply-migrations.mjs
  ```

- [ ] **表结构完整**
  - [ ] `profiles`（用户资料 + 额度 + 会员等级）
  - [ ] `analysis_reports`（分析报告）
  - [ ] `orders`（订单记录）
  - [ ] `referrals`（推荐记录，如果有）

- [ ] **RLS 策略正确**
  - [ ] 测试用户 A 无法读取用户 B 的数据

- [ ] **备份策略**
  - [ ] Supabase 自动每日备份启用
  - [ ] 手动备份脚本测试通过

---

## 6. 监控和日志

### Vercel
- [ ] **部署监控**
  - [ ] Production 部署成功
  - [ ] Build logs 无错误
  - [ ] Runtime logs 可访问

### Supabase
- [ ] **数据库监控**
  - [ ] 连接数正常（< 80% 限制）
  - [ ] 查询性能监控启用

### PayPal
- [ ] **Webhook 监控**
  - [ ] Webhook 事件日志可查看
  - [ ] 失败重试机制测试

### 错误追踪
- [ ] **Sentry 或类似工具（可选）**
  - [ ] 前端错误追踪
  - [ ] 后端错误追踪
  - [ ] Alert 设置

---

## 7. 法律合规

### 隐私政策和服务条款
- [ ] **页面存在且可访问**
  - [ ] `/privacy` - 隐私政策
  - [ ] `/terms` - 服务条款
  - [ ] Footer 链接正确

- [ ] **CCPA 合规**
  - [ ] 账户删除功能（`/api/account/delete`）
  - [ ] 硬删除所有用户数据
  - [ ] 不出售用户数据声明

- [ ] **GDPR 合规（如有欧洲用户）**
  - [ ] Cookie 同意横幅
  - [ ] 数据导出功能
  - [ ] 用户数据访问请求流程

### 税务
- [ ] **PayPal 不是 MoR**
  - [ ] 了解自己负责税务申报
  - [ ] 咨询会计师（如需要）

---

## 8. Chrome 扩展

### 发布状态
- [ ] **Chrome Web Store 已发布**
  - [ ] 扩展 ID: `pceknhembhfnljhpajkpdbihfbpfolpm`
  - [ ] 列表 URL 已设置在 `NEXT_PUBLIC_CHROME_WEBSTORE_URL`
  - [ ] 版本号：1.3.2+

### 功能测试
- [ ] **所有招聘网站测试**
  - [ ] LinkedIn：抓取 JD → 发送到 confirm 页面
  - [ ] Indeed
  - [ ] ZipRecruiter
  - [ ] Glassdoor
  - [ ] GovernmentJobs
  - [ ] 104.com.tw

- [ ] **用户体验**
  - [ ] 扩展图标正常显示
  - [ ] 弹窗界面清晰
  - [ ] 错误提示友好

---

## 9. 用户体验

### 引导流程
- [ ] **新用户 Onboarding**
  - [ ] 首次登录引导
  - [ ] 扩展安装引导
  - [ ] 首次使用教学

### 响应式设计
- [ ] **移动端适配**
  - [ ] iPhone（Safari）
  - [ ] Android（Chrome）
  - [ ] iPad

### 多语言支持（当前支持）
- [ ] 英文
- [ ] 繁体中文
- [ ] 简体中文
- [ ] 其他语言（可选）

### 可访问性
- [ ] **基本 A11y**
  - [ ] 键盘导航
  - [ ] 屏幕阅读器兼容
  - [ ] 颜色对比度 > 4.5:1

---

## 10. 营销准备

### 网站内容
- [ ] **首页**
  - [ ] 清晰的价值主张
  - [ ] CTA 按钮明显
  - [ ] 功能展示

- [ ] **Landing Pages**
  - [ ] `/extension` - 扩展下载页
  - [ ] `/pricing` - 定价页（如有）
  - [ ] `/samples` - 示例报告

### SEO
- [ ] **基本 SEO**
  - [ ] `<title>` 标签优化
  - [ ] `<meta description>` 设置
  - [ ] Open Graph 标签
  - [ ] Sitemap.xml 生成
  - [ ] Robots.txt 正确配置

### Analytics
- [ ] **Google Analytics 4**
  - [ ] 跟踪代码已安装（`NEXT_PUBLIC_GA_MEASUREMENT_ID`）
  - [ ] 关键事件追踪：
    - [ ] 注册
    - [ ] 首次分析
    - [ ] 购买（单次 + 订阅）
    - [ ] 扩展安装

### 社交媒体
- [ ] **账号准备**
  - [ ] Twitter/X
  - [ ] LinkedIn
  - [ ] ProductHunt（可选）

---

## 11. 备份和恢复

### 数据备份
- [ ] **Supabase 备份**
  - [ ] 每日自动备份启用
  - [ ] 手动备份测试通过
  - [ ] 恢复流程测试通过

- [ ] **代码备份**
  - [ ] GitHub 作为单一真相来源
  - [ ] `.env.local` 安全存储（1Password/Bitwarden）

### 灾难恢复计划
- [ ] **Vercel 故障**
  - [ ] 备用部署方案（如 Netlify）
  - [ ] DNS 切换流程

- [ ] **Supabase 故障**
  - [ ] 数据库迁移脚本准备
  - [ ] 备份恢复时间 < 4 小时

---

## 12. 上线步骤

### Pre-launch（当前阶段）
1. ✅ Sandbox 环境测试完成
2. ⏳ 等待 PayPal 身份验证（1-3 工作日）
3. ⏳ 完成本清单所有项目

### Launch Day
1. [ ] **切换到 Live PayPal**
   ```bash
   # 更新 .env.local
   PAYPAL_ENVIRONMENT=live
   # 其他 Live credentials
   
   # 创建 Live 订阅计划
   node scripts/ops/setup-paypal.mjs
   
   # 同步到 Vercel
   bash scripts/ops/sync-vercel-env.sh
   
   # 部署
   npx vercel deploy --prod
   ```

2. [ ] **DNS 和域名**
   - [ ] www.jobbeagle.com 解析正确
   - [ ] SSL 证书有效

3. [ ] **最终测试**
   - [ ] 用真实 PayPal 账户完成一笔交易
   - [ ] 验证 webhook 接收和处理
   - [ ] 检查所有关键流程

4. [ ] **监控就位**
   - [ ] 检查 Vercel logs
   - [ ] 检查 Supabase logs
   - [ ] 检查 PayPal webhook logs

### Post-launch
1. [ ] **密切监控前 48 小时**
   - [ ] 每 2 小时检查一次日志
   - [ ] 响应用户问题 < 1 小时

2. [ ] **收集反馈**
   - [ ] 设置用户反馈渠道
   - [ ] 监控社交媒体提及

3. [ ] **性能优化**
   - [ ] 分析真实用户数据
   - [ ] 根据需要调整

---

## 🎯 优先级

### P0（必须完成才能上线）
- ✅ PayPal Sandbox 测试通过
- ⏳ PayPal 身份验证通过
- ⏳ Live 环境配置完成
- [ ] 安全测试全部通过
- [ ] 核心功能测试通过
- [ ] 隐私政策和服务条款上线

### P1（上线后 1 周内完成）
- [ ] 监控和 Alert 设置
- [ ] 完整的备份恢复测试
- [ ] 性能优化
- [ ] Analytics 事件追踪

### P2（上线后 1 个月内完成）
- [ ] SEO 优化
- [ ] 用户引导优化
- [ ] 多语言内容完善
- [ ] 营销活动准备

---

## 📞 紧急联系方式

### 关键服务商支持
- **PayPal**: 0800-666-067（台湾）
- **Vercel**: support@vercel.com
- **Supabase**: support@supabase.io
- **Google Cloud**: support.google.com

### 内部联系
- 开发团队：[你的联系方式]
- 客户支持：[支持邮箱]

---

## ✅ 签核

- [ ] **开发负责人签核**：_____________  日期：______
- [ ] **最终审核通过**：_____________  日期：______

---

**注意：** 此清单会随着项目进展持续更新。请在每个项目完成后打勾，并记录完成日期。
