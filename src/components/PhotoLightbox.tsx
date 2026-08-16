import React, { useState } from 'react';
import { DrivePhoto } from '../types';
import {
  X,
  ExternalLink,
  Download,
  Trash2,
  Calendar,
  User,
  FolderTree,
  HardDrive,
  Info,
} from 'lucide-react';
import { APP_ROOT_FOLDER_NAME } from '../lib/driveApi';

interface PhotoLightboxProps {
  photo: DrivePhoto | null;
  tripTitle: string;
  onClose: () => void;
  onDelete: (photo: DrivePhoto) => void;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  photo,
  tripTitle,
  onClose,
  onDelete,
}) => {
  const [imgError, setImgError] = useState(false);

  if (!photo) return null;

  const formattedDate = photo.createdTime
    ? new Date(photo.createdTime).toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '날짜 정보 없음';

  const formatFileSize = (bytes?: string) => {
    if (!bytes) return '크기 미확인';
    const num = parseInt(bytes, 10);
    if (isNaN(num)) return '크기 미확인';
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Construct high-res image URL using Google Drive thumbnail or webContentLink
  const highResUrl = photo.thumbnailLink
    ? photo.thumbnailLink.replace(/=s\d+/, '=s1600')
    : photo.webContentLink || photo.webViewLink;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-6 animate-fade-in">
      {/* Close button */}
      <button
        id="lightbox-close-btn"
        onClick={onClose}
        className="absolute top-4 right-4 z-20 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors focus:outline-none"
        aria-label="닫기"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="flex flex-col lg:flex-row w-full max-w-6xl h-full max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
        {/* Main Photo View */}
        <div className="flex-1 flex items-center justify-center p-4 bg-black/40 relative overflow-hidden">
          {!imgError && highResUrl ? (
            <img
              src={highResUrl}
              alt={photo.name}
              className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl shadow-lg select-none"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="text-center p-8 text-slate-400">
              <HardDrive className="w-16 h-16 mx-auto mb-3 text-slate-600" />
              <p className="text-sm font-semibold">사진 미리보기를 불러올 수 없습니다.</p>
              <p className="text-xs text-slate-500 mt-1">Google Drive 링크를 통해 원본을 확인하세요.</p>
              <a
                href={photo.webViewLink}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Google Drive에서 열기
              </a>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="w-full lg:w-80 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 p-6 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-5">
            <div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-950/80 text-blue-300 border border-blue-800/60 mb-2">
                <User className="w-3 h-3" /> {photo.uploaderName} 님의 사진
              </span>
              <h3 className="text-base font-bold text-white break-words line-clamp-2" title={photo.name}>
                {photo.name}
              </h3>
            </div>

            {/* Path metadata */}
            <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/60 text-xs space-y-3 text-slate-300">
              <div className="flex items-start gap-2 text-slate-400">
                <FolderTree className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Google Drive 저장 경로</span>
                  <span className="text-slate-200 break-all font-mono text-[11px]">
                    {APP_ROOT_FOLDER_NAME} &gt; {tripTitle} &gt; {photo.uploaderName}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-400 pt-2 border-t border-slate-700/50">
                <Calendar className="w-4 h-4 shrink-0 text-purple-400" />
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">업로드 일시</span>
                  <span className="text-slate-200">{formattedDate}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-400">
                <Info className="w-4 h-4 shrink-0 text-cyan-400" />
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">파일 크기</span>
                  <span className="text-slate-200">{formatFileSize(photo.size)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-5 border-t border-slate-800 space-y-2.5">
            <a
              id="lightbox-view-drive-btn"
              href={photo.webViewLink}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-colors shadow-xs"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Google Drive에서 보기</span>
            </a>

            {photo.webContentLink && (
              <a
                id="lightbox-download-btn"
                href={photo.webContentLink}
                target="_blank"
                rel="noreferrer"
                download
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2.5 px-4 rounded-xl transition-colors border border-slate-700"
              >
                <Download className="w-4 h-4" />
                <span>원본 다운로드</span>
              </a>
            )}

            <button
              id="lightbox-delete-btn"
              onClick={() => onDelete(photo)}
              className="w-full flex items-center justify-center gap-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-bold py-2.5 px-4 rounded-xl transition-colors border border-rose-800/40"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>사진 삭제하기</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
