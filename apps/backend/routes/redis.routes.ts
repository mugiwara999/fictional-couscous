import express from 'express';
import redisService from '../services/redis.js';
import { rateLimit } from '../middleware/redis.js';

const router = express.Router();

// Health check endpoint
router.get('/health', rateLimit(10, 60), async (req, res) => {
  try {
    const ping = await redisService.ping();
    res.json({
      status: 'healthy',
      redis: ping === 'PONG' ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      redis: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Cache management endpoints
router.get('/cache/:key', rateLimit(100, 60), async (req, res) => {
  try {
    const { key } = req.params;
    const value = await redisService.get(key);
    
    if (value === null) {
      return res.status(404).json({ error: 'Key not found' });
    }
    
    res.json({ key, value });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get cache value' });
  }
});

router.post('/cache/:key', rateLimit(50, 60), async (req, res) => {
  try {
    const { key } = req.params;
    const { value, ttl } = req.body;
    
    if (!value) {
      return res.status(400).json({ error: 'Value is required' });
    }
    
    await redisService.set(key, value, ttl);
    res.json({ message: 'Cache value set successfully', key });
  } catch (error) {
    res.status(500).json({ error: 'Failed to set cache value' });
  }
});

router.delete('/cache/:key', rateLimit(50, 60), async (req, res) => {
  try {
    const { key } = req.params;
    const deleted = await redisService.del(key);
    
    if (deleted === 0) {
      return res.status(404).json({ error: 'Key not found' });
    }
    
    res.json({ message: 'Cache value deleted successfully', key });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete cache value' });
  }
});

// Rate limit info endpoint
router.get('/rate-limit/:key', rateLimit(10, 60), async (req, res) => {
  try {
    const { key } = req.params;
    const count = await redisService.getRateLimitCount(key);
    
    res.json({ key, count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get rate limit info' });
  }
});

// Session management endpoints
router.get('/session/:userId', rateLimit(20, 60), async (req, res) => {
  try {
    const { userId } = req.params;
    const session = await redisService.getUserSession(userId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json({ userId, session });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get session' });
  }
});

router.post('/session/:userId', rateLimit(20, 60), async (req, res) => {
  try {
    const { userId } = req.params;
    const { sessionData, ttl } = req.body;
    
    if (!sessionData) {
      return res.status(400).json({ error: 'Session data is required' });
    }
    
    await redisService.cacheUserSession(userId, sessionData, ttl);
    res.json({ message: 'Session cached successfully', userId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cache session' });
  }
});

router.delete('/session/:userId', rateLimit(20, 60), async (req, res) => {
  try {
    const { userId } = req.params;
    await redisService.invalidateUserSession(userId);
    res.json({ message: 'Session invalidated successfully', userId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to invalidate session' });
  }
});

// Pub/Sub endpoints
router.post('/publish/:channel', rateLimit(30, 60), async (req, res) => {
  try {
    const { channel } = req.params;
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const subscribers = await redisService.publish(channel, message);
    res.json({ 
      message: 'Message published successfully', 
      channel, 
      subscribers 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to publish message' });
  }
});

// Statistics endpoint
router.get('/stats', rateLimit(5, 60), async (req, res) => {
  try {
    // This is a basic stats endpoint - in production you might want to
    // implement more detailed Redis statistics
    const ping = await redisService.ping();
    
    res.json({
      status: ping === 'PONG' ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get Redis stats' });
  }
});

export default router;
