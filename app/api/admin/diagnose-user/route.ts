import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone');

  if (!phone) {
    return Response.json({ error: 'phone parameter required' }, { status: 400 });
  }

  try {
    const result: any = {
      phone,
      timestamp: new Date().toISOString(),
      user: null,
      allConversations: [],
      activeConversations: [],
      messages: {},
      issues: []
    };

    // 1. 检查用户信息
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();

    if (userError) {
      result.issues.push(`用户不存在: ${userError.message}`);
      return Response.json(result);
    }

    result.user = {
      phone: user.phone,
      nickname: user.nickname,
      subscription_type: user.subscription_type,
      chat_count: user.chat_count,
      chat_limit: user.chat_limit,
      status: user.status
    };

    // 2. 检查所有对话（包括已删除的）
    const { data: allConversations, error: allConvError } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('user_phone', phone)
      .order('updated_at', { ascending: false });

    if (allConvError) {
      result.issues.push(`查询对话失败: ${allConvError.message}`);
    } else {
      result.allConversations = allConversations.map(c => ({
        id: c.id,
        title: c.title,
        is_deleted: c.is_deleted,
        deleted_at: c.deleted_at,
        created_at: c.created_at,
        updated_at: c.updated_at,
        dify_conversation_id: c.dify_conversation_id
      }));
    }

    // 3. 检查未删除的对话
    const { data: activeConversations, error: activeConvError } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('user_phone', phone)
      .eq('is_deleted', false)
      .order('updated_at', { ascending: false });

    if (activeConvError) {
      result.issues.push(`查询未删除对话失败: ${activeConvError.message}`);
    } else {
      result.activeConversations = activeConversations.map(c => ({
        id: c.id,
        title: c.title
      }));

      if (activeConversations.length === 0 && allConversations.length > 0) {
        result.issues.push('所有对话都被标记为已删除！这就是为什么左侧显示"余额/激活..."');
      }
    }

    // 4. 检查每个对话的消息
    for (const conv of allConversations) {
      const { data: messages, error: msgError } = await supabaseAdmin
        .from('messages')
        .select('*')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: true });

      if (msgError) {
        result.issues.push(`查询对话 ${conv.id} 的消息失败: ${msgError.message}`);
      } else {
        result.messages[conv.id] = {
          conversationTitle: conv.title,
          conversationDeleted: conv.is_deleted,
          messageCount: messages.length,
          messages: messages.map(m => ({
            id: m.id,
            role: m.role,
            content: m.content.substring(0, 100) + (m.content.length > 100 ? '...' : ''),
            is_deleted: m.is_deleted,
            created_at: m.created_at
          }))
        };
      }
    }

    // 5. 检查数据一致性
    const deletedConvIds = allConversations
      .filter((c: any) => c.is_deleted)
      .map((c: any) => c.id);

    if (deletedConvIds.length > 0) {
      const { data: orphanMessages, error: orphanError } = await supabaseAdmin
        .from('messages')
        .select('*')
        .in('conversation_id', deletedConvIds)
        .eq('is_deleted', false);

      if (orphanError) {
        result.issues.push(`查询孤立消息失败: ${orphanError.message}`);
      } else if (orphanMessages && orphanMessages.length > 0) {
        result.issues.push(`发现 ${orphanMessages.length} 条孤立消息（对话已删除但消息未删除）`);
      }
    }

    // 6. 生成修复建议
    result.fixSuggestions = [];
    if (result.activeConversations.length === 0 && result.allConversations.length > 0) {
      result.fixSuggestions.push({
        issue: '所有对话都被标记为已删除',
        solution: '恢复所有对话',
        sql: `UPDATE conversations SET is_deleted = false, deleted_at = NULL WHERE user_phone = '${phone}';`
      });
      result.fixSuggestions.push({
        issue: '只恢复最近的对话',
        solution: '恢复最新的一个对话',
        sql: `UPDATE conversations SET is_deleted = false, deleted_at = NULL WHERE user_phone = '${phone}' AND id = '${allConversations[0].id}';`
      });
    }

    return Response.json(result, { status: 200 });

  } catch (error) {
    console.error('诊断失败:', error);
    return Response.json({ 
      error: '诊断失败', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

