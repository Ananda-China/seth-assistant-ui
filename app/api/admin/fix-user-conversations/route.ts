import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, action } = body;

    if (!phone) {
      return Response.json({ error: 'phone parameter required' }, { status: 400 });
    }

    const result: any = {
      phone,
      action,
      timestamp: new Date().toISOString(),
      success: false,
      message: ''
    };

    if (action === 'restore_all') {
      // 恢复所有对话
      const { data, error } = await supabaseAdmin
        .from('conversations')
        .update({ 
          is_deleted: false, 
          deleted_at: null 
        })
        .eq('user_phone', phone)
        .eq('is_deleted', true)
        .select();

      if (error) {
        result.message = `恢复失败: ${error.message}`;
        return Response.json(result, { status: 500 });
      }

      result.success = true;
      result.message = `成功恢复 ${data.length} 个对话`;
      result.restoredConversations = data.map(c => ({
        id: c.id,
        title: c.title
      }));

    } else if (action === 'restore_latest') {
      // 只恢复最新的对话
      const { data: conversations, error: fetchError } = await supabaseAdmin
        .from('conversations')
        .select('*')
        .eq('user_phone', phone)
        .eq('is_deleted', true)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (fetchError) {
        result.message = `查询失败: ${fetchError.message}`;
        return Response.json(result, { status: 500 });
      }

      if (!conversations || conversations.length === 0) {
        result.message = '没有需要恢复的对话';
        return Response.json(result, { status: 404 });
      }

      const { data, error } = await supabaseAdmin
        .from('conversations')
        .update({ 
          is_deleted: false, 
          deleted_at: null 
        })
        .eq('id', conversations[0].id)
        .select();

      if (error) {
        result.message = `恢复失败: ${error.message}`;
        return Response.json(result, { status: 500 });
      }

      result.success = true;
      result.message = `成功恢复对话: ${conversations[0].title}`;
      result.restoredConversations = data.map(c => ({
        id: c.id,
        title: c.title
      }));

    } else {
      result.message = `未知操作: ${action}`;
      return Response.json(result, { status: 400 });
    }

    return Response.json(result, { status: 200 });

  } catch (error) {
    console.error('修复失败:', error);
    return Response.json({ 
      error: '修复失败', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

