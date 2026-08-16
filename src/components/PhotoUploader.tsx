import React, { useState, useRef, useEffect } from 'react';
import { UploadQueueItem } from '../types';
import {
  UploadCloud,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X,
  User,
  Plus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface PhotoUploaderProps {
  defaultUploaderName: string;
  existingUploaders: string[];
  onUploadFiles: (files: File[], uploaderName: string) => Promise<void>;
  isUploading: boolean;
  uploadQueue: UploadQueueItem[];
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  defaultUploaderName,
  existingUploaders,
  onUploadFiles,
  isUploading,
  uploadQueue,
}) => {
  const [uploaderName, setUploaderName] = useState(defaultUploaderName);
  const [selectedFiles, setSelectedFiles] = useState<{ file: File; previewUrl: string; id: string }[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!uploaderName && defaultUploaderName) {
      setUploaderName(defaultUploaderName);
    }
  }, [defaultUploaderName, uploaderName]);

  const handleFilesAdded = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const newFiles: { file: File; previewUrl: string; id: string }[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        const previewUrl = URL.createObjectURL(file);
        newFiles.push({
          file,
          previewUrl,
          id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        });
      }
    }

    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  const removeSelectedFile = (id: string) => {
    setSelectedFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  const handleStartUpload = async () => {
    const finalUploaderName = uploaderName.trim() || '익명 참여자';
    if (selectedFiles.length === 0) return;

    const filesToUpload = selectedFiles.map((s) => s.file);
    try {
      await onUploadFiles(filesToUpload, finalUploaderName);
      // Clean up object URLs
      selectedFiles.forEach((s) => URL.revokeObjectURL(s.previewUrl));
      setSelectedFiles([]);
    } catch (err) {
      console.error('Upload batch failed:', err);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
      {/* 1. Uploader Identity Section in Geometric Balance Style */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label htmlFor="uploader-name-input" className="text-xs font-bold text-slate-800 flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <User className="w-3.5 h-3.5" />
            </div>
            <span>사진 올리는 사람 이름 (Google Drive 폴더명)</span>
          </label>
          <span className="text-xs text-slate-500 font-medium">
            📁 Drive 하위 폴더: <span className="text-blue-900 font-mono font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{uploaderName.trim() || '익명 참여자'}</span>
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <input
              id="uploader-name-input"
              type="text"
              value={uploaderName}
              onChange={(e) => setUploaderName(e.target.value)}
              placeholder="예: 김민수, 이영희, 박지원 등"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors font-medium"
              disabled={isUploading}
              maxLength={30}
            />
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>

          {/* Quick suggestions from existing uploaders */}
          {existingUploaders.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider shrink-0">기존 참여자:</span>
              {existingUploaders.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setUploaderName(name)}
                  disabled={isUploading}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors border font-semibold ${
                    uploaderName === name
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. Drag & Drop Upload Zone */}
      <div
        id="dropzone-area"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all cursor-pointer select-none ${
          isDragOver
            ? 'border-blue-500 bg-blue-50/60 scale-[1.005]'
            : 'border-slate-300 hover:border-slate-400 bg-slate-50/40 hover:bg-slate-50/80'
        } ${isUploading ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFilesAdded(e.target.files)}
          disabled={isUploading}
        />

        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto mb-3 shadow-xs">
          <UploadCloud className="w-7 h-7" />
        </div>

        <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-1">
          여기에 사진을 끌어다 놓거나 클릭하여 선택하세요
        </h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          여러 장을 한 번에 올릴 수 있습니다. 선택한 사진들은 Google Drive의 <strong className="text-slate-800">[{uploaderName || '올린사람'}]</strong> 폴더에 원본 그대로 안전하게 업로드됩니다.
        </p>

        <button
          type="button"
          disabled={isUploading}
          className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-800 text-xs font-bold rounded-xl border border-slate-300 shadow-xs hover:bg-slate-50 transition-colors"
        >
          <Plus className="w-4 h-4 text-blue-600" />
          <span>컴퓨터 / 스마트폰에서 사진 선택</span>
        </button>
      </div>

      {/* 3. Selected Files Preview Grid before Upload */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-blue-600" />
              <span>업로드 대기 중인 사진 ({selectedFiles.length}장)</span>
            </span>
            <button
              id="clear-all-selected-files-btn"
              type="button"
              onClick={() => {
                selectedFiles.forEach((s) => URL.revokeObjectURL(s.previewUrl));
                setSelectedFiles([]);
              }}
              disabled={isUploading}
              className="text-xs text-slate-500 hover:text-rose-600 transition-colors font-semibold"
            >
              전체 취소
            </button>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-64 overflow-y-auto p-1">
            {selectedFiles.map((item) => (
              <div
                key={item.id}
                className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xs"
              >
                <img
                  src={item.previewUrl}
                  alt={item.file.name}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSelectedFile(item.id);
                  }}
                  disabled={isUploading}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-slate-900/80 hover:bg-rose-600 text-white flex items-center justify-center transition-colors opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <span className="absolute bottom-0 inset-x-0 bg-slate-900/70 backdrop-blur-xs text-[10px] text-white px-1.5 py-0.5 truncate text-center">
                  {item.file.name}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 flex items-center justify-end">
            <button
              id="start-upload-btn"
              type="button"
              onClick={handleStartUpload}
              disabled={isUploading}
              className="w-full sm:w-auto px-7 py-3.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-sm font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Google Drive로 업로드 진행 중...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span>
                    Google Drive에 <span className="underline font-bold">[{uploaderName || '올린사람'}]</span> 폴더로 {selectedFiles.length}장 업로드
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 4. Active Upload Queue & Progress Items */}
      {uploadQueue.length > 0 && (
        <div className="border-t border-slate-200 pt-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">업로드 진행 현황</span>
            <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded">
              {uploadQueue.filter((q) => q.status === 'success').length} / {uploadQueue.length} 완료
            </span>
          </div>

          <div className="space-y-2 max-h-52 overflow-y-auto">
            {uploadQueue.map((item) => (
              <div
                key={item.id}
                className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-slate-200 border border-slate-300">
                  <img src={item.previewUrl} alt={item.file.name} className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-slate-800 truncate">{item.file.name}</p>
                    <span className="text-[11px] font-mono text-slate-500">{item.progress}%</span>
                  </div>

                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        item.status === 'error'
                          ? 'bg-rose-500'
                          : item.status === 'success'
                          ? 'bg-emerald-500'
                          : 'bg-blue-600'
                      }`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>

                <div className="shrink-0">
                  {item.status === 'success' && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  )}
                  {item.status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-rose-500" title={item.errorMessage || '오류 발생'} />
                  )}
                  {item.status === 'uploading' && (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
