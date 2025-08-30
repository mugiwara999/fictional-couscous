// Example usage of Redis in the project
import redisService from '../services/redis.js';
import { rateLimit, cache } from '../middleware/redis.js';

// Example 1: Basic Redis operations
export async function basicRedisExample() {
  try {
    // Set a value with TTL
    await redisService.set('user:123:profile', JSON.stringify({
      name: 'John Doe',
      email: 'john@example.com',
      credits: 100
    }), 3600); // 1 hour TTL

    // Get the value
    const profile = await redisService.get('user:123:profile');
    if (profile) {
      const userProfile = JSON.parse(profile);
      console.log('User profile:', userProfile);
    }

    // Check if key exists
    const exists = await redisService.exists('user:123:profile');
    console.log('Key exists:', exists);

    // Delete the key
    await redisService.del('user:123:profile');
  } catch (error) {
    console.error('Redis operation failed:', error);
  }
}

// Example 2: Session management
export async function sessionExample() {
  try {
    const userId = 'user:123';
    const sessionData = {
      userId: '123',
      email: 'john@example.com',
      lastLogin: new Date().toISOString(),
      preferences: {
        theme: 'dark',
        language: 'en'
      }
    };

    // Cache user session
    await redisService.cacheUserSession(userId, sessionData, 7200); // 2 hours

    // Retrieve session
    const session = await redisService.getUserSession(userId);
    if (session) {
      console.log('User session:', session);
    }

    // Invalidate session
    await redisService.invalidateUserSession(userId);
  } catch (error) {
    console.error('Session operation failed:', error);
  }
}

// Example 3: Rate limiting
export async function rateLimitExample() {
  try {
    const userId = 'user:123';
    const key = `rate_limit:${userId}`;
    
    // Check if user is within rate limit (10 requests per hour)
    const allowed = await redisService.rateLimit(key, 10, 3600);
    
    if (allowed) {
      console.log('Request allowed');
      // Process the request
    } else {
      console.log('Rate limit exceeded');
      // Return rate limit error
    }

    // Get current rate limit count
    const count = await redisService.getRateLimitCount(key);
    console.log('Current rate limit count:', count);
  } catch (error) {
    console.error('Rate limit operation failed:', error);
  }
}

// Example 4: Caching API responses
export async function cachingExample() {
  try {
    const cacheKey = 'api:models:user:123';
    
    // Check if data is cached
    const cached = await redisService.get(cacheKey);
    if (cached) {
      console.log('Returning cached data');
      return JSON.parse(cached);
    }

    // If not cached, fetch from database
    console.log('Fetching data from database');
    const data = await fetchDataFromDatabase(); // Your database query here
    
    // Cache the result for 5 minutes
    await redisService.set(cacheKey, JSON.stringify(data), 300);
    
    return data;
  } catch (error) {
    console.error('Caching operation failed:', error);
  }
}

// Example 5: Pub/Sub messaging
export async function pubSubExample() {
  try {
    const channel = 'user:notifications';
    
    // Subscribe to notifications
    await redisService.subscribe(channel, (message) => {
      console.log('Received notification:', message);
      // Handle the notification
    });

    // Publish a notification
    await redisService.publish(channel, JSON.stringify({
      type: 'credit_update',
      userId: '123',
      message: 'Credits updated successfully'
    }));
  } catch (error) {
    console.error('Pub/Sub operation failed:', error);
  }
}

// Example 6: Hash operations for complex data
export async function hashExample() {
  try {
    const userId = 'user:123';
    
    // Store user data as hash
    await redisService.hset(userId, 'name', 'John Doe');
    await redisService.hset(userId, 'email', 'john@example.com');
    await redisService.hset(userId, 'credits', '100');
    await redisService.hset(userId, 'lastLogin', new Date().toISOString());

    // Get specific field
    const name = await redisService.hget(userId, 'name');
    console.log('User name:', name);

    // Get all fields
    const userData = await redisService.hgetall(userId);
    console.log('All user data:', userData);

    // Delete specific field
    await redisService.hdel(userId, 'lastLogin');
  } catch (error) {
    console.error('Hash operation failed:', error);
  }
}

// Example 7: List operations for queues
export async function listExample() {
  try {
    const queueKey = 'processing:queue';
    
    // Add items to queue
    await redisService.lpush(queueKey, JSON.stringify({
      id: '1',
      type: 'image_generation',
      userId: '123'
    }));
    
    await redisService.lpush(queueKey, JSON.stringify({
      id: '2',
      type: 'model_training',
      userId: '456'
    }));

    // Process items from queue
    const item = await redisService.rpop(queueKey);
    if (item) {
      const task = JSON.parse(item);
      console.log('Processing task:', task);
    }

    // Get all items in queue
    const allItems = await redisService.lrange(queueKey, 0, -1);
    console.log('All items in queue:', allItems.map(item => JSON.parse(item)));
  } catch (error) {
    console.error('List operation failed:', error);
  }
}

// Example 8: Set operations for unique collections
export async function setExample() {
  try {
    const setKey = 'online:users';
    
    // Add users to online set
    await redisService.sadd(setKey, 'user:123');
    await redisService.sadd(setKey, 'user:456');
    await redisService.sadd(setKey, 'user:789');

    // Check if user is online
    const isOnline = await redisService.sismember(setKey, 'user:123');
    console.log('User 123 is online:', isOnline);

    // Get all online users
    const onlineUsers = await redisService.smembers(setKey);
    console.log('Online users:', onlineUsers);

    // Remove user from online set
    await redisService.srem(setKey, 'user:123');
  } catch (error) {
    console.error('Set operation failed:', error);
  }
}

// Helper function for database simulation
async function fetchDataFromDatabase() {
  // Simulate database query
  return {
    models: [
      { id: '1', name: 'Model 1', status: 'trained' },
      { id: '2', name: 'Model 2', status: 'training' }
    ],
    timestamp: new Date().toISOString()
  };
}

// Example 9: Middleware usage in Express routes
export function expressMiddlewareExample() {
  // This would be used in your Express app
  /*
  import express from 'express';
  import { rateLimit, cache } from './middleware/redis.js';
  
  const app = express();
  
  // Apply rate limiting to all routes
  app.use(rateLimit(100, 3600)); // 100 requests per hour
  
  // Cache specific route responses
  app.get('/api/models', cache(300), (req, res) => {
    // This response will be cached for 5 minutes
    res.json({ models: [] });
  });
  
  // Apply rate limiting to specific route
  app.post('/api/generate', rateLimit(10, 3600), (req, res) => {
    // Only 10 requests per hour for this endpoint
    res.json({ success: true });
  });
  */
}

// Example 10: Error handling and fallbacks
export async function errorHandlingExample() {
  try {
    // Try to get cached data
    const cached = await redisService.get('some:key');
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.error('Redis error, falling back to database:', error);
    // Fallback to database query
    return await fetchDataFromDatabase();
  }
}
