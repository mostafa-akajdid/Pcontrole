import { SettingsService, UserService } from '@/lib/services';
import { getUserFromRequest } from '@/lib/auth';
import { validateRequest, smtpTestSchema } from '@/lib/validation';
import { successResponse, errorResponse, methodNotAllowed, unauthorizedResponse, forbiddenResponse } from '@/lib/api';

export default async function handler(req, res) {
  const tokenPayload = getUserFromRequest(req);

  if (!tokenPayload) {
    return unauthorizedResponse(res);
  }

  if (req.method !== 'POST') {
    return methodNotAllowed(res);
  }

  try {
    const user = await UserService.findById(tokenPayload.userId);
    if (!user.permissions?.includes('settings.update')) {
      return forbiddenResponse(res, 'Insufficient permissions');
    }

    const validation = validateRequest(smtpTestSchema, req.body);
    if (!validation.success) {
      return errorResponse(res, 'Validation failed', 400, validation.errors);
    }

    const { recipientEmail } = validation.data;

    const smtpSettings = await SettingsService.getRawGroup('email');
    const { smtpHost, smtpPort, smtpUsername, smtpPassword, smtpSenderName, smtpSenderEmail } = smtpSettings;

    if (!smtpHost || !smtpPort) {
      return errorResponse(res, 'SMTP is not configured. Please configure SMTP settings first.', 400);
    }

    try {
      const nodemailer = await import('nodemailer');
      const transport = nodemailer.default?.createTransport || nodemailer.createTransport;
      const transporter = transport({
        host: smtpHost,
        port: parseInt(smtpPort, 10),
        secure: parseInt(smtpPort, 10) === 465,
        auth: smtpUsername ? { user: smtpUsername, pass: smtpPassword } : undefined,
      });

      const generalSettings = await SettingsService.getRawGroup('general');
      const siteName = generalSettings.siteName || 'TASKILY';

      await transporter.sendMail({
        from: `"${smtpSenderName || siteName}" <${smtpSenderEmail || smtpUsername}>`,
        to: recipientEmail,
        subject: `${siteName} - SMTP Test Email`,
        text: `This is a test email from ${siteName}. If you received this, your SMTP configuration is working correctly.`,
        html: `<h2>${siteName} - SMTP Test</h2><p>This is a test email from ${siteName}.</p><p>If you received this, your SMTP configuration is working correctly.</p>`,
      });

      return successResponse(res, null, 'Test email sent successfully');
    } catch (smtpError) {
      return errorResponse(res, 'SMTP test failed. Please check your SMTP configuration.', 400);
    }
  } catch (error) {
    console.error('SMTP test error:', error);
    return errorResponse(res, error.message || 'Failed to test SMTP', 500);
  }
}
