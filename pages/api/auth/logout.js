import { successResponse, errorResponse, methodNotAllowed } from '@/lib/api';
import { removeTokenCookie } from '@/lib/auth';
import { clearCsrfCookie } from '@/lib/csrf';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res);
  }

  try {
    removeTokenCookie(res);
    clearCsrfCookie(res);
    return successResponse(res, null, 'Logged out successfully');
  } catch (error) {
    console.error('Logout error:', error);
    return errorResponse(res, 'Logout failed', 500);
  }
}
