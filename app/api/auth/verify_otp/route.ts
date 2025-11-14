import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { consumeOtp } from '../../../../lib/otpStore';
import { getUsers } from '../../../../lib/config';

const JWT_SECRET = process.env.JWT_SECRET || 'seth-assistant-super-secret-key-2024';
const INVITE_CODE = process.env.INVITE_CODE || '';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const phone = String(body?.phone ?? '');
  const code = String(body?.code ?? '');
  const invite = String(body?.invite ?? '');
  // 兼容可能出现的空格/全角数字
  const normalizedCode = code.replace(/\s+/g, '').replace(/[\uFF10-\uFF19]/g, d => String.fromCharCode(d.charCodeAt(0) - 0xFF10 + 48));
  const okPhone = /^1[3-9]\d{9}$/.test(String(phone || ''));
  if (!okPhone) return Response.json({ success: false, message: 'invalid phone' }, { status: 400 });

  // 调试日志
  const shouldCheck = !!(INVITE_CODE && INVITE_CODE.trim() !== '');
  console.log('🔍 邀请码检查:', {
    hasInviteCode: !!INVITE_CODE,
    inviteCodeValue: INVITE_CODE,
    inviteCodeTrimmed: INVITE_CODE?.trim(),
    userInvite: invite,
    shouldCheck: shouldCheck,
    willCheck: shouldCheck && invite !== INVITE_CODE,
    // 详细调试
    inviteCodeExists: !!INVITE_CODE,
    inviteCodeNotEmpty: INVITE_CODE?.trim() !== '',
    logicResult: INVITE_CODE && INVITE_CODE.trim() !== '',
    doubleNegation: !!(INVITE_CODE && INVITE_CODE.trim() !== '')
  });

  // 如果配置了邀请码且不为空，则必须输入正确的邀请码
  // 修复：只有当INVITE_CODE不为空且用户输入不匹配时才验证失败
  if (INVITE_CODE && INVITE_CODE.trim() !== '' && invite !== INVITE_CODE) {
    console.log('❌ 邀请码验证失败:', { expected: INVITE_CODE, received: invite });
    return Response.json({ success: false, message: 'invalid invite' }, { status: 403 });
  }
  
  // 如果INVITE_CODE为空字符串，则跳过邀请码检查
  if (INVITE_CODE === '' || INVITE_CODE.trim() === '') {
    console.log('✅ 邀请码为空，跳过检查');
  }

  const verified = consumeOtp(phone, normalizedCode);
  if (!verified) return Response.json({ success: false, message: 'invalid code' }, { status: 400 });

  const token = jwt.sign({ phone }, JWT_SECRET, { expiresIn: '7d' });
  try {
    const usersModule = await getUsers();
    await usersModule.getOrCreateUser(phone);

    // 如果有邀请码，保存邀请关系
    if (invite && invite.trim()) {
      console.log('🔗 保存邀请关系:', { phone, inviterCode: invite });
      const result = await usersModule.setInvitedBy(phone, invite.trim());
      if (result) {
        console.log('✅ 邀请关系保存成功');
      } else {
        console.log('❌ 邀请关系保存失败，邀请码可能无效:', invite);
      }
    }
  } catch (error) {
    console.error('用户创建或邀请关系保存失败:', error);
  }
  // 设置Cookie，确保在所有环境下都能正常工作
  const cookieValue = `sid=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}; Secure`;

  console.log('🍪 设置Cookie:', {
    tokenLength: token.length,
    tokenPreview: token.substring(0, 50) + '...',
    cookieValue: cookieValue.substring(0, 100) + '...'
  });

  return new Response(JSON.stringify({ success: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': cookieValue,
    },
  });
}


