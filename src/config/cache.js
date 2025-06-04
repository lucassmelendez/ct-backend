const redis = require('redis');
const NodeCache = require('node-cache');

// Configuración de caché en memoria (para datos pequeños y frecuentes)
const memoryCache = new NodeCache({
  stdTTL: 300, // 5 minutos por defecto
  checkperiod: 60, // Verificar cada minuto por elementos expirados
  useClones: false
});

// Configuración de Redis (para datos más grandes y persistentes)
let redisClient = null;

const initializeRedis = async () => {
  try {
    // Configuración de Redis - ajusta según tu entorno
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: process.env.REDIS_DB || 0,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    };

    redisClient = redis.createClient(redisConfig);

    redisClient.on('error', (err) => {
      console.warn('Redis connection error:', err.message);
      console.log('Continuando sin Redis - usando solo caché en memoria');
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis conectado exitosamente');
    });

    await redisClient.connect();
  } catch (error) {
    console.warn('No se pudo conectar a Redis:', error.message);
    console.log('Continuando sin Redis - usando solo caché en memoria');
    redisClient = null;
  }
};

// Clase principal de caché
class CacheManager {
  constructor() {
    this.memoryCache = memoryCache;
    this.redisClient = null;
  }

  async initialize() {
    await initializeRedis();
    this.redisClient = redisClient;
  }

  // Obtener valor del caché
  async get(key) {
    try {
      // Primero intentar caché en memoria
      const memoryValue = this.memoryCache.get(key);
      if (memoryValue !== undefined) {
        return memoryValue;
      }

      // Si no está en memoria, intentar Redis
      if (this.redisClient && this.redisClient.isOpen) {
        const redisValue = await this.redisClient.get(key);
        if (redisValue) {
          const parsedValue = JSON.parse(redisValue);
          // Guardar en memoria para acceso más rápido
          this.memoryCache.set(key, parsedValue, 300);
          return parsedValue;
        }
      }

      return null;
    } catch (error) {
      console.error('Error al obtener del caché:', error);
      return null;
    }
  }

  // Guardar valor en caché
  async set(key, value, ttl = 300) {
    try {
      // Guardar en memoria
      this.memoryCache.set(key, value, ttl);

      // Guardar en Redis si está disponible
      if (this.redisClient && this.redisClient.isOpen) {
        await this.redisClient.setEx(key, ttl, JSON.stringify(value));
      }

      return true;
    } catch (error) {
      console.error('Error al guardar en caché:', error);
      return false;
    }
  }

  // Eliminar del caché
  async del(key) {
    try {
      this.memoryCache.del(key);

      if (this.redisClient && this.redisClient.isOpen) {
        await this.redisClient.del(key);
      }

      return true;
    } catch (error) {
      console.error('Error al eliminar del caché:', error);
      return false;
    }
  }

  // Limpiar caché por patrón
  async clearPattern(pattern) {
    try {
      // Limpiar memoria cache
      const keys = this.memoryCache.keys();
      keys.forEach(key => {
        if (key.includes(pattern)) {
          this.memoryCache.del(key);
        }
      });

      // Limpiar Redis si está disponible
      if (this.redisClient && this.redisClient.isOpen) {
        const redisKeys = await this.redisClient.keys(`*${pattern}*`);
        if (redisKeys.length > 0) {
          await this.redisClient.del(redisKeys);
        }
      }

      return true;
    } catch (error) {
      console.error('Error al limpiar caché por patrón:', error);
      return false;
    }
  }

  // Obtener estadísticas del caché
  getStats() {
    const memoryStats = this.memoryCache.getStats();
    return {
      memory: {
        keys: memoryStats.keys,
        hits: memoryStats.hits,
        misses: memoryStats.misses,
        hitRate: memoryStats.hits / (memoryStats.hits + memoryStats.misses) || 0
      },
      redis: {
        connected: this.redisClient && this.redisClient.isOpen
      }
    };
  }
}

// Instancia singleton
const cacheManager = new CacheManager();

module.exports = {
  cacheManager,
  initializeCache: () => cacheManager.initialize()
}; 