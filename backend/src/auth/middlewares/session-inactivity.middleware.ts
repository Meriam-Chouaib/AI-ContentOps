import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SessionInactivityMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const lastActive = req.cookies?.last_active;
    const now = Date.now();

    const hasTokens = req.cookies?.access_token || req.cookies?.refresh_token;

    if (hasTokens) {
      if (lastActive) {
        const timeSinceLastActive = now - parseInt(lastActive, 10);
        // 15 minutes in milliseconds = 900,000
        if (timeSinceLastActive > 15 * 60 * 1000) {
          // Clear auth cookies
          res.clearCookie('access_token');
          res.clearCookie('refresh_token');
          res.clearCookie('last_active');

          // Return 401 Unauthorized immediately
          return res.status(401).json({
            message: 'Session expired due to inactivity',
            statusCode: 401,
          });
        }
      }

      // If active (within 2 minutes), slide the window
      res.cookie('last_active', now.toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
    }

    next();
  }
}
