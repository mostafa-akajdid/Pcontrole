import { AuthService } from '@/lib/services';
import { validateRequest, resetPasswordSchema } from '@/lib/validation';
import { successResponse, errorResponse, methodNotAllowed } from '@/lib/api';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res);
  }

  try {
    const validation = validateRequest(resetPasswordSchema, req.body);
    
    if (!validation.success) {
      return errorResponse(res, 'Validation failed', 400, validation.errors);
    }

    const { token, password } = validation.data;
    const result = await AuthService.resetPassword({ token, password });
    
    return successResponse(res, result);
  } catch (error) {
    console.error('Reset password error:', error);
    return errorResponse(res, error.message || 'Failed to reset password', 400);
  }
}
