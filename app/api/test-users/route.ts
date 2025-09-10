import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase';
import { getUsers } from '../../../lib/config';

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 测试用户数据获取...');
    
    const results: any = {
      timestamp: new Date().toISOString(),
    };

    // 1. 直接查询Supabase用户数据
    try {
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select('*')
        .limit(10);
      
      results.directQuery = {
        success: !usersError,
        count: users?.length || 0,
        data: users || [],
        error: usersError?.message || null
      };
    } catch (err) {
      results.directQuery = {
        success: false,
        error: err instanceof Error ? err.message : '直接查询失败'
      };
    }

    // 2. 使用用户模块
    try {
      const usersModule = await getUsers();
      
      if ('getAllUsers' in usersModule) {
        const result = await usersModule.getAllUsers(1, 10);
        results.moduleQuery = {
          success: true,
          data: result
        };
      } else {
        results.moduleQuery = {
          success: false,
          error: 'getAllUsers方法不存在'
        };
      }
    } catch (err) {
      results.moduleQuery = {
        success: false,
        error: err instanceof Error ? err.message : '模块查询失败'
      };
    }

    // 3. 查询对话和消息数据
    try {
      const { data: conversations } = await supabaseAdmin
        .from('conversations')
        .select('id, user_phone');

      const { data: messages } = await supabaseAdmin
        .from('messages')
        .select('conversation_id, token_usage');

      results.relatedData = {
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
      results.relatedData = {
        error: err instanceof Error ? err.message : '相关数据查询失败'
      };
    }

    console.log('🔍 测试结果:', results);
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('🔍 测试过程出错:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '测试失败'
    }, { status: 500 });
  }
}
