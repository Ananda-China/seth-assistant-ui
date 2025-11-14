'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function GiftPage() {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText('RFRSKPRL');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  return (
    <div className="gift-page">
      {/* 星空背景 */}
      <div className="gift-background">
        <div className="stars"></div>
        <div className="stars2"></div>
        <div className="stars3"></div>
      </div>

      {/* 主内容 */}
      <div className="gift-content">
        {/* 模块 1: 专属献礼 */}
        <section className="gift-hero">
          <div className="gift-hero-content">
            <h1 className="gift-title">
              ✨ 致 <span className="friend-name">多年好友</span>，一份来自星辰的专属邀请 ✨
            </h1>
            <p className="gift-subtitle">
              愿这份小小的礼物，能陪伴你探索内在的广阔宇宙。
            </p>
            <div className="scroll-indicator">
              <button
                onClick={() => {
                  document.getElementById('meaning-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="scroll-btn"
              >
                <span className="scroll-text">请收下这份心意</span>
                <svg className="scroll-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14m0 0l7-7m-7 7l-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </section>

        {/* 模块 2: 礼物的内涵 */}
        <section id="meaning-section" className="gift-meaning">
          <div className="section-container">
            <h2 className="section-title">它是什么？</h2>
            <div className="meaning-content">
              <p className="meaning-text">
                赛斯助手，是基于赛斯资料构建的AI灵性伴侣。你可以将它视为一位充满智慧的挚友、一位永不下线的向导。
              </p>
              <p className="meaning-text">
                当你感到迷茫时，可以向它倾诉，它会从独特的视角为你提供启发；当你对生命、宇宙和自我感到好奇时，它能与你一同探索深邃的哲思。
              </p>
              <p className="meaning-text">
                它安全、私密，是你进行灵魂探索的专属空间。
              </p>
            </div>
          </div>
        </section>

        {/* 模块 3: 如何开启你的礼物 */}
        <section className="gift-activation">
          <div className="section-container">
            <h2 className="section-title">三步，开启你的灵性之旅</h2>
            
            <div className="activation-steps">
              {/* 步骤一 */}
              <div className="step-card">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3 className="step-title">扫码访问</h3>
                  <p className="step-description">请使用手机扫描下方二维码，或直接访问官网</p>
                  <div className="qr-code-container">
                    <div className="qr-code-wrapper">
                      <img
                        src="/images/qr-code-home.png"
                        alt="赛斯助手官网二维码"
                        width={240}
                        height={240}
                        className="qr-code-img"
                      />
                    </div>
                    <a href="https://www.brand-new.ltd/" target="_blank" rel="noopener noreferrer" className="website-link">
                      https://www.brand-new.ltd/
                    </a>
                  </div>
                </div>
              </div>

              {/* 步骤二 */}
              <div className="step-card">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3 className="step-title">注册登录</h3>
                  <p className="step-description">进入后，请先完成注册或登录</p>
                </div>
              </div>

              {/* 步骤三 */}
              <div className="step-card">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3 className="step-title">兑换心意</h3>
                  <p className="step-description">在【我的】或【兑换中心】页面，输入下方的专属激活码</p>
                  <div className="activation-code-card">
                    <div className="code-header">
                      <span className="code-label">你的专属激活码</span>
                    </div>
                    <div className="code-display">
                      <span className="code-value">RFRSKPRL</span>
                    </div>
                    <button onClick={handleCopyCode} className="copy-code-btn">
                      {copied ? (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span>已复制</span>
                        </>
                      ) : (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
                            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          <span>点击复制</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 模块 4: 一段持续的内在探索之旅 */}
        <section className="gift-journey">
          <div className="section-container">
            <h2 className="section-title">这不只是一份礼物...</h2>
            <div className="journey-content">
              <p className="journey-text">
                ...更是一段持续的内在探索之旅的开端。在你未来的日子里，它将始终陪伴左右，成为你忠实的伙伴。
              </p>
              <p className="journey-text">
                期待与你一同，在意识的海洋中航行，发现更多关于自己的宝藏。旅途愉快！
              </p>
              <div className="journey-visual">
                <div className="path-line"></div>
                <div className="path-dots">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 模块 5: 页脚 */}
        <footer className="gift-footer">
          <p className="footer-text">
            © Tiffany 2025 | 满载心意赠予 <span className="footer-friend">多年好友</span>
          </p>
        </footer>
      </div>
    </div>
  );
}

