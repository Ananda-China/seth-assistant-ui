"use client";

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

interface InviteSectionProps {
  phone: string;
}

export default function InviteSection({ phone }: InviteSectionProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [inviteLink, setInviteLink] = useState<string>('');

  // 生成邀请链接
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setInviteLink(`${window.location.origin}/login?invite=${encodeURIComponent(phone)}`);
    }
  }, [phone]);

  // 生成二维码
  useEffect(() => {
    if (phone && inviteLink) {
      QRCode.toDataURL(inviteLink, {
        width: 200,
        margin: 2,
        color: {
          dark: '#4C5D8B',
          light: '#FFFFFF'
        }
      }).then(url => {
        setQrCodeUrl(url);
      }).catch(err => {
        console.error('生成二维码失败:', err);
      });
    }
  }, [phone, inviteLink]);

  // 复制邀请链接
  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
      // 降级方案：选择文本
      const textArea = document.createElement('textarea');
      textArea.value = inviteLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 复制邀请码
  const copyInviteCode = async () => {
    try {
      await navigator.clipboard.writeText(phone);
      alert('邀请码已复制');
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  return (
    <div className="invite-section">
      {/* 邀请码显示 */}
      <div className="invite-code">
        <span className="invite-label">我的邀请码：</span>
        <span className="invite-badge">{phone}</span>
        <button
          type="button"
          className="btn-copy"
          onClick={copyInviteCode}
        >
          复制
        </button>
      </div>

      {/* 邀请链接 */}
      <div className="invite-link-section">
        <div className="invite-link-header">
          <h3 className="invite-link-title">邀请链接</h3>
          <p className="invite-link-desc">分享此链接，好友点击即可自动填入您的邀请码</p>
        </div>
        
        <div className="invite-link-container">
          <div className="invite-link-input">
            <input
              type="text"
              value={inviteLink}
              readOnly
              className="form-input invite-link-text"
            />
            <button
              onClick={copyInviteLink}
              className={`btn-copy ${copied ? 'copied' : ''}`}
            >
              {copied ? '已复制' : '复制链接'}
            </button>
          </div>
        </div>
      </div>

      {/* 邀请二维码 */}
      <div className="invite-qr-section">
        <div className="invite-qr-header">
          <h3 className="invite-qr-title">邀请二维码</h3>
          <p className="invite-qr-desc">扫描二维码，快速注册并自动填入邀请码</p>
        </div>
        
        <div className="invite-qr-container">
          {qrCodeUrl ? (
            <div className="invite-qr-code">
              <img src={qrCodeUrl} alt="邀请二维码" className="qr-image" />
              <p className="qr-hint">扫描二维码邀请好友</p>
            </div>
          ) : (
            <div className="invite-qr-loading">
              <div className="loading-spinner"></div>
              <p>生成二维码中...</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .invite-section {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .invite-code {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: rgba(76, 85, 138, 0.1);
          border-radius: 12px;
          border: 1px solid rgba(200, 182, 226, 0.2);
        }

        .invite-label {
          color: #8A94B3;
          font-size: 14px;
        }

        .invite-badge {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 6px 12px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
        }

        .btn-copy {
          background: rgba(200, 182, 226, 0.1);
          border: 1px solid rgba(200, 182, 226, 0.3);
          color: #C8B6E2;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-copy:hover {
          background: rgba(200, 182, 226, 0.2);
          border-color: rgba(200, 182, 226, 0.5);
        }

        .btn-copy.copied {
          background: rgba(16, 185, 129, 0.2);
          border-color: rgba(16, 185, 129, 0.5);
          color: #10B981;
        }

        .invite-link-section,
        .invite-qr-section {
          background: rgba(76, 85, 138, 0.1);
          border-radius: 16px;
          padding: 20px;
          border: 1px solid rgba(200, 182, 226, 0.2);
        }

        .invite-link-header,
        .invite-qr-header {
          margin-bottom: 16px;
        }

        .invite-link-title,
        .invite-qr-title {
          color: #EAEBF0;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 4px 0;
        }

        .invite-link-desc,
        .invite-qr-desc {
          color: #8A94B3;
          font-size: 12px;
          margin: 0;
        }

        .invite-link-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .invite-link-input {
          display: flex;
          gap: 8px;
        }

        .invite-link-text {
          flex: 1;
          font-size: 12px;
          font-family: monospace;
        }

        .form-input {
          background: rgba(76, 85, 138, 0.2);
          border: 1px solid rgba(200, 182, 226, 0.3);
          border-radius: 8px;
          padding: 8px 12px;
          color: #EAEBF0;
          font-size: 14px;
        }

        .form-input:focus {
          outline: none;
          border-color: rgba(200, 182, 226, 0.6);
        }

        .invite-qr-container {
          display: flex;
          justify-content: center;
        }

        .invite-qr-code {
          text-align: center;
        }

        .qr-image {
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .qr-hint {
          color: #8A94B3;
          font-size: 12px;
          margin: 12px 0 0 0;
        }

        .invite-qr-loading {
          text-align: center;
          color: #8A94B3;
          padding: 40px 20px;
        }

        .loading-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid rgba(200, 182, 226, 0.3);
          border-top: 2px solid #C8B6E2;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 12px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
