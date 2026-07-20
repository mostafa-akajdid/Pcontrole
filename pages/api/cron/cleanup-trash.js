import { MediaService } from '@/lib/services';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const result = await MediaService.cleanupTrash();

    return res.status(200).json({
      success: true,
      message: `Cleanup completed. ${result.deleted} file(s) permanently removed.`,
      data: {
        deleted: result.deleted,
        errors: result.errors,
      },
    });
  } catch (error) {
    console.error('Trash cleanup error:', error);
    return res.status(500).json({
      success: false,
      message: 'Cleanup failed',
      error: error.message,
    });
  }
}
