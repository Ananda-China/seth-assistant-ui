import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '../../../lib/adminAuth';
import { supabaseAdmin } from '../../../lib/supabase';
import { getUsers } from '../../../lib/config';

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 开始调试管理员认证和用户数据...');
    
    const results: any = {
      timestamp: new Date().toISOString(),
    };

    // 1. 检查管理员认证
    const adminUser = requireAdminAuth(req);
    results.adminAuth = {
      isAuthenticated: !!adminUser,
      adminUser: adminUser,
      cookies: req.cookies.getAll(),
    };

    // 2. 检查用户模块
    try {
      const usersModule = await getUsers();
      results.usersModule = {
        success: true,
        hasGetAllUsers: 'getAllUsers' in usersModule,
        methods: Object.keys(usersModule)
      };

      // 3. 如果有getAllUsers方法，尝试调用
      if ('getAllUsers' in usersModule) {
        try {
          const userResult = await usersModule.getAllUsers(1, 5);
          results.getAllUsersTest = {
            success: true,
            data: userResult
          };
        } catch (err) {
          results.getAllUsersTest = {
            success: false,
            error: err instanceof Error ? err.message : '调用getAllUsers失败'
          };
        }
      }
    } catch (err) {
      results.usersModule = {
        success: false,
        error: err instanceof Error ? err.message : '获取用户模块失败'
      };
    }

    // 4. 直接查询Supabase用户数据
    try {
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select('*')
        .limit(5);
      
      results.directSupabaseQuery = {
        success: !usersError,
        count: users?.length || 0,
        data: users || [],
        error: usersError?.message || null
      };
    } catch (err) {
      results.directSupabaseQuery = {
        success: false,
        error: err instanceof Error ? err.message : '直接查询Supabase失败'
      };
    }

    // 5. 检查对话和消息数据
    try {
      const { data: conversations } = await supabaseAdmin
        .from('conversations')
        .select('id, user_phone');

      const { data: messages } = await supabaseAdmin
        .from('messages')
        .select('conversation_id, token_usage');

      results.conversationsAndMessages = {
        conversations: {
          count: conversations?.length || 0,
          sample: conversations?.slice(0, 3) || []
        },
        messages: {
          count: messages?.length || 0,
          totalTokens: messages?.reduce((sum, msg) => sum + (msg.token_usage || 0), 0) || 0,
          sample: messages?.slice(0, 3) || []
        }
      };
    } catch (err) {
      results.conversationsAndMessages = {
        error: err instanceof Error ? err.message : '查询对话和消息失败'
      };
    }

    console.log('🔍 调试结果:', results);
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('🔍 调试过程出错:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '调试失败'
    }, { status: 500 });
  }
}
