import React from 'react';
import { UserProfile } from '../types';
import { Camera, ExternalLink, HardDrive, LogOut, Sparkles } from 'lucide-react';
import { APP_ROOT_FOLDER_NAME } from '../lib/driveApi';

interface NavbarProps {
  user: UserProfile | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onGoHome: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onSignIn,
  onSignOut,
  onGoHome,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand in Geometric Balance Style */}
        <button
          id="brand-home-button"
          onClick={onGoHome}
          className="flex items-center gap-3 group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded-xl p-1"
        >
          <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform duration-200">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-lg tracking-tight">여행 사진 저장소</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-100">
                <Sparkles className="w-3 h-3 text-blue-600" /> Drive 동기화
              </span>
            </div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold hidden sm:block">
              Travel Photo Hub • Shared Storage
            </p>
          </div>
        </button>

        {/* User Account Controls */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2 sm:gap-4">
              <a
                id="open-drive-root-link"
                href="https://drive.google.com"
                target="_blank"
                rel="noreferrer"
                className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3.5 py-2 rounded-full transition-colors"
                title={`Google Drive '${APP_ROOT_FOLDER_NAME}' 폴더`}
              >
                <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                <span>내 Google Drive</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>

              <div className="flex items-center gap-2.5 pl-2 sm:border-l sm:border-slate-200">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || '사용자'}
                    className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                    {user.displayName || 'Google 사용자'}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate max-w-[120px] font-mono">{user.email}</p>
                </div>
              </div>

              <button
                id="signout-button"
                onClick={onSignOut}
                className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="로그아웃"
                aria-label="로그아웃"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              id="signin-header-button"
              onClick={onSignIn}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold px-5 py-2 rounded-full transition-colors shadow-xs"
            >
              <span>Google 로그인</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
