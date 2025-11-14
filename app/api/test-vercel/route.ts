import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase';

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Vercel环境测试开始...');
    
    // 1. 测试环境变量
    const envTest = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasJwtSecret: !!process.env.JWT_SECRET,
      nodeEnv: process.env.NODE_ENV,
      useSupabase: process.env.USE_SUPABASE
    };
    
    console.log('环境变量检查:', envTest);
    
    // 2. 测试Supabase连接
    let supabaseTest = { connected: false, error: null, userCount: 0, subscriptionCount: 0 };
    try {
      const { data: users, error: userError } = await supabaseAdmin
        .from('users')
        .select('phone, subscription_type')
        .limit(5);
      
      if (userError) {
        supabaseTest.error = userError.message;
      } else {
        supabaseTest.connected = true;
        supabaseTest.userCount = users?.length || 0;
      }
      
      // 测试订阅表
      const { data: subscriptions, error: subError } = await supabaseAdmin
        .from('subscriptions')
        .select('user_phone, status')
        .eq('status', 'active')
        .limit(5);
      
      if (!subError) {
        supabaseTest.subscriptionCount = subscriptions?.length || 0;
      }
      
    } catch (error) {
      supabaseTest.error = error instanceof Error ? error.message : '未知错误';
    }
    
    console.log('Supabase测试:', supabaseTest);
    
    // 3. 测试付费用户统计逻辑
    let paidUserTest = { total: 0, fromUsers: 0, fromSubscriptions: 0, error: null };
    try {
      // 从users表统计
      const { data: usersWithSub, error: usersError } = await supabaseAdmin
        .from('users')
        .select('phone, subscription_type, subscription_end')
        .neq('subscription_type', 'free');
      
      if (!usersError) {
        const now = new Date();
        const validUsers = usersWithSub?.filter(u => 
          u.subscription_end ? new Date(u.subscription_end) > now : true
        ) || [];
        paidUserTest.fromUsers = validUsers.length;
      }
      
      // 从subscriptions表统计
      const { data: activeSubs, error: subError } = await supabaseAdmin
        .from('subscriptions')
        .select('user_phone, current_period_end')
        .eq('status', 'active');
      
      if (!subError) {
        const now = new Date();
        const validSubs = activeSubs?.filter(s => 
          new Date(s.current_period_end) > now
        ) || [];
        paidUserTest.fromSubscriptions = validSubs.length;
      }
      
      // 合并统计（去重）
      const allPaidUsers = new Set();
      
      if (usersWithSub) {
        const now = new Date();
        usersWithSub.forEach(u => {
          if (!u.subscription_end || new Date(u.subscription_end) > now) {
            allPaidUsers.add(u.phone);
          }
        });
      }
      
      if (activeSubs) {
        const now = new Date();
        activeSubs.forEach(s => {
          if (new Date(s.current_period_end) > now) {
            allPaidUsers.add(s.user_phone);
          }
        });
      }
      
      paidUserTest.total = allPaidUsers.size;
      
    } catch (error) {
      paidUserTest.error = error instanceof Error ? error.message : '未知错误';
    }
    
    console.log('付费用户测试:', paidUserTest);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: envTest,
      supabase: supabaseTest,
      paidUsers: paidUserTest,
      message: 'Vercel环境测试完成'
    });
    
  } catch (error) {
    console.error('Vercel测试失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
