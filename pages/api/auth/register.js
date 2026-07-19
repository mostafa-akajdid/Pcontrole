import { AuthService } from '@/lib/services';
import { validateRequest, registerSchema } from '@/lib/validation';
import { successResponse, errorResponse, methodNotAllowed } from '@/lib/api';
import { setTokenCookie } from '@/lib/auth';
import { generateCsrfToken, setCsrfCookie } from '@/lib/csrf';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res);
  }

  try {
    const validation = validateRequest(registerSchema, req.body);
    
    if (!validation.success) {
      return errorResponse(res, 'Validation failed', 400, validation.errors);
    }

    const { name, email, password } = validation.data;
    const result = await AuthService.register({ name, email, password });
    
    // Set HTTP-only cookie
    setTokenCookie(res, result.token);

    // Set CSRF cookie (readable by JavaScript for double-submit pattern)
    setCsrfCookie(res, generateCsrfToken());
    
    return successResponse(res, result, 'Registration successful', 201);
  } catch (error) {
    console.error('Registration error:', error);
    return errorResponse(res, error.message || 'Registration failed', 400);
  }
}
