import React, { useState, useMemo } from 'react';
import { TripFolder } from '../types';
import {
  FolderPlus,
  Search,
  MapPin,
  Calendar,
  ExternalLink,
  Users,
  Image as ImageIcon,
  ArrowRight,
  RefreshCw,
  Trash2,
  FolderOpen,
  Sparkles,
  Plane,
} from 'lucide-react';
import { APP_ROOT_FOLDER_NAME } from '../lib/driveApi';
import { ConfirmModal } from './ConfirmModal';

interface TripListProps {
  trips: TripFolder[];
  onSelectTrip: (trip: TripFolder) => void;
  onOpenCreateModal: () => void;
  onRefreshTrips: () => void;
  onDeleteTrip: (tripId: string) => Promise<void>;
  isLoading: boolean;
}

export const TripList: React.FC<TripListProps> = ({
  trips,
  onSelectTrip,
  onOpenCreateModal,
  onRefreshTrips,
  onDeleteTrip,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tripToDelete, setTripToDelete] = useState<TripFolder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        trip.name.toLowerCase().includes(term) ||
        (trip.description && trip.description.toLowerCase().includes(term))
      );
    });
  }, [trips, searchTerm]);

  const confirmDelete = async () => {
    if (!tripToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteTrip(tripToDelete.id);
      setTripToDelete(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Hero in Geometric Balance Style */}
      <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-md">
        {/* Subtle geometric background accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-blue-300 border border-white/10 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Google Drive 클라우드 연동</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              나의 여행 사진 저장소
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              새 여행을 생성하거나 기존 앨범을 선택하세요. 여러 참여자가 사진을 올리면 
              Google Drive 여행 폴더 안에 <strong className="text-white">올린 사람별 폴더</strong>로 자동 저장됩니다.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              id="refresh-trips-btn"
              onClick={onRefreshTrips}
              disabled={isLoading}
              className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all border border-slate-700 text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              title="Google Drive 동기화"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="sm:hidden">새로고침</span>
            </button>

            <button
              id="open-create-trip-modal-btn"
              onClick={onOpenCreateModal}
              className="px-6 py-3.5 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-900 font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
            >
              <FolderPlus className="w-5 h-5 text-slate-900" />
              <span>+ 새 여행 시작하기</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Search & Overview Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <input
            id="search-trips-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="여행 제목 또는 일정 메모 검색..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 px-1">
          <span>등록된 여행 <strong className="text-slate-900 font-bold">{trips.length}</strong>개</span>
          <span>•</span>
          <span className="text-slate-400 font-mono text-[11px]">Drive: {APP_ROOT_FOLDER_NAME}</span>
        </div>
      </div>

      {/* Section Header */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
          여행 앨범 목록 ({filteredTrips.length})
        </h3>
      </div>

      {/* 3. Trips Grid in Geometric Balance Style */}
      {isLoading && trips.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-xs">
          <div className="w-10 h-10 border-3 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-800">Google Drive에서 여행 폴더를 불러오는 중...</p>
          <p className="text-xs text-slate-500 mt-1">잠시만 기다려 주세요.</p>
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 sm:p-16 text-center shadow-xs">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 border border-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xs">
            <Plane className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            {trips.length === 0 ? '등록된 여행이 없습니다' : '검색 결과가 없습니다'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6">
            {trips.length === 0
              ? '새 여행을 등록하면 Google Drive에 전용 폴더가 생성되고, 사람별 사진을 올릴 수 있습니다.'
              : '다른 검색어를 입력해 보세요.'}
          </p>
          {trips.length === 0 && (
            <button
              onClick={onOpenCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-xs"
            >
              <FolderPlus className="w-4 h-4" />
              <span>첫 번째 여행 만들기</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTrips.map((trip) => {
            const formattedDate = trip.createdTime
              ? new Date(trip.createdTime).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : '';

            return (
              <div
                key={trip.id}
                id={`trip-card-${trip.id}`}
                className="group bg-white rounded-2xl border border-slate-200 hover:border-slate-400 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden"
              >
                <div className="p-6 space-y-4">
                  {/* Top Bar with drive link and delete */}
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <MapPin className="w-6 h-6" />
                    </div>

                    <div className="flex items-center gap-1">
                      {trip.webViewLink && (
                        <a
                          href={trip.webViewLink}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Google Drive에서 보기"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FolderOpen className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setTripToDelete(trip);
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="여행 폴더 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-slate-900 text-lg group-hover:text-blue-900 transition-colors line-clamp-1">
                      {trip.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px]">
                      {trip.description || '소중한 여행 사진을 모아둔 앨범입니다.'}
                    </p>
                  </div>

                  {/* Stats badge */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded">
                        멤버 {trip.uploaderCount ?? 0}명
                      </span>
                    </div>

                    {formattedDate && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formattedDate}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Button */}
                <button
                  id={`enter-trip-btn-${trip.id}`}
                  onClick={() => onSelectTrip(trip)}
                  className="w-full py-3.5 px-5 bg-slate-50 group-hover:bg-slate-900 text-slate-700 group-hover:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border-t border-slate-100 transition-colors"
                >
                  <span>사진 올리기 / 앨범 보기</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Trip Confirmation Modal */}
      <ConfirmModal
        isOpen={!!tripToDelete}
        title="여행 폴더 삭제"
        message={`'${tripToDelete?.name}' 여행 폴더와 내부의 모든 사진을 Google Drive에서 완전히 삭제하시겠습니까?`}
        confirmLabel="폴더 삭제"
        cancelLabel="취소"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setTripToDelete(null)}
      />
    </div>
  );
};
