// Supabase维护脚本
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

class SupabaseMaintenance {
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  // 检查数据库状态
  async checkDatabaseStatus() {
    console.log('🔍 检查数据库状态...\n');
    
    try {
      // 检查表数量
      const tables = ['users', 'conversations', 'messages', 'orders', 'subscriptions', 'admins'];
      
      for (const table of tables) {
        const { count, error } = await this.supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: ${count} 条记录`);
        }
      }
    } catch (error) {
      console.log('❌ 检查数据库状态失败:', error.message);
    }
  }

  // 创建性能索引
  async createIndexes() {
    console.log('\n🔧 创建性能索引...\n');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)',
      'CREATE INDEX IF NOT EXISTS idx_conversations_user_phone ON conversations(user_phone)',
      'CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id)',
      'CREATE INDEX IF NOT EXISTS idx_orders_user_phone ON orders(user_phone)',
      'CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)',
      'CREATE INDEX IF NOT EXISTS idx_subscriptions_user_phone ON subscriptions(user_phone)',
      'CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at)'
    ];

    for (const index of indexes) {
      try {
        const { error } = await this.supabase.rpc('exec_sql', { sql: index });
        if (error) {
          console.log(`❌ 创建索引失败: ${error.message}`);
        } else {
          console.log(`✅ 索引创建成功`);
        }
      } catch (err) {
        console.log(`⚠️ 索引可能已存在: ${err.message}`);
      }
    }
  }

  // 数据清理
  async cleanupData() {
    console.log('\n🧹 数据清理...\n');
    
    try {
      // 清理90天前的消息
      const { error: msgError } = await this.supabase
        .from('messages')
        .delete()
        .lt('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());
      
      if (msgError) {
        console.log(`❌ 清理消息失败: ${msgError.message}`);
      } else {
        console.log('✅ 清理过期消息完成');
      }

      // 清理30天前的失败订单
      const { error: orderError } = await this.supabase
        .from('orders')
        .delete()
        .eq('status', 'failed')
        .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      
      if (orderError) {
        console.log(`❌ 清理失败订单失败: ${orderError.message}`);
      } else {
        console.log('✅ 清理失败订单完成');
      }

    } catch (error) {
      console.log('❌ 数据清理失败:', error.message);
    }
  }

  // 数据统计
  async getStatistics() {
    console.log('\n📊 数据统计...\n');
    
    try {
      // 用户统计
      const { count: userCount } = await this.supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      // 对话统计
      const { count: convCount } = await this.supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true });
      
      // 消息统计
      const { count: msgCount } = await this.supabase
        .from('messages')
        .select('*', { count: 'exact', head: true });
      
      // 订单统计
      const { count: orderCount } = await this.supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      console.log(`👥 用户总数: ${userCount}`);
      console.log(`💬 对话总数: ${convCount}`);
      console.log(`📝 消息总数: ${msgCount}`);
      console.log(`💰 订单总数: ${orderCount}`);

      // 今日新增
      const today = new Date().toISOString().split('T')[0];
      const { count: todayUsers } = await this.supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`);

      console.log(`📅 今日新增用户: ${todayUsers}`);

    } catch (error) {
      console.log('❌ 获取统计信息失败:', error.message);
    }
  }

  // 备份提醒
  async backupReminder() {
    console.log('\n💾 备份提醒...\n');
    console.log('📋 Supabase自动备份状态:');
    console.log('✅ 每日自动备份已启用');
    console.log('✅ 备份保留7天');
    console.log('✅ 可在Dashboard中查看备份状态');
    console.log('\n🔗 访问Dashboard: https://supabase.com/dashboard');
    console.log('选择您的项目: izgcguglvapifyngudcu');
  }

  // 运行所有维护任务
  async runAll() {
    console.log('🚀 开始Supabase维护任务...\n');
    
    await this.checkDatabaseStatus();
    await this.createIndexes();
    await this.cleanupData();
    await this.getStatistics();
    await this.backupReminder();
    
    console.log('\n🎉 维护任务完成!');
    console.log('\n📝 建议的维护频率:');
    console.log('- 每日: 检查数据库状态');
    console.log('- 每周: 数据清理和统计');
    console.log('- 每月: 性能优化和索引维护');
  }
}

// 运行维护任务
async function main() {
  try {
    const maintenance = new SupabaseMaintenance();
    await maintenance.runAll();
  } catch (error) {
    console.log('❌ 维护任务执行失败:', error.message);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = SupabaseMaintenance;
