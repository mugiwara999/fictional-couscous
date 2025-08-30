import Redis from 'ioredis';
import { config } from 'dotenv';

config();

class RedisService {
  private client: Redis;
  private subscriber: Redis;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    this.client = new Redis(redisUrl, {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.subscriber = new Redis(redisUrl, {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.client.on('connect', () => {
      console.log('Redis client connected');
    });

    this.client.on('error', (error) => {
      console.error('Redis client error:', error);
    });

    this.client.on('close', () => {
      console.log('Redis client connection closed');
    });

    this.subscriber.on('connect', () => {
      console.log('Redis subscriber connected');
    });

    this.subscriber.on('error', (error) => {
      console.error('Redis subscriber error:', error);
    });
  }

  // Basic Redis operations
  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setex(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async del(key: string): Promise<number> {
    return await this.client.del(key);
  }

  async exists(key: string): Promise<number> {
    return await this.client.exists(key);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return await this.client.expire(key, seconds);
  }

  // Hash operations
  async hset(key: string, field: string, value: string): Promise<number> {
    return await this.client.hset(key, field, value);
  }

  async hget(key: string, field: string): Promise<string | null> {
    return await this.client.hget(key, field);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return await this.client.hgetall(key);
  }

  async hdel(key: string, field: string): Promise<number> {
    return await this.client.hdel(key, field);
  }

  // List operations
  async lpush(key: string, value: string): Promise<number> {
    return await this.client.lpush(key, value);
  }

  async rpush(key: string, value: string): Promise<number> {
    return await this.client.rpush(key, value);
  }

  async lpop(key: string): Promise<string | null> {
    return await this.client.lpop(key);
  }

  async rpop(key: string): Promise<string | null> {
    return await this.client.rpop(key);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return await this.client.lrange(key, start, stop);
  }

  // Set operations
  async sadd(key: string, member: string): Promise<number> {
    return await this.client.sadd(key, member);
  }

  async srem(key: string, member: string): Promise<number> {
    return await this.client.srem(key, member);
  }

  async smembers(key: string): Promise<string[]> {
    return await this.client.smembers(key);
  }

  async sismember(key: string, member: string): Promise<number> {
    return await this.client.sismember(key, member);
  }

  // Pub/Sub operations
  async publish(channel: string, message: string): Promise<number> {
    return await this.client.publish(channel, message);
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    await this.subscriber.subscribe(channel);
    this.subscriber.on('message', (ch, message) => {
      if (ch === channel) {
        callback(message);
      }
    });
  }

  async unsubscribe(channel: string): Promise<void> {
    await this.subscriber.unsubscribe(channel);
  }

  // Utility methods for common use cases
  async cacheUserSession(userId: string, sessionData: any, ttl: number = 3600): Promise<void> {
    await this.set(`session:${userId}`, JSON.stringify(sessionData), ttl);
  }

  async getUserSession(userId: string): Promise<any | null> {
    const session = await this.get(`session:${userId}`);
    return session ? JSON.parse(session) : null;
  }

  async invalidateUserSession(userId: string): Promise<void> {
    await this.del(`session:${userId}`);
  }

  async rateLimit(key: string, limit: number, window: number): Promise<boolean> {
    const current = await this.get(key);
    const count = current ? parseInt(current) : 0;
    
    if (count >= limit) {
      return false; // Rate limit exceeded
    }
    
    await this.set(key, (count + 1).toString(), window);
    return true; // Within rate limit
  }

  async getRateLimitCount(key: string): Promise<number> {
    const current = await this.get(key);
    return current ? parseInt(current) : 0;
  }

  // Connection management
  async connect(): Promise<void> {
    await this.client.connect();
    await this.subscriber.connect();
  }

  async disconnect(): Promise<void> {
    await this.client.disconnect();
    await this.subscriber.disconnect();
  }

  // Health check
  async ping(): Promise<string> {
    return await this.client.ping();
  }
}

// Create a singleton instance
const redisService = new RedisService();

export default redisService;
export { RedisService };
