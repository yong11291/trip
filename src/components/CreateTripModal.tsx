import React, { useState } from 'react';
import { FolderPlus, MapPin, X, Sparkles, Plane, Compass } from 'lucide-react';

interface CreateTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTrip: (title: string, description: string) => Promise<void>;
  isLoading: boolean;
}

const PRESET_IDEAS = [
  '2025 제주도 우정 여행 🍊',
  '부산 해운대 & 광안리 🏖️',
  '도쿄 미식 탐방 🍣',
  '유럽 배낭여행 ✈️',
  '강원도 글램핑 & 바베큐 🏕️',
  '가족과 함께한 오키나와 🌴',
];

export const CreateTripModal: React.FC<CreateTripModalProps> = ({
  isOpen,
  onClose,
  onCreateTrip,
  isLoading,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('여행 제목을 입력해 주세요.');
      return;
    }
    setError(null);
    try {
      await onCreateTrip(title.trim(), description.trim());
      setTitle('');
      setDescription('');
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('여행 폴더를 생성하는 중 오류가 발생했습니다.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        id="create-trip-modal"
        role="dialog"
        aria-modal="true"
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-7 relative overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">새로운 여행 등록</h3>
              <p className="text-xs text-slate-500">Google Drive에 새 여행 앨범 폴더가 생성됩니다</p>
            </div>
          </div>
          <button
            id="close-create-trip-modal-btn"
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="trip-title-input" className="block text-xs font-bold text-slate-800 mb-1.5">
              여행 제목 <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="trip-title-input"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="예: 2025 제주도 봄 여행, 다낭 가족여행 등"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all font-medium"
                disabled={isLoading}
                autoFocus
                maxLength={60}
              />
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* Quick preset suggestions */}
          <div>
            <span className="block text-[11px] font-bold text-slate-500 mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> 추천 제목 예시 (클릭하여 선택):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_IDEAS.map((idea, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTitle(idea)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-800 text-slate-700 border border-slate-200 transition-colors font-medium"
                >
                  {idea}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="trip-desc-input" className="block text-xs font-bold text-slate-800 mb-1.5">
              여행 설명 / 일정 메모 (선택)
            </label>
            <textarea
              id="trip-desc-input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="예: 2025.04.10 ~ 04.14 / 친구들과 함께한 3박 4일 추억"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all resize-none font-medium"
              disabled={isLoading}
              maxLength={150}
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              id="cancel-create-trip-btn"
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              취소
            </button>
            <button
              id="submit-create-trip-btn"
              type="submit"
              disabled={isLoading || !title.trim()}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Google Drive에 생성 중...</span>
                </>
              ) : (
                <>
                  <Compass className="w-4 h-4 text-blue-400" />
                  <span>여행 앨범 만들기</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
