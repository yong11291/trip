/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, TripFolder } from './types';
import { initAuth, googleSignIn, logout, getAccessToken, setCachedAccessToken } from './lib/auth';
import { getTripFolders, createTripFolder, deleteTripFolder } from './lib/driveApi';
import { Navbar } from './components/Navbar';
import { SignInPrompt } from './components/SignInPrompt';
import { TripList } from './components/TripList';
import { TripDetail } from './components/TripDetail';
import { CreateTripModal } from './components/CreateTripModal';
import { AlertCircle, ShieldAlert } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // App Navigation & Trip Data
  const [currentTrip, setCurrentTrip] = useState<TripFolder | null>(null);
  const [trips, setTrips] = useState<TripFolder[]>([]);
  const [isLoadingTrips, setIsLoadingTrips] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create Trip Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);

  // Initialize Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (authUser: UserProfile, accessToken: string) => {
        setUser(authUser);
        setToken(accessToken);
        setIsAuthLoading(false);
      },
      () => {
        setUser(null);
        setToken(null);
        setIsAuthLoading(false);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Fetch trips from Google Drive
  const fetchTrips = useCallback(async () => {
    if (!token) return;
    setIsLoadingTrips(true);
    setError(null);
    try {
      const data = await getTripFolders(token);
      setTrips(data);
      // If currently inside a trip, update its reference
      if (currentTrip) {
        const updated = data.find((t) => t.id === currentTrip.id);
        if (updated) {
          setCurrentTrip(updated);
        }
      }
    } catch (err: unknown) {
      console.error('Fetch trips error:', err);
      if (err instanceof Error) {
        // If auth expired or invalid token
        if (err.message.includes('401') || err.message.includes('403')) {
          setError('Google Drive 권한이 만료되었습니다. 다시 로그인해 주세요.');
          setToken(null);
        } else {
          setError(err.message);
        }
      } else {
        setError('여행 목록을 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoadingTrips(false);
    }
  }, [token, currentTrip]);

  useEffect(() => {
    if (token) {
      fetchTrips();
    }
  }, [token]);

  // Sign In Handler
  const handleSignIn = async () => {
    setIsSigningIn(true);
    setError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser({
          uid: result.user.uid,
          displayName: result.user.displayName,
          email: result.user.email,
          photoURL: result.user.photoURL,
        });
        setToken(result.accessToken);
        setCachedAccessToken(result.accessToken);
      }
    } catch (err: unknown) {
      console.error('Sign in failed:', err);
      if (err instanceof Error) {
        const msg = err.message || '';
        if (msg.includes('Popup window closed') || msg.includes('popup_closed_by_user')) {
          setError('Google 로그인 창이 닫혔습니다. 로그인 버튼을 누른 후 표시되는 팝업 창에서 계정을 선택하고 권한을 승인해 주세요.');
        } else if (msg.includes('popup_blocked') || msg.includes('Popup blocked')) {
          setError('브라우저에서 팝업이 차단되었습니다. 주소창 우측에서 팝업 허용 후 다시 시도해 주세요.');
        } else {
          setError(`로그인 안내: ${err.message}`);
        }
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  // Sign Out Handler
  const handleSignOut = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      setCurrentTrip(null);
      setTrips([]);
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  // Create Trip Handler
  const handleCreateTrip = async (title: string, description: string) => {
    if (!token) throw new Error('로그인이 필요합니다.');
    setIsCreatingTrip(true);
    try {
      const newTrip = await createTripFolder(token, title, description);
      setTrips((prev) => [newTrip, ...prev]);
      setCurrentTrip(newTrip); // Automatically navigate to the newly created trip's screen
    } finally {
      setIsCreatingTrip(false);
    }
  };

  // Delete Trip Handler
  const handleDeleteTrip = async (tripId: string) => {
    if (!token) return;
    await deleteTripFolder(token, tripId);
    setTrips((prev) => prev.filter((t) => t.id !== tripId));
    if (currentTrip?.id === tripId) {
      setCurrentTrip(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Top Navigation */}
      <Navbar
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onGoHome={() => setCurrentTrip(null)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start justify-between gap-3 text-rose-800 text-xs sm:text-sm shadow-xs animate-fade-in">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">안내</p>
                <p className="text-rose-700">{error}</p>
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs text-rose-500 hover:text-rose-800 font-semibold px-2 py-1"
            >
              닫기
            </button>
          </div>
        )}

        {/* Loading Spinner for Auth initial state */}
        {isAuthLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <div className="w-10 h-10 border-3 border-slate-900 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-semibold text-slate-500">Google 연결 상태 확인 중...</p>
          </div>
        ) : !token ? (
          /* Sign In Screen */
          <SignInPrompt onSignIn={handleSignIn} isLoading={isSigningIn} />
        ) : currentTrip ? (
          /* Screen 2: Trip Detail & Multi-person Photo Uploader / Gallery */
          <TripDetail
            trip={currentTrip}
            user={user}
            accessToken={token}
            onBack={() => {
              setCurrentTrip(null);
              fetchTrips();
            }}
            onRefreshTrips={fetchTrips}
          />
        ) : (
          /* Screen 1: Trip List & Selection / Creation */
          <TripList
            trips={trips}
            onSelectTrip={(trip) => setCurrentTrip(trip)}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onRefreshTrips={fetchTrips}
            onDeleteTrip={handleDeleteTrip}
            isLoading={isLoadingTrips}
          />
        )}
      </main>

      {/* Footer in Geometric Balance Style */}
      <footer className="h-14 px-6 sm:px-8 bg-white border-t border-slate-200 flex items-center justify-between mt-auto">
        <div className="text-[11px] text-slate-400">
          © 2025 여행 사진 저장소. 모든 사진은 Google Drive™ 에 안전하게 보관됩니다.
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-[11px] font-bold text-slate-500">Google Drive 동기화 활성</span>
        </div>
      </footer>

      {/* Create Trip Modal */}
      <CreateTripModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateTrip={handleCreateTrip}
        isLoading={isCreatingTrip}
      />
    </div>
  );
}
