import { successResponse, errorResponse, methodNotAllowed } from '@/lib/api';
import { removeTokenCookie } from '@/lib/auth';
import { clearCsrfCookie } from '@/lib/csrf';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res);
  }

  try {
    const authCookie = removeTokenCookie();
    const csrfCookie = clearCsrfCookie();

    res.setHeader('Set-Cookie', [authCookie, csrfCookie]);
    
    return successResponse(res, null, 'Logged out successfully');
  } catch (error) {
    console.error('Logout error:', error);
    return errorResponse(res, 'Logout failed', 500);
  }
}
