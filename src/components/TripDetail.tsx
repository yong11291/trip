import React, { useState, useEffect, useCallback } from 'react';
import { TripFolder, DrivePhoto, UploaderFolder, UploadQueueItem, UserProfile } from '../types';
import {
  ArrowLeft,
  RefreshCw,
  FolderOpen,
  Upload,
  Image as ImageIcon,
  HardDrive,
  Users,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import {
  getTripPhotos,
  getOrCreateUploaderFolder,
  uploadPhotoFile,
  deleteDrivePhoto,
  APP_ROOT_FOLDER_NAME,
} from '../lib/driveApi';
import { PhotoUploader } from './PhotoUploader';
import { PhotoGallery } from './PhotoGallery';
import { PhotoLightbox } from './PhotoLightbox';
import { ConfirmModal } from './ConfirmModal';

interface TripDetailProps {
  trip: TripFolder;
  user: UserProfile | null;
  accessToken: string;
  onBack: () => void;
  onRefreshTrips: () => void;
}

export const TripDetail: React.FC<TripDetailProps> = ({
  trip,
  user,
  accessToken,
  onBack,
  onRefreshTrips,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'gallery'>('upload');
  const [photos, setPhotos] = useState<DrivePhoto[]>([]);
  const [uploaders, setUploaders] = useState<UploaderFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);

  // Lightbox & Delete modal state
  const [selectedPhoto, setSelectedPhoto] = useState<DrivePhoto | null>(null);
  const [photoToDelete, setPhotoToDelete] = useState<DrivePhoto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch photos for this trip
  const loadTripData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getTripPhotos(accessToken, trip.id);
      setPhotos(data.photos);
      setUploaders(data.uploaders);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('여행 사진 목록을 불러오지 못했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, trip.id]);

  useEffect(() => {
    loadTripData();
  }, [loadTripData]);

  // Handle uploading photos to the specific person's subfolder
  const handleUploadFiles = async (files: File[], uploaderName: string) => {
    setIsUploading(true);
    setError(null);

    // Build queue
    const newQueueItems: UploadQueueItem[] = files.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      uploaderName,
      progress: 0,
      status: 'pending',
    }));

    setUploadQueue(newQueueItems);

    try {
      // 1. Get or create folder for this uploader in Google Drive
      const uploaderFolder = await getOrCreateUploaderFolder(accessToken, trip.id, uploaderName);

      // 2. Upload each file sequentially to avoid concurrency limits
      for (let i = 0; i < newQueueItems.length; i++) {
        const item = newQueueItems[i];

        // Mark as uploading
        setUploadQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: 'uploading', progress: 10 } : q))
        );

        try {
          const uploadedPhoto = await uploadPhotoFile(
            accessToken,
            uploaderFolder.id,
            item.file,
            uploaderName,
            (percent) => {
              setUploadQueue((prev) =>
                prev.map((q) => (q.id === item.id ? { ...q, progress: percent } : q))
              );
            }
          );

          // Mark item success
          setUploadQueue((prev) =>
            prev.map((q) =>
              q.id === item.id
                ? {
                    ...q,
                    status: 'success',
                    progress: 100,
                    driveFileId: uploadedPhoto.id,
                    driveViewLink: uploadedPhoto.webViewLink,
                  }
                : q
            )
          );
        } catch (itemErr: unknown) {
          const message = itemErr instanceof Error ? itemErr.message : '업로드 오류';
          setUploadQueue((prev) =>
            prev.map((q) =>
              q.id === item.id
                ? { ...q, status: 'error', errorMessage: message }
                : q
            )
          );
        }
      }

      // 3. Reload photos & switch to gallery view
      await loadTripData();
      onRefreshTrips();
      setTimeout(() => {
        setActiveTab('gallery');
      }, 1200);
    } catch (batchErr: unknown) {
      if (batchErr instanceof Error) {
        setError(batchErr.message);
      } else {
        setError('사진 업로드 중 오류가 발생했습니다.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Handle delete photo (with confirmation)
  const confirmDeletePhoto = async () => {
    if (!photoToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDrivePhoto(accessToken, photoToDelete.id);
      setPhotos((prev) => prev.filter((p) => p.id !== photoToDelete.id));
      setPhotoToDelete(null);
      setSelectedPhoto(null);
      await loadTripData();
      onRefreshTrips();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(`사진 삭제 실패: ${err.message}`);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const defaultUploaderName = user?.displayName || user?.email?.split('@')[0] || '내 이름';
  const existingUploaderNames = uploaders.map((u) => u.name);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Top Breadcrumb & Actions Bar in Geometric Balance Style */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <button
              id="back-to-trips-btn"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-1 group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>전체 여행 목록으로 돌아가기</span>
            </button>

            <div className="flex items-center gap-3">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {trip.name}
              </h2>
            </div>

            {trip.description && (
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">{trip.description}</p>
            )}

            <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-semibold text-slate-700">참여자 {uploaders.length}명</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-slate-600" />
                <span className="font-semibold text-slate-700">사진 총 {photos.length}장</span>
              </span>
              <span>•</span>
              <span className="text-slate-400 font-mono text-[11px]">
                {APP_ROOT_FOLDER_NAME} &gt; {trip.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              id="refresh-trip-photos-btn"
              onClick={loadTripData}
              disabled={isLoading}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors text-xs font-bold flex items-center gap-1.5"
              title="새로고침"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">동기화</span>
            </button>

            {trip.webViewLink && (
              <a
                id="open-drive-trip-folder-btn"
                href={trip.webViewLink}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-100 rounded-xl transition-colors text-xs font-bold flex items-center gap-1.5"
              >
                <FolderOpen className="w-4 h-4 text-blue-700" />
                <span>Google Drive 폴더 열기</span>
              </a>
            )}
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-slate-100">
          <button
            id="tab-upload-photos-btn"
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'upload'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>사진 업로드하기</span>
          </button>

          <button
            id="tab-view-gallery-btn"
            type="button"
            onClick={() => setActiveTab('gallery')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'gallery'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>모인 사진 갤러리 ({photos.length})</span>
          </button>
        </div>
      </div>

      {/* Error alert if any */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 text-rose-800 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">오류가 발생했습니다</p>
            <p className="text-rose-700">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-rose-500 hover:text-rose-700 text-xs font-semibold"
          >
            닫기
          </button>
        </div>
      )}

      {/* 2. Main Content based on Tab */}
      {activeTab === 'upload' ? (
        <PhotoUploader
          defaultUploaderName={defaultUploaderName}
          existingUploaders={existingUploaderNames}
          onUploadFiles={handleUploadFiles}
          isUploading={isUploading}
          uploadQueue={uploadQueue}
        />
      ) : (
        <PhotoGallery
          photos={photos}
          uploaders={uploaders}
          tripTitle={trip.name}
          tripFolderLink={trip.webViewLink}
          onSelectPhoto={(p) => setSelectedPhoto(p)}
          onRefresh={loadTripData}
          isLoading={isLoading}
        />
      )}

      {/* 3. Photo Lightbox Modal */}
      {selectedPhoto && (
        <PhotoLightbox
          photo={selectedPhoto}
          tripTitle={trip.name}
          onClose={() => setSelectedPhoto(null)}
          onDelete={(p) => setPhotoToDelete(p)}
        />
      )}

      {/* 4. Delete Confirmation Modal (Compliant with Google Workspace destructive confirmation guidelines) */}
      <ConfirmModal
        isOpen={!!photoToDelete}
        title="Google Drive에서 사진 삭제"
        message={`'${photoToDelete?.name}' 사진을 Google Drive에서 완전히 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmLabel="사진 삭제"
        cancelLabel="취소"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={confirmDeletePhoto}
        onCancel={() => setPhotoToDelete(null)}
      />
    </div>
  );
};
