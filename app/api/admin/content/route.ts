import { NextRequest } from 'next/server';
import { requireAdminAuth } from '../../../../lib/adminAuth';

export async function GET(req: NextRequest) {
  // 验证管理员权限
  const adminUser = requireAdminAuth(req);
  if (!adminUser) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const user = searchParams.get('user') || '';

  try {
    // 从文件系统读取所有对话和消息数据
    const { promises: fs } = await import('fs');
    const path = await import('path');
    const DATA_DIR = path.join(process.cwd(), '.data');
    const CONV_FILE = path.join(DATA_DIR, 'conversations.json');
    const MSG_FILE = path.join(DATA_DIR, 'messages.json');
    
    let conversations = [];
    let messages = [];
    
    try {
      const convData = await fs.readFile(CONV_FILE, 'utf8');
      console.log('Content API - Raw conversations file content length:', convData.length);
      conversations = JSON.parse(convData || '[]');
      console.log('Content API - Parsed conversations count:', conversations.length);
    } catch (error) {
      console.log('No conversations file found, starting with empty array');
      conversations = [];
    }
    
    try {
      const msgData = await fs.readFile(MSG_FILE, 'utf8');
      messages = JSON.parse(msgData || '[]');
    } catch (error) {
      console.log('No messages file found, starting with empty array');
      messages = [];
    }

    // 为每个对话添加消息统计和用户信息
    const enrichedConversations = conversations.map((conv: any) => {
      const convMessages = messages.filter((msg: any) => msg.conversation_id === conv.id);
      const userMessages = convMessages.filter((msg: any) => msg.role === 'user');
      const aiMessages = convMessages.filter((msg: any) => msg.role === 'assistant');
      
      // 计算token使用量
      const totalTokens = convMessages.reduce((sum: number, msg: any) => {
        return sum + (msg.token_usage || 0);
      }, 0);
      
      // 获取最后一条消息内容作为预览
      const lastMessage = convMessages[convMessages.length - 1];
      const preview = lastMessage ? lastMessage.content.substring(0, 100) + '...' : '无消息内容';
      
      // 添加完整的消息列表，按时间排序
      const sortedMessages = convMessages.sort((a: any, b: any) => a.created_at - b.created_at);
      const fullMessages = sortedMessages.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        created_at: msg.created_at,
        token_usage: msg.token_usage || 0
      }));
      
      return {
        id: conv.id,
        title: conv.title || '新会话',
        user: conv.user,
        status: 'active', // 暂时都设为活跃状态
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        total_messages: convMessages.length,
        user_messages: userMessages.length,
        ai_messages: aiMessages.length,
        total_tokens: totalTokens,
        preview: preview,
        messages: fullMessages, // 添加完整的消息列表
        dify_conversation_id: conv.dify_conversation_id
      };
    });

    // 应用搜索过滤
    let filteredConversations = enrichedConversations;
    if (search) {
      filteredConversations = enrichedConversations.filter((conv: any) => 
        conv.title.includes(search) || 
        conv.preview.includes(search) ||
        conv.user.includes(search)
      );
    }

    // 应用状态过滤
    if (status) {
      filteredConversations = filteredConversations.filter((conv: any) => conv.status === status);
    }

    // 应用用户过滤
    if (user) {
      filteredConversations = filteredConversations.filter((conv: any) => conv.user.includes(user));
    }

    // 按更新时间排序（最新的在前）
    filteredConversations.sort((a: any, b: any) => b.updated_at - a.updated_at);

    // 计算分页
    const total = filteredConversations.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedConversations = filteredConversations.slice(startIndex, endIndex);

    return Response.json({
      conversations: paginatedConversations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  // 验证管理员权限
  const adminUser = requireAdminAuth(req);
  if (!adminUser) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { id, status, title, action } = await req.json();
    
    if (!id) {
      return new Response('Conversation ID is required', { status: 400 });
    }

    if (action === 'bulk_update' && Array.isArray(id)) {
      // 批量更新状态
      const { promises: fs } = await import('fs');
      const path = await import('path');
      const DATA_DIR = path.join(process.cwd(), '.data');
      const CONV_FILE = path.join(DATA_DIR, 'conversations.json');
      
      try {
        const convData = await fs.readFile(CONV_FILE, 'utf8');
        let conversations = JSON.parse(convData || '[]');
        
        // 更新指定对话的状态
        conversations = conversations.map((conv: any) => {
          if (id.includes(conv.id)) {
            return { ...conv, status, updated_at: Date.now() };
          }
          return conv;
        });
        
        await fs.writeFile(CONV_FILE, JSON.stringify(conversations, null, 2));
        
        return Response.json({ 
          success: true, 
          message: `Successfully updated ${id.length} conversations` 
        });
      } catch (error) {
        console.error('Error updating conversations:', error);
        return new Response('Internal Server Error', { status: 500 });
      }
    } else {
      // 单个更新
      const { promises: fs } = await import('fs');
      const path = await import('path');
      const DATA_DIR = path.join(process.cwd(), '.data');
      const CONV_FILE = path.join(DATA_DIR, 'conversations.json');
      
      try {
        const convData = await fs.readFile(CONV_FILE, 'utf8');
        let conversations = JSON.parse(convData || '[]');
        
        const convIndex = conversations.findIndex((conv: any) => conv.id === id);
        if (convIndex !== -1) {
          // 支持更新状态和标题
          const updateData: any = { updated_at: Date.now() };
          if (status !== undefined) updateData.status = status;
          if (title !== undefined) updateData.title = title;
          
          conversations[convIndex] = { 
            ...conversations[convIndex], 
            ...updateData
          };
          
          await fs.writeFile(CONV_FILE, JSON.stringify(conversations, null, 2));
          
          return Response.json({ success: true, message: 'Conversation updated successfully' });
        } else {
          return new Response('Conversation not found', { status: 404 });
        }
      } catch (error) {
        console.error('Error updating conversation:', error);
        return new Response('Internal Server Error', { status: 500 });
      }
    }
  } catch (error) {
    console.error('Error updating conversation:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  // 验证管理员权限
  const adminUser = requireAdminAuth(req);
  if (!adminUser) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { id } = await req.json();
    
    if (!id) {
      return new Response('Conversation ID is required', { status: 400 });
    }

    const { promises: fs } = await import('fs');
    const path = await import('path');
    const DATA_DIR = path.join(process.cwd(), '.data');
    const CONV_FILE = path.join(DATA_DIR, 'conversations.json');
    const MSG_FILE = path.join(DATA_DIR, 'messages.json');
    
    try {
      // 读取现有数据
      const convData = await fs.readFile(CONV_FILE, 'utf8');
      let conversations = JSON.parse(convData || '[]');
      
      const msgData = await fs.readFile(MSG_FILE, 'utf8');
      let messages = JSON.parse(msgData || '[]');
      
      // 删除指定对话
      conversations = conversations.filter((conv: any) => conv.id !== id);
      
      // 删除相关消息
      messages = messages.filter((msg: any) => msg.conversation_id !== id);
      
      // 保存更新后的数据
      await fs.writeFile(CONV_FILE, JSON.stringify(conversations, null, 2));
      await fs.writeFile(MSG_FILE, JSON.stringify(messages, null, 2));
      
      return Response.json({ success: true, message: 'Conversation deleted successfully' });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
