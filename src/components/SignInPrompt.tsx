import React from 'react';
import { Camera, FolderHeart, Users, Cloud, ShieldCheck } from 'lucide-react';

interface SignInPromptProps {
  onSignIn: () => void;
  isLoading: boolean;
}

export const SignInPrompt: React.FC<SignInPromptProps> = ({ onSignIn, isLoading }) => {
  return (
    <div className="max-w-xl mx-auto my-12 px-4 animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-10 text-center relative overflow-hidden">
        {/* Subtle accent glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-blue-50 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-slate-100 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto shadow-sm mb-6">
            <Camera className="w-8 h-8 text-blue-400" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
            여행 사진 저장소
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-8 max-w-md mx-auto">
            친구, 가족과 함께 떠난 여행 사진을 내 Google Drive에 
            <strong className="text-slate-900 font-bold"> 여행별 · 올린 사람별</strong>로 자동 분류하여 안전하게 저장하세요.
          </p>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 text-left">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-1.5 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-0.5">
                <FolderHeart className="w-4 h-4" />
              </div>
              <span className="font-bold text-xs text-slate-900">여행별 전용 폴더</span>
              <span className="text-[11px] text-slate-500">여행지별로 깔끔하게 정리</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-1.5 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mb-0.5">
                <Users className="w-4 h-4" />
              </div>
              <span className="font-bold text-xs text-slate-900">사람별 자동 분류</span>
              <span className="text-[11px] text-slate-500">누가 올렸는지 바로 확인</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-1.5 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-0.5">
                <Cloud className="w-4 h-4" />
              </div>
              <span className="font-bold text-xs text-slate-900">내 Google Drive</span>
              <span className="text-[11px] text-slate-500">원본 화질 그대로 보관</span>
            </div>
          </div>

          {/* Official Google Sign In Button */}
          <div className="flex flex-col items-center justify-center gap-3">
            <button
              id="google-signin-btn-main"
              onClick={onSignIn}
              disabled={isLoading}
              className="w-full max-w-sm flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-800 font-bold py-3.5 px-6 rounded-xl border border-slate-300 shadow-xs hover:shadow transition-all duration-200 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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
              <span>Google 계정으로 시작하기</span>
            </button>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>사용자의 승인 하에 전용 앱 폴더에만 사진을 저장합니다</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
