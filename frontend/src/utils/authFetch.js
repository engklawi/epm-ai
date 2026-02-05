import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

export const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export async function authFetch(url, options = {}) {
  const user = auth.currentUser;
  if (!user) {
    window.location.href = '/login';
    throw new Error('Not authenticated');
  }

  const token = await user.getIdToken();

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });

  // If backend rejects the token, sign out and redirect to login
  if (response.status === 401) {
    await signOut(auth);
  }

  return response;
}
