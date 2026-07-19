import { AuthService } from '@/lib/services';
import { validateRequest, loginSchema } from '@/lib/validation';
import { successResponse, errorResponse, methodNotAllowed } from '@/lib/api';
import { setTokenCookie } from '@/lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res);
  }

  try {
    const validation = validateRequest(loginSchema, req.body);
    
    if (!validation.success) {
      return errorResponse(res, 'Validation failed', 400, validation.errors);
    }

    const { email, password } = validation.data;
    const result = await AuthService.login({ email, password });
    
    // Set HTTP-only cookie
    setTokenCookie(res, result.token);
    
    return successResponse(res, result, 'Login successful');
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse(res, error.message || 'Login failed', 401);
  }
}
