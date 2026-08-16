import appletConfig from '../../firebase-applet-config.json';
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

export const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
];

let cachedAccessToken: string | null = null;
let cachedUser: UserProfile | null = null;

export function getCustomClientId(): string | null {
  try {
    return localStorage.getItem('trip_vault_custom_client_id');
  } catch {
    return null;
  }
}

export function setCustomClientId(clientId: string) {
  try {
    if (clientId && clientId.trim().length > 0) {
      localStorage.setItem('trip_vault_custom_client_id', clientId.trim());
    } else {
      localStorage.removeItem('trip_vault_custom_client_id');
    }
  } catch {
    // Ignore storage errors
  }
}

export function getEffectiveClientId(): string {
  const custom = getCustomClientId();
  if (custom && custom.trim().length > 0) {
    return custom.trim();
  }
  return appletConfig.oAuthClientId || '';
}

// Dynamic loader for Google Identity Services
export function loadGoogleScript(): Promise<void> {
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
export function googleSignIn(): Promise<{ user: UserProfile; accessToken: string }> {
  return new Promise(async (resolve, reject) => {
    try {
      await loadGoogleScript();

      if (!window.google?.accounts?.oauth2) {
        throw new Error('Google 로그인 라이브러리를 초기화할 수 없습니다. 페이지를 새로고침 후 다시 시도해 주세요.');
      }

      const clientId = getEffectiveClientId();
      if (!clientId) {
        throw new Error('Google OAuth Client ID가 설정되어 있지 않습니다.');
      }

      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES.join(' '),
        prompt: 'select_account',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            const errDesc = tokenResponse.error_description || tokenResponse.error;
            reject(new Error(errDesc || 'Google 로그인에 실패했습니다.'));
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
          console.error('GIS Error callback:', err);
          reject(new Error('Google 로그인 팝업 창이 닫혔거나 차단되었습니다.'));
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
  // Check session storage
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

  if (onAuthFailure) {
    onAuthFailure();
  }

  return () => {};
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  if (token) {
    try {
      sessionStorage.setItem('trip_vault_token', token);
    } catch {
      // Ignore
    }
  } else {
    try {
      sessionStorage.removeItem('trip_vault_token');
    } catch {
      // Ignore
    }
  }
};

export const logout = async () => {
  cachedAccessToken = null;
  cachedUser = null;
  try {
    sessionStorage.removeItem('trip_vault_token');
    sessionStorage.removeItem('trip_vault_user');
  } catch {
    // Ignore
  }
};
