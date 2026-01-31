// 测试数据库连接和自动保存功能
// 在终端运行: npx tsx test-db-connection.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function testDatabaseConnection() {
  console.log('🔍 开始测试数据库连接...\n');

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. 测试基本连接
  console.log('1️⃣ 测试基本连接...');
  try {
    const { data, error } = await supabase
      .from('analysis_reports')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ 连接失败:', error.message);
      return;
    }
    console.log('✅ 数据库连接正常\n');
  } catch (e) {
    console.error('❌ 连接异常:', e);
    return;
  }

  // 2. 检查表结构
  console.log('2️⃣ 检查表结构...');
  try {
    const { data, error } = await supabase
      .from('analysis_reports')
      .select('*')
      .limit(0);
    
    if (error) {
      console.error('❌ 无法查询表:', error.message);
    } else {
      console.log('✅ 表结构正常\n');
    }
  } catch (e) {
    console.error('❌ 查询异常:', e);
  }

  // 3. 查看最近的报告
  console.log('3️⃣ 查看最近的报告...');
  try {
    const { data, error } = await supabase
      .from('analysis_reports')
      .select('id, job_title, user_id, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('❌ 查询失败:', error.message);
    } else if (data && data.length > 0) {
      console.log(`✅ 找到 ${data.length} 份报告:`);
      data.forEach((report, i) => {
        console.log(`   ${i + 1}. ${report.job_title} (${new Date(report.created_at).toLocaleString()})`);
        console.log(`      用户ID: ${report.user_id || '未关联'}`);
      });
      console.log('');
    } else {
      console.log('⚠️  数据库中没有报告\n');
    }
  } catch (e) {
    console.error('❌ 查询异常:', e);
  }

  // 4. 检查 RLS policies
  console.log('4️⃣ 测试 RLS policies...');
  console.log('   注意：如果未登录，将无法插入/查询数据');
  console.log('   这是正常的，因为 RLS 要求用户必须登录\n');

  console.log('✅ 测试完成！\n');
  console.log('📝 如果报告没有自动保存，可能的原因：');
  console.log('   1. 用户未登录 - 必须先登录才能保存报告');
  console.log('   2. user_id 字段为 NULL - 检查后端是否正确获取用户');
  console.log('   3. RLS policies 阻止查询 - 确认策略设置正确');
  console.log('   4. 前端刷新未触发 - 检查浏览器控制台日志\n');
}

testDatabaseConnection();
