# Redis Setup and Usage

This project now includes Redis for caching, rate limiting, session management, and pub/sub functionality.

## Quick Start

### 1. Start Redis with Docker Compose

```bash
# Start Redis and Redis Commander
docker-compose up -d

# Check if Redis is running
docker-compose ps
```

### 2. Environment Variables

Add the following to your `.env` file:

```env
# Redis Configuration
REDIS_URL=redis://localhost:6379
```

### 3. Install Dependencies

```bash
# Install Redis dependencies
cd apps/backend
bun install
```

## Redis Services

### Redis Service (`apps/backend/services/redis.ts`)

The main Redis service provides:

- **Basic Operations**: `set`, `get`, `del`, `exists`, `expire`
- **Hash Operations**: `hset`, `hget`, `hgetall`, `hdel`
- **List Operations**: `lpush`, `rpush`, `lpop`, `rpop`, `lrange`
- **Set Operations**: `sadd`, `srem`, `smembers`, `sismember`
- **Pub/Sub**: `publish`, `subscribe`, `unsubscribe`
- **Utility Methods**: Session management, rate limiting, caching

### Redis Middleware (`apps/backend/middleware/redis.ts`)

Available middleware:

- `rateLimit(limit, window)` - Rate limiting by IP
- `apiRateLimit(limit, window)` - Rate limiting by user ID
- `cache(ttl)` - Response caching
- `sessionMiddleware()` - Session management
- `invalidateCache(pattern)` - Cache invalidation
- `redisHealthCheck()` - Health check

## Usage Examples

### Rate Limiting

```typescript
import { rateLimit } from './middleware/redis.js';

// Apply rate limiting to routes
app.post('/api/endpoint', rateLimit(100, 3600), (req, res) => {
  // 100 requests per hour
});
```

### Caching

```typescript
import { cache } from './middleware/redis.js';

// Cache responses for 5 minutes
app.get('/api/data', cache(300), (req, res) => {
  // Response will be cached
});
```

### Session Management

```typescript
import redisService from './services/redis.js';

// Store user session
await redisService.cacheUserSession(userId, sessionData, 3600);

// Retrieve user session
const session = await redisService.getUserSession(userId);

// Invalidate session
await redisService.invalidateUserSession(userId);
```

### Manual Redis Operations

```typescript
import redisService from './services/redis.js';

// Set a value with TTL
await redisService.set('key', 'value', 3600);

// Get a value
const value = await redisService.get('key');

// Delete a key
await redisService.del('key');

// Check if key exists
const exists = await redisService.exists('key');
```

## Redis Routes

The following Redis management endpoints are available at `/redis`:

- `GET /redis/health` - Health check
- `GET /redis/cache/:key` - Get cached value
- `POST /redis/cache/:key` - Set cached value
- `DELETE /redis/cache/:key` - Delete cached value
- `GET /redis/rate-limit/:key` - Get rate limit info
- `GET /redis/session/:userId` - Get user session
- `POST /redis/session/:userId` - Set user session
- `DELETE /redis/session/:userId` - Delete user session
- `POST /redis/publish/:channel` - Publish message
- `GET /redis/stats` - Get Redis statistics

## Redis Commander

Redis Commander is available at `http://localhost:8081` for web-based Redis management.

## Production Considerations

### 1. Redis Configuration

For production, consider:

- Using a managed Redis service (AWS ElastiCache, Redis Cloud, etc.)
- Setting up Redis clustering for high availability
- Configuring Redis persistence (RDB/AOF)
- Setting up Redis monitoring and alerting

### 2. Security

- Use Redis ACLs for access control
- Enable Redis authentication
- Use SSL/TLS for Redis connections
- Restrict Redis network access

### 3. Performance

- Monitor Redis memory usage
- Set appropriate TTL values
- Use Redis pipelining for bulk operations
- Consider Redis caching strategies

### 4. Environment Variables

```env
# Production Redis configuration
REDIS_URL=redis://username:password@host:port
REDIS_TLS=true
REDIS_PASSWORD=your_redis_password
```

## Troubleshooting

### Redis Connection Issues

1. Check if Redis is running:
   ```bash
   docker-compose ps
   ```

2. Test Redis connection:
   ```bash
   docker exec -it fictional-couscous-redis redis-cli ping
   ```

3. Check Redis logs:
   ```bash
   docker-compose logs redis
   ```

### Common Issues

- **Connection refused**: Make sure Redis is running and accessible
- **Authentication failed**: Check Redis password configuration
- **Memory issues**: Monitor Redis memory usage and set appropriate limits

## Monitoring

### Health Check

```bash
curl http://localhost:8080/redis/health
```

### Statistics

```bash
curl http://localhost:8080/redis/stats
```

### Redis CLI

```bash
# Connect to Redis CLI
docker exec -it fictional-couscous-redis redis-cli

# Monitor Redis commands
MONITOR

# Check Redis info
INFO
```
