import { AuthService } from '@/lib/services';
import { validateRequest, forgotPasswordSchema } from '@/lib/validation';
import { successResponse, errorResponse, methodNotAllowed } from '@/lib/api';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res);
  }

  try {
    const validation = validateRequest(forgotPasswordSchema, req.body);
    
    if (!validation.success) {
      return errorResponse(res, 'Validation failed', 400, validation.errors);
    }

    const { email } = validation.data;
    const result = await AuthService.generateResetToken(email);
    
    return successResponse(res, result);
  } catch (error) {
    console.error('Forgot password error:', error);
    return errorResponse(res, error.message || 'Failed to process request', 500);
  }
}
