import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase';
import { requireAdminAuth } from '../../../lib/adminAuth';

/**
 * 测试定制化AI配置创建
 * 用于诊断500错误
 */
export async function GET(req: NextRequest) {
  try {
    console.log('🔍 开始测试定制化AI配置...');

    // 1. 测试管理员认证
    const authResult = requireAdminAuth(req);
    if ('error' in authResult) {
      return NextResponse.json({
        step: '管理员认证',
        success: false,
        error: '认证失败'
      }, { status: 401 });
    }

    console.log('✅ 管理员认证成功:', authResult.user.username);

    // 2. 测试Supabase连接
    const { data: testQuery, error: testError } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('❌ Supabase连接失败:', testError);
      return NextResponse.json({
        step: 'Supabase连接测试',
        success: false,
        error: testError.message,
        details: testError
      }, { status: 500 });
    }

    console.log('✅ Supabase连接成功');

    // 3. 检查custom_ai_configs表是否存在
    const { data: tableCheck, error: tableError } = await supabaseAdmin
      .from('custom_ai_configs')
      .select('id')
      .limit(1);

    if (tableError) {
      console.error('❌ custom_ai_configs表检查失败:', tableError);
      return NextResponse.json({
        step: 'custom_ai_configs表检查',
        success: false,
        error: tableError.message,
        hint: '请确认已在Supabase中执行数据库迁移SQL',
        details: tableError
      }, { status: 500 });
    }

    console.log('✅ custom_ai_configs表存在');

    // 4. 测试插入操作（使用测试数据）
    const testUserId = testQuery && testQuery.length > 0 ? testQuery[0].id : null;
    
    if (!testUserId) {
      return NextResponse.json({
        step: '获取测试用户ID',
        success: false,
        error: '数据库中没有用户数据'
      }, { status: 500 });
    }

    // 尝试插入测试配置
    const testConfig = {
      customer_id: testUserId,
      dify_app_id: 'test-app-id-' + Date.now(),
      dify_api_key: 'test-api-key',
      dify_api_url: 'https://api.dify.ai/v1',
      knowledge_base_id: null,
      system_prompt: null,
      is_active: true
    };

    console.log('🧪 尝试插入测试配置:', testConfig);

    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('custom_ai_configs')
      .insert(testConfig)
      .select()
      .single();

    if (insertError) {
      console.error('❌ 插入测试配置失败:', insertError);
      return NextResponse.json({
        step: '插入测试配置',
        success: false,
        error: insertError.message,
        code: insertError.code,
        details: insertError,
        hint: insertError.code === '23505' 
          ? '该用户已有定制配置（UNIQUE约束）' 
          : insertError.code === '42501'
          ? 'RLS策略权限问题'
          : '未知错误'
      }, { status: 500 });
    }

    console.log('✅ 插入测试配置成功:', insertData);

    // 5. 清理测试数据
    const { error: deleteError } = await supabaseAdmin
      .from('custom_ai_configs')
      .delete()
      .eq('id', insertData.id);

    if (deleteError) {
      console.warn('⚠️ 清理测试数据失败:', deleteError);
    } else {
      console.log('✅ 测试数据已清理');
    }

    return NextResponse.json({
      success: true,
      message: '所有测试通过！',
      steps: [
        '✅ 管理员认证成功',
        '✅ Supabase连接成功',
        '✅ custom_ai_configs表存在',
        '✅ 插入测试配置成功',
        '✅ 测试数据已清理'
      ],
      adminUser: authResult.user.username,
      testUserId: testUserId
    });

  } catch (error) {
    console.error('❌ 测试过程异常:', error);
    return NextResponse.json({
      success: false,
      error: '测试过程异常',
      message: error instanceof Error ? error.message : '未知错误',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

