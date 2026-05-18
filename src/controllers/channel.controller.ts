import { Response } from 'express';
import { ChannelSpyService } from '../services/channel-spy.service.js';
import { deductCoins } from '../utils/coin.util.js';

export class ChannelController {
  static async spyChannel(req: any, res: Response) {
    try {
      const { handle } = req.params;
      const user = req.user;

      if (!handle) {
        return res.status(400).json({ error: 'Channel handle or path is required' });
      }

      // Deduct 5 coins for competitor channel spying
      const hasCoins = await deductCoins(user, 5);
      if (!hasCoins) {
        return res.status(402).json({
          error: {
            code: 'INSUFFICIENT_COINS',
            message: 'You need 5 coins to spy on a competitor channel. Watch a short ad to earn more!'
          }
        });
      }

      const result = await ChannelSpyService.fetchChannelVideos(handle);
      return res.status(200).json(result);
    } catch (error: any) {
      console.error('[ChannelController] Error:', error);
      return res.status(500).json({ error: error.message || 'Failed to spy on channel videos' });
    }
  }
}
