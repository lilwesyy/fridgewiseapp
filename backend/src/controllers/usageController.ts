import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getUserDailyUsage } from '../middleware/dailyLimits';
import { APIResponse } from '@/types';

export const getDailyUsage = async (req: AuthRequest, res: Response<APIResponse<any>>): Promise<void> => {
  try {
    const user = req.user!;
    
    const usage = await getUserDailyUsage(user.id);
    
    res.status(200).json({
      success: true,
      data: usage
    });
  } catch (error: any) {
    console.error('Failed to get daily usage:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get usage information'
    });
  }
};