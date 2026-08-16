import React, { useState, useMemo } from 'react';
import { DrivePhoto, UploaderFolder } from '../types';
import {
  Users,
  Search,
  ExternalLink,
  Image as ImageIcon,
  FolderOpen,
  Eye,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface PhotoGalleryProps {
  photos: DrivePhoto[];
  uploaders: UploaderFolder[];
  tripTitle: string;
  tripFolderLink?: string;
  onSelectPhoto: (photo: DrivePhoto) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  uploaders,
  tripFolderLink,
  onSelectPhoto,
  isLoading,
}) => {
  const [selectedUploaderFilter, setSelectedUploaderFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Group photos or filter
  const filteredPhotos = useMemo(() => {
    return photos.filter((photo) => {
      const matchUploader =
        selectedUploaderFilter === 'ALL' || photo.uploaderName === selectedUploaderFilter;
      const matchSearch =
        !searchTerm.trim() ||
        photo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        photo.uploaderName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchUploader && matchSearch;
    });
  }, [photos, selectedUploaderFilter, searchTerm]);

  // Color generator for uploader icon boxes
  const getUploaderColorStyles = (index: number) => {
    const palette = [
      { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
      { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
      { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200' },
      { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200' },
      { bg: 'bg-cyan-100', text: 'text-cyan-600', border: 'border-cyan-200' },
      { bg: 'bg-rose-100', text: 'text-rose-600', border: 'border-rose-200' },
    ];
    return palette[index % palette.length];
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Member Folders Section in Geometric Balance Style */}
      {uploaders.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              멤버별 폴더 ({uploaders.length})
            </h3>
            {tripFolderLink && (
              <a
                id="open-trip-folder-drive-btn"
                href={tripFolderLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3.5 py-1.5 rounded-xl border border-blue-100 transition-colors"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Google Drive 폴더 열기</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* All Photos summary card */}
            <div
              onClick={() => setSelectedUploaderFilter('ALL')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                selectedUploaderFilter === 'ALL'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                    selectedUploaderFilter === 'ALL'
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <ImageIcon className="w-5 h-5" />
                </div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded ${
                    selectedUploaderFilter === 'ALL'
                      ? 'bg-blue-500 text-white'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {photos.length}장
                </span>
              </div>
              <h4 className="text-base font-bold">전체 사진 보기</h4>
              <p
                className={`text-xs mt-1 ${
                  selectedUploaderFilter === 'ALL' ? 'text-slate-300' : 'text-slate-400'
                }`}
              >
                모든 참여자의 사진 모음
              </p>
            </div>

            {/* Individual Uploader Cards */}
            {uploaders.map((uploader, index) => {
              const uploaderPhotos = photos.filter((p) => p.uploaderName === uploader.name);
              const color = getUploaderColorStyles(index);
              const isSelected = selectedUploaderFilter === uploader.name;

              return (
                <div
                  key={uploader.id}
                  onClick={() => setSelectedUploaderFilter(uploader.name)}
                  className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                      : 'border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-11 h-11 ${color.bg} rounded-xl flex items-center justify-center ${color.text}`}>
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2.5 py-1 rounded">
                      {uploaderPhotos.length}장
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-800 truncate">{uploader.name}</h4>
                  <p className="text-xs text-slate-400 mt-1 truncate">
                    {uploaderPhotos.length > 0
                      ? `Drive: /${uploader.name}`
                      : '업로드 대기 중'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Photo Gallery & Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {selectedUploaderFilter === 'ALL'
                ? '전체 사진 목록'
                : `${selectedUploaderFilter} 님의 사진`}
            </h3>
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-bold">
              {filteredPhotos.length}장
            </span>
          </div>

          {/* Search bar */}
          <div className="relative min-w-[240px]">
            <input
              id="search-photos-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="파일명 또는 올린 사람 검색..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        {/* 3. Photo Grid or Empty State */}
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-xs">
            <div className="w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">Google Drive에서 사진 목록을 불러오는 중...</p>
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-xs">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-3">
              <ImageIcon className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-slate-800 mb-1">
              {photos.length === 0
                ? '아직 등록된 사진이 없습니다.'
                : '조건에 맞는 사진이 없습니다.'}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {photos.length === 0
                ? '사진 업로드 탭에서 첫 번째 여행 사진을 올려보세요!'
                : '다른 올린 사람 카드를 선택하거나 검색어를 변경해 보세요.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredPhotos.map((photo) => {
              const dateStr = photo.createdTime
                ? new Date(photo.createdTime).toLocaleDateString('ko-KR', {
                    month: 'short',
                    day: 'numeric',
                  })
                : '';

              return (
                <div
                  key={photo.id}
                  onClick={() => onSelectPhoto(photo)}
                  className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:border-blue-400 transition-all duration-200 cursor-pointer flex flex-col"
                >
                  {/* Thumbnail Container */}
                  <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
                    {photo.thumbnailLink ? (
                      <img
                        src={photo.thumbnailLink.replace(/=s\d+/, '=s400')}
                        alt={photo.name}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-2">
                        <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
                        <span className="text-[10px] text-center truncate w-full">{photo.name}</span>
                      </div>
                    )}

                    {/* Gradient Overlay with meta in Geometric Balance Style */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                      <div className="flex justify-end">
                        <span className="p-2 rounded-full bg-white/90 text-slate-900 shadow-sm">
                          <Eye className="w-4 h-4" />
                        </span>
                      </div>
                      <p className="text-[11px] text-white font-medium truncate">
                        {photo.uploaderName} • {photo.name}
                      </p>
                    </div>

                    {/* Uploader Badge on Top Left */}
                    <div className="absolute top-2 left-2 group-hover:opacity-0 transition-opacity">
                      <span className="text-[10px] font-bold bg-white/90 backdrop-blur-xs text-slate-800 px-2 py-0.5 rounded shadow-xs border border-slate-200">
                        {photo.uploaderName}
                      </span>
                    </div>
                  </div>

                  {/* Info below thumbnail */}
                  <div className="p-3 space-y-1 bg-white">
                    <p className="text-xs font-bold text-slate-800 truncate" title={photo.name}>
                      {photo.name}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {dateStr}
                      </span>
                      <span className="text-blue-600 font-bold">Drive 저장됨</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
