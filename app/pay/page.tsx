"use client";

import { useEffect, useState } from 'react';

export default function PayPage() {
  const [loading, setLoading] = useState(false);
  const [qr, setQr] = useState<string | null>(null);

  async function createWxOrder(amountFen: number, plan: string) {
    setLoading(true);
    setQr(null);
    const outTradeNo = `${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    const res = await fetch('/api/wxpay/create_session', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amountFen, description: `订阅-${plan}`, outTradeNo, plan })
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (data?.code_url) {
      setQr(data.code_url);
      if (data?.mock) {
        alert('当前为模拟下单模式，请复制 out_trade_no 到“模拟支付成功”接口进行验证。');
      }
      // 轮询订单状态
      const timer = setInterval(async () => {
        const r = await fetch(`/api/wxpay/order_status?out_trade_no=${outTradeNo}`);
        const s = await r.json();
        if (s?.status === 'success') {
          clearInterval(timer);
          alert('支付成功，订阅已开通');
          window.location.href = '/';
        }
      }, 2000);
    } else {
      alert(data?.message || '下单失败');
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-6">购买订阅</h1>
      <div className="space-y-3">
        <button onClick={() => createWxOrder(9900, '月付')} className="w-full px-4 py-2 rounded bg-black text-white" disabled={loading}>微信扫码支付 - 月付 ¥99</button>
        <button onClick={() => createWxOrder(25900, '季付')} className="w-full px-4 py-2 rounded bg-black text-white" disabled={loading}>微信扫码支付 - 季付 ¥259</button>
        <button onClick={() => createWxOrder(89900, '年付')} className="w-full px-4 py-2 rounded bg-black text-white" disabled={loading}>微信扫码支付 - 年付 ¥899</button>
      </div>

      {qr && (
        <div className="mt-6">
          <div className="text-sm mb-2">请使用微信扫描二维码完成支付</div>
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qr)}`} alt="wxpay" />
          {qr.startsWith('MOCK-') && (
            <div className="text-xs text-gray-500 mt-2 break-all">out_trade_no: {qr.replace('MOCK-','')}</div>
          )}
        </div>
      )}
    </main>
  );
}


