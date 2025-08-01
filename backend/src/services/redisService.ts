import { createClient, RedisClientType } from 'redis';

class RedisService {
  private client: RedisClientType;
  private isConnected: boolean = false;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    this.client.on('error', (err) => {
      console.log('Redis Client Error:', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      console.log('Redis Client Connected');
      this.isConnected = true;
    });

    this.client.on('disconnect', () => {
      console.log('Redis Client Disconnected');
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (error) {
      console.log('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.disconnect();
    } catch (error) {
      console.log('Failed to disconnect from Redis:', error);
    }
  }

  // Cache methods
  async get(key: string): Promise<string | null> {
    if (!this.isConnected) return null;
    
    try {
      return await this.client.get(key);
    } catch (error) {
      console.log('Redis GET error:', error);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    if (!this.isConnected) return false;
    
    try {
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error) {
      console.log('Redis SET error:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.isConnected) return false;
    
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.log('Redis DEL error:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isConnected) return false;
    
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.log('Redis EXISTS error:', error);
      return false;
    }
  }

  // JSON cache methods
  async getJSON<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.log('JSON parse error:', error);
      return null;
    }
  }

  async setJSON<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    try {
      const jsonString = JSON.stringify(value);
      return await this.set(key, jsonString, ttlSeconds);
    } catch (error) {
      console.log('JSON stringify error:', error);
      return false;
    }
  }

  // Pattern-based operations (using SCAN instead of KEYS for better performance)
  async deletePattern(pattern: string): Promise<number> {
    if (!this.isConnected) return 0;
    
    try {
      let cursor = '0';
      let deletedCount = 0;
      
      do {
        const reply = await this.client.scan(cursor, {
          MATCH: pattern,
          COUNT: 100
        });
        cursor = reply.cursor;
        
        if (reply.keys.length > 0) {
          await this.client.del(reply.keys);
          deletedCount += reply.keys.length;
        }
      } while (cursor !== '0');
      
      return deletedCount;
    } catch (error) {
      console.log('Redis DELETE PATTERN error:', error);
      return 0;
    }
  }

  // Cache stampede protection with distributed locking
  async getOrSet<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    ttl: number,
    lockTtl: number = 30
  ): Promise<T> {
    if (!this.isConnected) {
      return await fetcher();
    }

    try {
      // Try to get from cache
      const cached = await this.getJSON<T>(key);
      if (cached) return cached;
      
      // Try to acquire lock
      const lockKey = `lock:${key}`;
      const lockValue = `${Date.now()}-${Math.random()}`;
      const acquired = await this.client.set(lockKey, lockValue, {
        EX: lockTtl,
        NX: true
      });
      
      if (acquired) {
        try {
          const data = await fetcher();
          await this.setJSON(key, data, ttl);
          await this.client.del(lockKey);
          return data;
        } catch (error) {
          await this.client.del(lockKey);
          throw error;
        }
      } else {
        // Wait for lock to release and try cache again
        await new Promise(resolve => setTimeout(resolve, 100));
        const retryData = await this.getJSON<T>(key);
        if (retryData) return retryData;
        
        // If still no data, fallback to direct fetch
        return await fetcher();
      }
    } catch (error) {
      console.log('Redis getOrSet error:', error);
      return await fetcher();
    }
  }

  // Memory usage monitoring
  async getMemoryUsage(): Promise<any> {
    if (!this.isConnected) return null;
    
    try {
      const info = await this.client.info('memory');
      const memoryInfo = info.split('\r\n').reduce((acc, line) => {
        const [key, value] = line.split(':');
        if (key && value) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, string>);

      const keyCount = await this.client.dbSize();
      
      return {
        used_memory: parseInt(memoryInfo.used_memory || '0'),
        used_memory_human: memoryInfo.used_memory_human,
        used_memory_rss: parseInt(memoryInfo.used_memory_rss || '0'),
        used_memory_rss_human: memoryInfo.used_memory_rss_human,
        used_memory_peak: parseInt(memoryInfo.used_memory_peak || '0'),
        used_memory_peak_human: memoryInfo.used_memory_peak_human,
        maxmemory: parseInt(memoryInfo.maxmemory || '0'),
        maxmemory_human: memoryInfo.maxmemory_human,
        maxmemory_policy: memoryInfo.maxmemory_policy,
        mem_fragmentation_ratio: parseFloat(memoryInfo.mem_fragmentation_ratio || '0'),
        keyspace_hits: parseInt(memoryInfo.keyspace_hits || '0'),
        keyspace_misses: parseInt(memoryInfo.keyspace_misses || '0'),
        key_count: keyCount,
        hit_rate: memoryInfo.keyspace_hits && memoryInfo.keyspace_misses 
          ? (parseInt(memoryInfo.keyspace_hits) / (parseInt(memoryInfo.keyspace_hits) + parseInt(memoryInfo.keyspace_misses))) * 100
          : 0
      };
    } catch (error) {
      console.log('Redis memory usage error:', error);
      return null;
    }
  }

  // Health check
  isHealthy(): boolean {
    return this.isConnected;
  }
}

export const redisService = new RedisService();