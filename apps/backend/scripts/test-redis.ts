#!/usr/bin/env bun

import redisService from '../services/redis.js';

async function testRedisConnection() {
  console.log('🧪 Testing Redis connection...');
  
  try {
    // Test connection
    const ping = await redisService.ping();
    console.log('✅ Redis ping:', ping);
    
    // Test basic operations
    console.log('\n📝 Testing basic operations...');
    await redisService.set('test:key', 'test:value', 60);
    const value = await redisService.get('test:key');
    console.log('✅ Set/Get test:', value);
    
    // Test session management
    console.log('\n👤 Testing session management...');
    const sessionData = { userId: '123', email: 'test@example.com' };
    await redisService.cacheUserSession('test:user', sessionData, 300);
    const session = await redisService.getUserSession('test:user');
    console.log('✅ Session test:', session);
    
    // Test rate limiting
    console.log('\n🚦 Testing rate limiting...');
    const allowed = await redisService.rateLimit('test:rate:limit', 5, 60);
    console.log('✅ Rate limit test (should be true):', allowed);
    
    const count = await redisService.getRateLimitCount('test:rate:limit');
    console.log('✅ Rate limit count:', count);
    
    // Test hash operations
    console.log('\n🗂️ Testing hash operations...');
    await redisService.hset('test:user:123', 'name', 'John Doe');
    await redisService.hset('test:user:123', 'email', 'john@example.com');
    const name = await redisService.hget('test:user:123', 'name');
    const allData = await redisService.hgetall('test:user:123');
    console.log('✅ Hash test - name:', name);
    console.log('✅ Hash test - all data:', allData);
    
    // Test list operations
    console.log('\n📋 Testing list operations...');
    await redisService.lpush('test:queue', 'item1');
    await redisService.lpush('test:queue', 'item2');
    const items = await redisService.lrange('test:queue', 0, -1);
    console.log('✅ List test:', items);
    
    // Test set operations
    console.log('\n🔢 Testing set operations...');
    await redisService.sadd('test:set', 'member1');
    await redisService.sadd('test:set', 'member2');
    const members = await redisService.smembers('test:set');
    console.log('✅ Set test:', members);
    
    // Test pub/sub
    console.log('\n📡 Testing pub/sub...');
    const channel = 'test:channel';
    
    // Subscribe to channel
    await redisService.subscribe(channel, (message) => {
      console.log('✅ Received message:', message);
    });
    
    // Publish message
    const subscribers = await redisService.publish(channel, 'Hello from test!');
    console.log('✅ Published message to', subscribers, 'subscribers');
    
    // Clean up
    console.log('\n🧹 Cleaning up test data...');
    await redisService.del('test:key');
    await redisService.del('test:user');
    await redisService.del('test:user:123');
    await redisService.del('test:queue');
    await redisService.del('test:set');
    await redisService.del('test:rate:limit');
    await redisService.unsubscribe(channel);
    
    console.log('✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Redis test failed:', error);
    process.exit(1);
  } finally {
    await redisService.disconnect();
    console.log('🔌 Redis connection closed');
  }
}

// Run the test
testRedisConnection();
