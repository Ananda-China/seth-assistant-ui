import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 客户端 Supabase 实例（用于前端）
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 服务端 Supabase 实例（用于后端 API，绕过 RLS）
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 数据库类型定义
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          phone: string;
          nickname: string | null;
          invite_code: string;
          invited_by: string | null;
          created_at: string;
          trial_start: string | null;
          trial_end: string | null;
          subscription_type: 'free' | 'monthly' | 'quarterly' | 'yearly';
          subscription_start: string | null;
          subscription_end: string | null;
          chat_count: number;
          last_chat_date: string | null;
          status: 'active' | 'suspended';
          updated_at: string;
        };
        Insert: {
          id?: string;
          phone: string;
          nickname?: string | null;
          invite_code: string;
          invited_by?: string | null;
          created_at?: string;
          trial_start?: string | null;
          trial_end?: string | null;
          subscription_type?: 'free' | 'monthly' | 'quarterly' | 'yearly';
          subscription_start?: string | null;
          subscription_end?: string | null;
          chat_count?: number;
          last_chat_date?: string | null;
          status?: 'active' | 'suspended';
          updated_at?: string;
        };
        Update: {
          id?: string;
          phone?: string;
          nickname?: string | null;
          invite_code?: string;
          invited_by?: string | null;
          created_at?: string;
          trial_start?: string | null;
          trial_end?: string | null;
          subscription_type?: 'free' | 'monthly' | 'quarterly' | 'yearly';
          subscription_start?: string | null;
          subscription_end?: string | null;
          chat_count?: number;
          last_chat_date?: string | null;
          status?: 'active' | 'suspended';
          updated_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          user_phone: string;
          title: string | null;
          dify_conversation_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_phone: string;
          title?: string | null;
          dify_conversation_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_phone?: string;
          title?: string | null;
          dify_conversation_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: 'user' | 'assistant' | 'system';
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: 'user' | 'assistant' | 'system';
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          role?: 'user' | 'assistant' | 'system';
          content?: string;
          created_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          out_trade_no: string;
          user_phone: string;
          plan: string;
          plan_id: string | null;
          amount_fen: number;
          duration_days: number | null;
          status: 'pending' | 'success' | 'failed';
          trade_no: string | null;
          zpay_status: string | null;
          created_at: string;
          paid_at: string | null;
          failed_at: string | null;
        };
        Insert: {
          id?: string;
          out_trade_no: string;
          user_phone: string;
          plan: string;
          plan_id?: string | null;
          amount_fen: number;
          duration_days?: number | null;
          status?: 'pending' | 'success' | 'failed';
          trade_no?: string | null;
          zpay_status?: string | null;
          created_at?: string;
          paid_at?: string | null;
          failed_at?: string | null;
        };
        Update: {
          id?: string;
          out_trade_no?: string;
          user_phone?: string;
          plan?: string;
          plan_id?: string | null;
          amount_fen?: number;
          duration_days?: number | null;
          status?: 'pending' | 'success' | 'failed';
          trade_no?: string | null;
          zpay_status?: string | null;
          created_at?: string;
          paid_at?: string | null;
          failed_at?: string | null;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_phone: string;
          plan: string;
          status: 'active' | 'expired' | 'cancelled';
          period_start: string;
          current_period_end: string;
          monthly_quota: number | null;
          used_this_period: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_phone: string;
          plan: string;
          status?: 'active' | 'expired' | 'cancelled';
          period_start: string;
          current_period_end: string;
          monthly_quota?: number | null;
          used_this_period?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_phone?: string;
          plan?: string;
          status?: 'active' | 'expired' | 'cancelled';
          period_start?: string;
          current_period_end?: string;
          monthly_quota?: number | null;
          used_this_period?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      admins: {
        Row: {
          id: string;
          username: string;
          password_hash: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          password_hash: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          password_hash?: string;
          created_at?: string;
        };
      };
      plans: {
        Row: {
          id: string;
          name: string;
          price: number;
          duration_days: number;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          price: number;
          duration_days: number;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          price?: number;
          duration_days?: number;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      activation_codes: {
        Row: {
          id: string;
          code: string;
          plan_id: string;
          is_used: boolean;
          used_by_user_id: string | null;
          activated_at: string | null;
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          plan_id: string;
          is_used?: boolean;
          used_by_user_id?: string | null;
          activated_at?: string | null;
          expires_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          plan_id?: string;
          is_used?: boolean;
          used_by_user_id?: string | null;
          activated_at?: string | null;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      balances: {
        Row: {
          user_id: string;
          amount: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          amount?: number;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          amount?: number;
          updated_at?: string;
        };
      };
      commission_records: {
        Row: {
          id: string;
          inviter_user_id: string;
          invited_user_id: string;
          plan_id: string;
          commission_amount: number;
          commission_percentage: number;
          level: number;
          activation_code_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          inviter_user_id: string;
          invited_user_id: string;
          plan_id: string;
          commission_amount: number;
          commission_percentage: number;
          level: number;
          activation_code_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          inviter_user_id?: string;
          invited_user_id?: string;
          plan_id?: string;
          commission_amount?: number;
          commission_percentage?: number;
          level?: number;
          activation_code_id?: string | null;
          created_at?: string;
        };
      };
      withdrawal_requests: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          status: 'pending' | 'processing' | 'completed' | 'rejected';
          payment_method: 'alipay' | 'wechat';
          account_info: string;
          processed_by_admin_id: string | null;
          processed_at: string | null;
          transfer_screenshot_url: string | null;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          status?: 'pending' | 'processing' | 'completed' | 'rejected';
          payment_method: 'alipay' | 'wechat';
          account_info: string;
          processed_by_admin_id?: string | null;
          processed_at?: string | null;
          transfer_screenshot_url?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          status?: 'pending' | 'processing' | 'completed' | 'rejected';
          payment_method?: 'alipay' | 'wechat';
          account_info?: string;
          processed_by_admin_id?: string | null;
          processed_at?: string | null;
          transfer_screenshot_url?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
