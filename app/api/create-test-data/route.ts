import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase';

export async function POST(req: NextRequest) {
  try {
    console.log('🔍 开始创建测试数据...');
    
    const results: any = {
      timestamp: new Date().toISOString(),
    };

    // 1. 创建测试用户
    const testUsers = [
      {
        phone: '13800138001',
        nickname: '测试用户1',
        invite_code: '13800138001',
        subscription_type: 'free',
        chat_count: 5,
        status: 'active'
      },
      {
        phone: '13800138002', 
        nickname: '测试用户2',
        invite_code: '13800138002',
        subscription_type: 'monthly',
        chat_count: 15,
        status: 'active'
      },
      {
        phone: '13800138003',
        nickname: '测试用户3', 
        invite_code: '13800138003',
        subscription_type: 'free',
        chat_count: 2,
        status: 'suspended'
      }
    ];

    try {
      // 先删除可能存在的测试数据
      await supabaseAdmin
        .from('users')
        .delete()
        .in('phone', testUsers.map(u => u.phone));

      // 插入测试用户
      const { data: insertedUsers, error: userError } = await supabaseAdmin
        .from('users')
        .insert(testUsers.map(user => ({
          ...user,
          trial_start: new Date().toISOString(),
          trial_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          subscription_start: user.subscription_type !== 'free' ? new Date().toISOString() : null,
          subscription_end: user.subscription_type !== 'free' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
          last_chat_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })))
        .select();

      if (userError) {
        results.users = { success: false, error: userError.message };
      } else {
        results.users = { success: true, count: insertedUsers?.length || 0, data: insertedUsers };
      }
    } catch (err) {
      results.users = {
        success: false,
        error: err instanceof Error ? err.message : '创建用户失败'
      };
    }

    // 2. 创建测试对话
    if (results.users.success) {
      try {
        const testConversations = [
          {
            user_phone: '13800138001',
            title: '测试对话1',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            user_phone: '13800138001',
            title: '测试对话2', 
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            user_phone: '13800138002',
            title: '测试对话3',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];

        const { data: insertedConversations, error: convError } = await supabaseAdmin
          .from('conversations')
          .insert(testConversations)
          .select();

        if (convError) {
          results.conversations = { success: false, error: convError.message };
        } else {
          results.conversations = { success: true, count: insertedConversations?.length || 0, data: insertedConversations };

          // 3. 创建测试消息（包含token使用量）
          if (insertedConversations && insertedConversations.length > 0) {
            const testMessages = [];
            
            insertedConversations.forEach((conv, index) => {
              // 为每个对话创建几条消息
              testMessages.push(
                {
                  conversation_id: conv.id,
                  role: 'user',
                  content: `用户消息 ${index + 1}`,
                  token_usage: Math.floor(Math.random() * 100) + 50, // 50-150 tokens
                  created_at: new Date().toISOString()
                },
                {
                  conversation_id: conv.id,
                  role: 'assistant', 
                  content: `助手回复 ${index + 1}`,
                  token_usage: Math.floor(Math.random() * 200) + 100, // 100-300 tokens
                  created_at: new Date().toISOString()
                }
              );
            });

            const { data: insertedMessages, error: msgError } = await supabaseAdmin
              .from('messages')
              .insert(testMessages)
              .select();

            if (msgError) {
              results.messages = { success: false, error: msgError.message };
            } else {
              const totalTokens = insertedMessages?.reduce((sum, msg) => sum + (msg.token_usage || 0), 0) || 0;
              results.messages = { 
                success: true, 
                count: insertedMessages?.length || 0, 
                totalTokens: totalTokens,
                data: insertedMessages 
              };
            }
          }
        }
      } catch (err) {
        results.conversations = {
          success: false,
          error: err instanceof Error ? err.message : '创建对话失败'
        };
      }
    }

    console.log('🔍 测试数据创建结果:', results);
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('🔍 创建测试数据出错:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '创建测试数据失败'
    }, { status: 500 });
  }
}
