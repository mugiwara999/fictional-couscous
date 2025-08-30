import { Request, Response, NextFunction } from 'express';
import redisService from '../services/redis.js';

// Rate limiting middleware
export const rateLimit = (limit: number = 100, window: number = 3600) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = `rate_limit:${req.ip}`;
      const allowed = await redisService.rateLimit(key, limit, window);
      
      if (!allowed) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: `Too many requests. Limit: ${limit} requests per ${window} seconds`
        });
      }
      
      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Continue without rate limiting if Redis is unavailable
      next();
    }
  };
};

// API-specific rate limiting
export const apiRateLimit = (limit: number = 50, window: number = 3600) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.headers['user-id'] as string || req.ip;
      const key = `api_rate_limit:${userId}`;
      const allowed = await redisService.rateLimit(key, limit, window);
      
      if (!allowed) {
        return res.status(429).json({
          error: 'API rate limit exceeded',
          message: `Too many API requests. Limit: ${limit} requests per ${window} seconds`
        });
      }
      
      next();
    } catch (error) {
      console.error('API rate limiting error:', error);
      next();
    }
  };
};

// Caching middleware
export const cache = (ttl: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = `cache:${req.originalUrl}`;
      const cached = await redisService.get(key);
      
      if (cached) {
        return res.json(JSON.parse(cached));
      }
      
      // Store original send method
      const originalSend = res.json;
      
      // Override send method to cache response
      res.json = function(data: any) {
        redisService.set(key, JSON.stringify(data), ttl);
        return originalSend.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error('Caching error:', error);
      next();
    }
  };
};

// Session middleware using Redis
export const sessionMiddleware = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionId = req.headers['session-id'] as string;
      
      if (sessionId) {
        const session = await redisService.getUserSession(sessionId);
        if (session) {
          (req as any).session = session;
        }
      }
      
      next();
    } catch (error) {
      console.error('Session middleware error:', error);
      next();
    }
  };
};

// Cache invalidation middleware
export const invalidateCache = (pattern: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // This is a simplified version - in production you might want to use SCAN
      // to find and delete keys matching the pattern
      const key = `cache:${pattern}`;
      await redisService.del(key);
      
      next();
    } catch (error) {
      console.error('Cache invalidation error:', error);
      next();
    }
  };
};

// Health check middleware
export const redisHealthCheck = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ping = await redisService.ping();
      if (ping === 'PONG') {
        next();
      } else {
        res.status(503).json({ error: 'Redis service unavailable' });
      }
    } catch (error) {
      console.error('Redis health check failed:', error);
      res.status(503).json({ error: 'Redis service unavailable' });
    }
  };
};
