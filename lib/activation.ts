import { supabaseAdmin } from './supabase';

export interface Plan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  description: string | null;
  is_active: boolean;
}

export interface ActivationCode {
  id: string;
  code: string;
  plan_id: string;
  is_used: boolean;
  used_by_user_id: string | null;
  activated_at: string | null;
  expires_at: string;
  plan?: Plan;
}

export interface CommissionRecord {
  id: string;
  inviter_user_id: string;
  invited_user_id: string;
  plan_id: string;
  commission_amount: number;
  commission_percentage: number;
  level: number;
  activation_code_id: string | null;
  created_at: string;
}

export class ActivationManager {
  // 生成激活码
  static async generateActivationCodes(planId: string, count: number): Promise<{ success: boolean; codes?: string[]; error?: string }> {
    try {
      // 获取套餐信息
      const { data: plan, error: planError } = await supabaseAdmin
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (planError || !plan) {
        return { success: false, error: '套餐不存在' };
      }

      // 生成激活码
      const codes: string[] = [];
      const activationCodes = [];

      for (let i = 0; i < count; i++) {
        const code = this.generateCode();
        codes.push(code);
        
        // 设置激活码过期时间为3个月后
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 3);

        activationCodes.push({
          code,
          plan_id: planId,
          expires_at: expiresAt.toISOString()
        });
      }

      // 批量插入激活码
      const { error: insertError } = await supabaseAdmin
        .from('activation_codes')
        .insert(activationCodes);

      if (insertError) {
        return { success: false, error: '生成激活码失败' };
      }

      return { success: true, codes };
    } catch (error) {
      console.error('生成激活码错误:', error);
      return { success: false, error: '生成激活码失败' };
    }
  }

  // 验证并激活激活码
  static async activateCode(code: string, userId: string): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
      // 查找激活码
      const { data: activationCode, error: codeError } = await supabaseAdmin
        .from('activation_codes')
        .select(`
          *,
          plan:plans(*)
        `)
        .eq('code', code)
        .single();

      if (codeError || !activationCode) {
        console.error('激活码查询失败:', codeError);
        return { success: false, message: '激活码不存在' };
      }

      console.log('找到激活码:', {
        id: activationCode.id,
        code: activationCode.code,
        plan: activationCode.plan,
        is_used: activationCode.is_used
      });

      // 检查激活码是否已使用
      if (activationCode.is_used) {
        return { success: false, message: '激活码已被使用' };
      }

      // 检查激活码是否过期
      const now = new Date();
      const expiresAt = new Date(activationCode.expires_at);
      if (now > expiresAt) {
        return { success: false, message: '激活码已过期' };
      }

      // 获取用户信息
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        return { success: false, message: '用户不存在' };
      }

      // 开始事务处理
      const { error: updateCodeError } = await supabaseAdmin
        .from('activation_codes')
        .update({
          is_used: true,
          used_by_user_id: userId,
          activated_at: new Date().toISOString()
        })
        .eq('id', activationCode.id);

      if (updateCodeError) {
        return { success: false, message: '激活失败' };
      }

      // 创建订单记录
      const orderId = `ACT_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const { error: orderError } = await supabaseAdmin
        .from('orders')
        .insert({
          out_trade_no: orderId,
          user_phone: user.phone,
          plan: activationCode.plan.name,
          plan_id: activationCode.plan.id,
          amount_fen: activationCode.plan.price,
          duration_days: activationCode.plan.duration_days,
          status: 'success',
          trade_no: `ACTIVATION_${activationCode.id}`,
          paid_at: new Date().toISOString(),
          activation_code_id: activationCode.id,
          order_type: 'activation'
        });

      if (orderError) {
        console.error('创建订单失败:', orderError);
        console.error('订单数据:', {
          out_trade_no: orderId,
          user_phone: user.phone,
          plan: activationCode.plan.name,
          plan_id: activationCode.plan.id,
          amount_fen: activationCode.plan.price,
          duration_days: activationCode.plan.duration_days,
          status: 'success',
          trade_no: `ACTIVATION_${activationCode.id}`,
          paid_at: new Date().toISOString(),
          activation_code_id: activationCode.id,
          order_type: 'activation'
        });
        // 回滚激活码状态
        await supabaseAdmin
          .from('activation_codes')
          .update({
            is_used: false,
            used_by_user_id: null,
            activated_at: null
          })
          .eq('id', activationCode.id);
        return { success: false, message: `创建订单失败: ${orderError.message}` };
      }

      // 计算订阅开始和结束时间（使用UTC时间）
      const subscriptionStart = new Date();
      const subscriptionEnd = new Date(subscriptionStart.getTime() + activationCode.plan.duration_days * 24 * 60 * 60 * 1000);

      console.log('🕐 激活码订阅时间计算:', {
        planName: activationCode.plan.name,
        durationDays: activationCode.plan.duration_days,
        subscriptionStart: subscriptionStart.toISOString(),
        subscriptionEnd: subscriptionEnd.toISOString(),
        durationDays_calculated: (subscriptionEnd.getTime() - subscriptionStart.getTime()) / (24 * 60 * 60 * 1000)
      });

      // 先取消现有的活跃订阅
      await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('user_phone', user.phone)
        .eq('status', 'active');

      // 创建新的订阅记录
      const { error: subscriptionError } = await supabaseAdmin
        .from('subscriptions')
        .insert({
          user_phone: user.phone,
          plan: activationCode.plan.name,
          status: 'active',
          period_start: subscriptionStart.toISOString(),
          current_period_end: subscriptionEnd.toISOString(),
          activation_code_id: activationCode.id,
          subscription_type: 'activation'
        });

      if (subscriptionError) {
        console.error('创建订阅失败:', subscriptionError);
        return { success: false, message: '创建订阅失败' };
      }

      // 处理返佣
      await this.processCommission(userId, activationCode.plan_id, activationCode.id);

      return {
        success: true,
        message: '激活成功',
        data: {
          plan: activationCode.plan,
          expires_at: subscriptionEnd.toISOString()
        }
      };
    } catch (error) {
      console.error('激活码激活错误:', error);
      return { success: false, message: '激活失败' };
    }
  }

  // 处理返佣
  static async processCommission(userId: string, planId: string, activationCodeId: string): Promise<void> {
    try {
      // 获取用户信息
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !user || !user.invited_by) {
        return; // 没有邀请人，不处理返佣
      }

      // 获取套餐信息
      const { data: plan, error: planError } = await supabaseAdmin
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (planError || !plan) {
        return;
      }

      // 查找邀请人
      const { data: inviter, error: inviterError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('invite_code', user.invited_by)
        .single();

      if (inviterError || !inviter) {
        return;
      }

      // 计算返佣金额（一级奖励统一30%）
      const commissionRate = 0.3;
      const commissionAmount = Math.floor(plan.price * commissionRate);

      // 记录佣金
      const { error: commissionError } = await supabaseAdmin
        .from('commission_records')
        .insert({
          inviter_user_id: inviter.id,
          invited_user_id: userId,
          plan_id: planId,
          commission_amount: commissionAmount,
          commission_percentage: commissionRate * 100,
          level: 0,
          activation_code_id: activationCodeId
        });

      if (commissionError) {
        console.error('记录佣金失败:', commissionError);
        return;
      }

      // 更新邀请人余额
      await this.updateUserBalance(inviter.id, commissionAmount);

      // 处理二级返佣（邀请人的邀请人）
      if (inviter.invited_by) {
        const { data: level2Inviter, error: level2Error } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('invite_code', inviter.invited_by)
          .single();

        if (!level2Error && level2Inviter) {
          const level2CommissionAmount = Math.floor(plan.price * 0.1); // 10%二级返佣

          await supabaseAdmin
            .from('commission_records')
            .insert({
              inviter_user_id: level2Inviter.id,
              invited_user_id: userId,
              plan_id: planId,
              commission_amount: level2CommissionAmount,
              commission_percentage: 10,
              level: 1,
              activation_code_id: activationCodeId
            });

          await this.updateUserBalance(level2Inviter.id, level2CommissionAmount);
        }
      }
    } catch (error) {
      console.error('处理返佣错误:', error);
    }
  }

  // 检查是否首次购买
  static async isFirstPurchase(userId: string): Promise<boolean> {
    // 先获取用户手机号
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('phone')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return true; // 如果用户不存在，认为是首次购买
    }

    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('user_phone', user.phone)
      .eq('status', 'success')
      .eq('order_type', 'activation');

    return !error && (!orders || orders.length === 0);
  }

  // 更新用户余额
  static async updateUserBalance(userId: string, amount: number): Promise<void> {
    try {
      // 获取当前余额
      const { data: balance, error: balanceError } = await supabaseAdmin
        .from('balances')
        .select('amount')
        .eq('user_id', userId)
        .single();

      const currentAmount = balance?.amount || 0;
      const newAmount = currentAmount + amount;

      // 更新或创建余额记录
      await supabaseAdmin
        .from('balances')
        .upsert({
          user_id: userId,
          amount: newAmount
        });
    } catch (error) {
      console.error('更新用户余额失败:', error);
    }
  }

  // 生成激活码
  static generateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // 获取所有套餐
  static async getPlans(): Promise<{ success: boolean; plans?: Plan[]; error?: string }> {
    try {
      const { data: plans, error } = await supabaseAdmin
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) {
        return { success: false, error: '获取套餐失败' };
      }

      return { success: true, plans: plans || [] };
    } catch (error) {
      console.error('获取套餐错误:', error);
      return { success: false, error: '获取套餐失败' };
    }
  }

  // 获取用户余额
  static async getUserBalance(userId: string): Promise<{ success: boolean; balance?: number; error?: string }> {
    try {
      const { data: balance, error } = await supabaseAdmin
        .from('balances')
        .select('amount')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 表示没有找到记录
        return { success: false, error: '获取余额失败' };
      }

      return { success: true, balance: balance?.amount || 0 };
    } catch (error) {
      console.error('获取用户余额错误:', error);
      return { success: false, error: '获取余额失败' };
    }
  }

  // 获取用户佣金记录
  static async getUserCommissionRecords(userId: string): Promise<{ success: boolean; records?: CommissionRecord[]; error?: string }> {
    try {
      const { data: records, error } = await supabaseAdmin
        .from('commission_records')
        .select(`
          *,
          plan:plans(name, price),
          invited_user:users!commission_records_invited_user_id_fkey(phone, nickname)
        `)
        .eq('inviter_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('获取佣金记录失败:', error);
        return { success: false, error: '获取佣金记录失败' };
      }

      return { success: true, records: records || [] };
    } catch (error) {
      console.error('获取佣金记录错误:', error);
      return { success: false, error: '获取佣金记录失败' };
    }
  }
}
