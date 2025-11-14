"use client";

import { useEffect, useState } from 'react';
import Script from 'next/script';

export default function CozeCustomerService() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 当脚本加载完成后初始化 Coze 客服
    if (isLoaded && typeof window !== 'undefined' && (window as any).CozeWebSDK) {
      try {
        new (window as any).CozeWebSDK.WebChatClient({
          config: {
            bot_id: '7562450475955191851',
          },
          componentProps: {
            title: 'AI客服',
          },
          auth: {
            type: 'token',
            token: 'pat_7v0CEQ26r2DU6wGuW4xgQSsWdOuILIo7aqGZJZIlVjeC2bbjYNHSd2VAdq5FKU86',
            onRefreshToken: function () {
              return 'pat_7v0CEQ26r2DU6wGuW4xgQSsWdOuILIo7aqGZJZIlVjeC2bbjYNHSd2VAdq5FKU86';
            }
          }
        });
        console.log('✅ Coze 客服初始化成功');
      } catch (error) {
        console.error('❌ Coze 客服初始化失败:', error);
      }
    }
  }, [isLoaded]);

  return (
    <>
      {/* 加载 Coze SDK */}
      <Script
        src="https://lf-cdn.coze.cn/obj/unpkg/flow-platform/chat-app-sdk/1.2.0-beta.10/libs/cn/index.js"
        onLoad={() => {
          console.log('✅ Coze SDK 加载完成');
          setIsLoaded(true);
        }}
        onError={(e) => {
          console.error('❌ Coze SDK 加载失败:', e);
        }}
      />

      {/* 自定义的客服按钮（可选，如果 Coze SDK 自带按钮可以不要这个） */}
      {/* 
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-[#C8B6E2] to-[#9D84C8] rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
        title="联系客服"
      >
        <svg 
          className="w-7 h-7 text-white group-hover:scale-110 transition-transform" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" 
          />
        </svg>
      </button>
      */}
    </>
  );
}

