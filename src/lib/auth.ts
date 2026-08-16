import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User as FirebaseUser,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile } from '../types';

// Types for Google Identity Services (GIS)
declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token?: string;
              error?: string;
              error_description?: string;
            }) => void;
            error_callback?: (error: unknown) => void;
            prompt?: string;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

export const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account',
});

let cachedAccessToken: string | null = null;
let cachedUser: UserProfile | null = null;

// Dynamic loader for Google Identity Services if needed
function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      return resolve();
    }
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Google Identity Services 로드 실패')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google Identity Services 로드 실패'));
    document.head.appendChild(script);
  });
}

/**
 * Fetch Google User Info using the OAuth Access Token
 */
async function fetchGoogleUserInfo(accessToken: string): Promise<UserProfile> {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Google 사용자 프로필 정보를 불러올 수 없습니다.');
  }

  const data = await response.json();
  return {
    uid: data.sub || `google-${Date.now()}`,
    displayName: data.name || data.given_name || 'Google 사용자',
    email: data.email || null,
    photoURL: data.picture || null,
  };
}

/**
 * Perform OAuth token acquisition via Google Identity Services
 */
function signInWithGIS(): Promise<{ user: UserProfile; accessToken: string }> {
  return new Promise(async (resolve, reject) => {
    try {
      await loadGoogleScript();

      if (!window.google?.accounts?.oauth2) {
        throw new Error('Google 로그인 서비스를 초기화할 수 없습니다.');
      }

      const clientId = firebaseConfig.oAuthClientId;
      if (!clientId) {
        throw new Error('Google OAuth Client ID가 설정되어 있지 않습니다.');
      }

      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES.join(' '),
        prompt: 'select_account',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            reject(new Error(tokenResponse.error_description || tokenResponse.error || 'Google 로그인에 실패했습니다.'));
            return;
          }

          if (!tokenResponse.access_token) {
            reject(new Error('Google Drive 접근 권한(Access Token)을 획득하지 못했습니다.'));
            return;
          }

          try {
            const token = tokenResponse.access_token;
            const profile = await fetchGoogleUserInfo(token);

            cachedAccessToken = token;
            cachedUser = profile;

            // Session persistence
            try {
              sessionStorage.setItem('trip_vault_token', token);
              sessionStorage.setItem('trip_vault_user', JSON.stringify(profile));
            } catch {
              // Ignore session storage errors
            }

            resolve({ user: profile, accessToken: token });
          } catch (profileError) {
            reject(profileError);
          }
        },
        error_callback: (err) => {
          reject(err || new Error('Google 로그인 팝업이 취소되었거나 차단되었습니다.'));
        },
      });

      client.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Initialize Auth state listener and restore session if available
 */
export const initAuth = (
  onAuthSuccess?: (user: UserProfile, token: string) => void,
  onAuthFailure?: () => void
) => {
  // Check session storage first
  try {
    const savedToken = sessionStorage.getItem('trip_vault_token');
    const savedUserStr = sessionStorage.getItem('trip_vault_user');
    if (savedToken && savedUserStr) {
      const savedUser = JSON.parse(savedUserStr);
      cachedAccessToken = savedToken;
      cachedUser = savedUser;
      if (onAuthSuccess) {
        onAuthSuccess(savedUser, savedToken);
        return () => {};
      }
    }
  } catch {
    // Ignore session storage parsing errors
  }

  // Also listen for Firebase Auth state
  return onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
    if (fbUser && cachedAccessToken) {
      const userProfile: UserProfile = {
        uid: fbUser.uid,
        displayName: fbUser.displayName,
        email: fbUser.email,
        photoURL: fbUser.photoURL,
      };
      cachedUser = userProfile;
      if (onAuthSuccess) onAuthSuccess(userProfile, cachedAccessToken);
    } else if (!cachedAccessToken) {
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Primary Google Sign In Handler
 * Uses Google Identity Services (GIS) with automatic fallback and unauthorized-domain protection
 */
export const googleSignIn = async (): Promise<{ user: UserProfile; accessToken: string }> => {
  try {
    // Try Google Identity Services first (avoids Firebase unauthorized-domain restriction)
    return await signInWithGIS();
  } catch (gisError: unknown) {
    console.warn('GIS sign in error, trying Firebase Auth fallback:', gisError);

    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        throw new Error('Google Drive 접근 권한(Access Token)을 획득하지 못했습니다.');
      }

      const userProfile: UserProfile = {
        uid: result.user.uid,
        displayName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
      };

      cachedAccessToken = credential.accessToken;
      cachedUser = userProfile;

      try {
        sessionStorage.setItem('trip_vault_token', credential.accessToken);
        sessionStorage.setItem('trip_vault_user', JSON.stringify(userProfile));
      } catch {
        // Ignore session storage errors
      }

      return { user: userProfile, accessToken: cachedAccessToken };
    } catch (fbError: unknown) {
      console.error('Firebase Auth sign in error:', fbError);
      
      const combinedMsg = ((gisError instanceof Error ? gisError.message : '') + ' ' + (fbError instanceof Error ? fbError.message : '')).toLowerCase();
      if (combinedMsg.includes('access_denied') || combinedMsg.includes('승인 오류') || combinedMsg.includes('blocked') || combinedMsg.includes('차단')) {
        throw new Error('Google 보안 설정에서 앱이 승인되지 않았거나 검수 단계입니다. Google 로그인 팝업 창 하단의 [고급(Advanced)] → [계속(안전하지 않은 페이지로 이동)]을 누르시면 정상 진입하실 수 있습니다.');
      }
      if (fbError instanceof Error && fbError.message.includes('unauthorized-domain')) {
        throw new Error('Google 로그인이 완료되지 않았습니다. 팝업 차단이 설정되어 있다면 팝업을 허용하고 다시 시도해 주세요.');
      }
      throw gisError instanceof Error ? gisError : (fbError instanceof Error ? fbError : new Error('로그인에 실패했습니다.'));
    }
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  if (token) {
    sessionStorage.setItem('trip_vault_token', token);
  } else {
    sessionStorage.removeItem('trip_vault_token');
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch {
    // Ignore signout errors
  }
  cachedAccessToken = null;
  cachedUser = null;
  try {
    sessionStorage.removeItem('trip_vault_token');
    sessionStorage.removeItem('trip_vault_user');
  } catch {
    // Ignore
  }
};
