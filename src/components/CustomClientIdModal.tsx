import React, { useState, useEffect } from 'react';
import { Key, X, Check, ExternalLink, AlertTriangle } from 'lucide-react';
import { getCustomClientId, setCustomClientId } from '../lib/auth';

interface CustomClientIdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const CustomClientIdModal: React.FC<CustomClientIdModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [clientId, setClientId] = useState('');
  const [currentOrigin, setCurrentOrigin] = useState('');

  useEffect(() => {
    if (isOpen) {
      setClientId(getCustomClientId() || '');
      setCurrentOrigin(window.location.origin);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomClientId(clientId.trim());
    onSaved();
    onClose();
  };

  const handleReset = () => {
    setCustomClientId('');
    setClientId('');
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg p-6 bg-white rounded-3xl shadow-2xl border border-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-amber-100 text-amber-600 rounded-2xl">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Google OAuth 클라이언트 ID 직접 설정
            </h3>
            <p className="text-xs text-slate-500">
              Netlify 등 외부 배포 도메인용 클라이언트 ID를 연결합니다.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              내 Google OAuth Client ID (.apps.googleusercontent.com)
            </label>
            <input
              type="text"
              required
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="예: 1234567890-abcdef.apps.googleusercontent.com"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
            />
          </div>

          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-2 text-amber-900">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Google Cloud Console에 등록해야 하는 주소</span>
            </div>
            <div className="p-2 bg-white rounded-lg border border-amber-300 font-mono select-all text-slate-800 break-all font-semibold">
              {currentOrigin}
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800">
              Google Cloud Console의 [사용자 인증 정보] ➔ [OAuth 클라이언트] ➔ <strong>[승인된 자바스크립트 원본]</strong>에 위 주소를 추가하셔야 400 origin_mismatch 오류가 발생하지 않습니다.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-500 hover:text-rose-600 underline"
            >
              기본값으로 초기화
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>저장 및 적용</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
