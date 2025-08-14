import Redis from 'redis'

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
const redisPassword = process.env.REDIS_PASSWORD || ''

let redis: ReturnType<typeof Redis.createClient> | null = null

export const getRedisClient = () => {
  if (!redis) {
    redis = Redis.createClient({
      url: redisUrl,
      password: redisPassword || undefined,
    })

    redis.on('error', (err) => {
      console.error('Redis Client Error:', err)
    })

    redis.on('connect', () => {
      console.log('Connected to Redis')
    })

    redis.on('ready', () => {
      console.log('Redis client ready')
    })
  }

  return redis
}

export const connectRedis = async () => {
  const client = getRedisClient()
  
  if (!client.isOpen) {
    try {
      await client.connect()
      console.log('Redis connection established')
    } catch (error) {
      console.error('Failed to connect to Redis:', error)
      // In development, continue without Redis if connection fails
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Continuing without Redis in development mode')
      } else {
        throw error
      }
    }
  }
  
  return client
}

export const disconnectRedis = async () => {
  if (redis && redis.isOpen) {
    await redis.disconnect()
    redis = null
  }
}

// Helper functions for common Redis operations
export class RedisService {
  private client: ReturnType<typeof Redis.createClient>

  constructor() {
    this.client = getRedisClient()
  }

  async set(key: string, value: string | number | object, expireInSeconds?: number) {
    await this.ensureConnection()
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value)
    
    if (expireInSeconds) {
      return await this.client.setEx(key, expireInSeconds, stringValue)
    }
    return await this.client.set(key, stringValue)
  }

  async get(key: string): Promise<string | null> {
    await this.ensureConnection()
    return await this.client.get(key)
  }

  async getObject<T>(key: string): Promise<T | null> {
    const value = await this.get(key)
    if (!value) return null
    
    try {
      return JSON.parse(value) as T
    } catch {
      return null
    }
  }

  async del(key: string): Promise<number> {
    await this.ensureConnection()
    return await this.client.del(key)
  }

  async exists(key: string): Promise<boolean> {
    await this.ensureConnection()
    const result = await this.client.exists(key)
    return result === 1
  }

  async incr(key: string): Promise<number> {
    await this.ensureConnection()
    return await this.client.incr(key)
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    await this.ensureConnection()
    const result = await this.client.expire(key, seconds)
    return result === 1
  }

  private async ensureConnection() {
    if (!this.client.isOpen) {
      await connectRedis()
    }
  }
}

export const redisService = new RedisService()