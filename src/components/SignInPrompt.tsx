import React, { useState } from 'react';
import { Camera, FolderHeart, Users, Cloud, ShieldCheck, Key, HelpCircle, Copy, Check, Play, AlertCircle } from 'lucide-react';
import { getEffectiveClientId, getCustomClientId } from '../lib/auth';
import { CustomClientIdModal } from './CustomClientIdModal';

interface SignInPromptProps {
  onSignIn: () => void;
  onStartDemoMode?: () => void;
  isLoading: boolean;
  error?: string | null;
}

export const SignInPrompt: React.FC<SignInPromptProps> = ({
  onSignIn,
  onStartDemoMode,
  isLoading,
  error,
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [, setRefreshState] = useState(0);
  const currentOrigin = window.location.origin;

  const handleCopyOrigin = () => {
    navigator.clipboard.writeText(currentOrigin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasCustomKey = !!getCustomClientId();

  return (
    <div className="max-w-2xl mx-auto my-10 px-4 animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-10 text-center relative overflow-hidden">
        {/* Subtle accent glow */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-blue-100 rounded-full blur-3xl pointer-events-none opacity-60" />
        <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-amber-100 rounded-full blur-3xl pointer-events-none opacity-60" />

        <div className="relative z-10">
          <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md mb-5">
            <Camera className="w-8 h-8 text-amber-400" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            여행 사진 저장소
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6 max-w-md mx-auto">
            친구, 가족과 함께 떠난 여행 사진을 <strong className="text-slate-900 font-bold">여행별 · 올린 사람별</strong>로 자동 분류하여 Google Drive 및 브라우저에 안전하게 보관하세요.
          </p>

          {error && (
            <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-2xl text-left text-xs sm:text-sm text-red-700 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
              <div className="space-y-1">
                <span className="font-bold block">로그인 오류 안내</span>
                <p className="leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {/* Feature highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 text-left">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col gap-1.5 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-0.5">
                <FolderHeart className="w-4 h-4" />
              </div>
              <span className="font-bold text-xs text-slate-900">여행별 전용 앨범</span>
              <span className="text-[11px] text-slate-500">여행지별로 깔끔하게 정리</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col gap-1.5 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-0.5">
                <Users className="w-4 h-4" />
              </div>
              <span className="font-bold text-xs text-slate-900">사람별 자동 분류</span>
              <span className="text-[11px] text-slate-500">누가 올렸는지 바로 확인</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col gap-1.5 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-0.5">
                <Cloud className="w-4 h-4" />
              </div>
              <span className="font-bold text-xs text-slate-900">Google Drive 동기화</span>
              <span className="text-[11px] text-slate-500">원본 화질 그대로 소유</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col items-center justify-center gap-3">
            <button
              id="google-signin-btn-main"
              onClick={onSignIn}
              disabled={isLoading}
              className="w-full max-w-sm flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-800 font-bold py-3.5 px-6 rounded-2xl border border-slate-300 shadow-sm hover:shadow transition-all duration-200 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
              )}
              <span>Google 계정으로 로그인</span>
            </button>

            {onStartDemoMode && (
              <button
                type="button"
                id="demo-mode-btn"
                onClick={onStartDemoMode}
                className="w-full max-w-sm flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-2xl shadow-md hover:shadow-lg transition-all text-xs sm:text-sm"
              >
                <Play className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>로그인 없이 바로 앱 체험하기 (로컬 저장소 모드)</span>
              </button>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowKeyModal(true)}
                className="text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 font-semibold transition-colors"
              >
                <Key className="w-3.5 h-3.5 text-amber-600" />
                <span>{hasCustomKey ? '내 OAuth Client ID 등록됨 (수정)' : 'OAuth Client ID 직접 입력하기'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowHelp(!showHelp)}
                className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 underline underline-offset-2"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Netlify에서 400 origin_mismatch 발생 시 해결법</span>
              </button>
            </div>

            {showHelp && (
              <div className="mt-4 p-5 bg-slate-50 rounded-2xl text-left text-xs text-slate-700 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <span>📌 400 origin_mismatch 오류 원인 및 해결 방법</span>
                </div>
                <p className="leading-relaxed text-slate-600">
                  Google OAuth 보안 정책상, <strong>Google Cloud Console에 등록된 도메인</strong>에서만 로그인이 허용됩니다. Netlify 주소는 Google에 아직 등록되지 않은 외부 주소이기 때문에 Google이 차단하는 정상적인 보안 절차입니다.
                </p>

                <div className="bg-white p-3 rounded-xl border border-slate-300 flex items-center justify-between">
                  <span className="font-mono text-slate-800 select-all font-semibold">{currentOrigin}</span>
                  <button
                    onClick={handleCopyOrigin}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-slate-700 flex items-center gap-1 font-sans text-xs"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? '복사됨' : '복사'}</span>
                  </button>
                </div>

                <ol className="list-decimal list-inside space-y-1.5 text-slate-600 leading-relaxed pt-1">
                  <li><strong>새 Google Cloud 프로젝트 생성:</strong> [Google Cloud Console] 상단에서 <strong>[새 프로젝트]</strong>를 만들어 소유자 권한을 획득합니다.</li>
                  <li><strong>Drive API 활성화:</strong> [API 및 서비스] ➔ [라이브러리] ➔ `Google Drive API` 사용 클릭</li>
                  <li><strong>OAuth 동의 화면:</strong> [OAuth 동의 화면] ➔ [외부] 선택 후 앱 이름 및 이메일 입력</li>
                  <li><strong>OAuth 클라이언트 ID 만들기:</strong> [사용자 인증 정보] ➔ [OAuth 클라이언트 ID] ➔ 웹 애플리케이션 선택 ➔ <strong>승인된 자바스크립트 원본</strong>에 위 복사한 주소 등록</li>
                  <li>발급된 Client ID를 위 <strong>[OAuth Client ID 직접 입력하기]</strong> 버튼을 눌러 입력하시면 즉시 로그인됩니다!</li>
                </ol>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-3">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>개인 Google Drive 전용 앱 폴더에만 사진을 안전하게 저장합니다</span>
            </div>
          </div>
        </div>
      </div>

      <CustomClientIdModal
        isOpen={showKeyModal}
        onClose={() => setShowKeyModal(false)}
        onSaved={() => setRefreshState((prev) => prev + 1)}
      />
    </div>
  );
};
