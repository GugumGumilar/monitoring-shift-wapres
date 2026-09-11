import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account',
});

export interface CachedGoogleUser {
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  uid: string;
}

const STORAGE_KEY_TOKEN = 'monitoring_shift_google_access_token';
const STORAGE_KEY_USER = 'monitoring_shift_google_user_cache';

let isSigningIn = false;
let cachedAccessToken: string | null = (() => {
  try {
    return localStorage.getItem(STORAGE_KEY_TOKEN);
  } catch {
    return null;
  }
})();

export function getCachedGoogleUser(): CachedGoogleUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveGoogleSession(user: { email: string | null; displayName: string | null; photoURL: string | null; uid: string }, token: string) {
  try {
    cachedAccessToken = token;
    localStorage.setItem(STORAGE_KEY_TOKEN, token);
    localStorage.setItem(
      STORAGE_KEY_USER,
      JSON.stringify({
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        uid: user.uid,
      })
    );
  } catch (err) {
    console.warn('Failed to cache Google session to localStorage:', err);
  }
}

export function clearGoogleSession() {
  cachedAccessToken = null;
  try {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_USER);
  } catch {}
}

export const initAuth = (
  onAuthSuccess?: (user: User | CachedGoogleUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  // If we already have a saved token and user in localStorage, restore them immediately
  // so other officers or page refreshes don't require re-logging in!
  const cachedUser = getCachedGoogleUser();
  if (cachedAccessToken && cachedUser && onAuthSuccess) {
    onAuthSuccess(cachedUser as any, cachedAccessToken);
  }

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        saveGoogleSession(user, cachedAccessToken);
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        // Try restoring from storage
        const storedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
        if (storedToken) {
          cachedAccessToken = storedToken;
          saveGoogleSession(user, storedToken);
          if (onAuthSuccess) onAuthSuccess(user, storedToken);
        } else if (!isSigningIn) {
          if (onAuthFailure) onAuthFailure();
        }
      }
    } else {
      // Check if we have cached session even if Firebase Auth session expired
      const storedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
      const storedUser = getCachedGoogleUser();
      if (storedToken && storedUser && onAuthSuccess) {
        cachedAccessToken = storedToken;
        onAuthSuccess(storedUser as any, storedToken);
      } else {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string }> => {
  if (isSigningIn) {
    throw new Error('Jendela login sedang terbuka. Silakan periksa jendela pop-up di browser Anda.');
  }

  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan token akses dari Google.');
    }
    cachedAccessToken = credential.accessToken;
    saveGoogleSession(result.user, credential.accessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    const code = error?.code || '';
    if (code === 'auth/cancelled-popup-request' || code === 'auth/popup-closed-by-user') {
      // Graceful notification: user closed popup or switched window, not a fatal error
      console.log('Google login cancelled or closed by user.');
      throw new Error('Jendela login ditutup atau dibatalkan.');
    }
    if (code === 'auth/popup-blocked') {
      throw new Error(
        'Jendela pop-up login diblokir oleh browser. Harap izinkan pop-up (Pop-up Allowed) pada pengaturan browser Anda.'
      );
    }
    if (
      code === 'auth/access-denied' ||
      error?.message?.includes('access_denied') ||
      error?.message?.includes('403') ||
      error?.message?.includes('has not completed the Google verification')
    ) {
      throw new Error(
        'Akun ini belum didaftarkan sebagai Penguji (Test User) di Google Cloud Console. Silakan login menggunakan akun utama (gugumgumilar062@gmail.com) atau gunakan opsi Webhook Sheet tanpa login.'
      );
    }
    console.error('Google sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) return cachedAccessToken;
  try {
    return localStorage.getItem(STORAGE_KEY_TOKEN);
  } catch {
    return null;
  }
};

export const logout = async () => {
  clearGoogleSession();
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('SignOut warning:', err);
  }
};
