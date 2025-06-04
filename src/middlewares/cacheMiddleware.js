const { cacheManager } = require('../config/cache');

// Middleware para cachear respuestas GET
const cacheMiddleware = (ttl = 300, keyGenerator = null) => {
  return async (req, res, next) => {
    // Solo cachear métodos GET
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // Generar clave de caché
      const cacheKey = keyGenerator 
        ? keyGenerator(req) 
        : `${req.originalUrl}_${JSON.stringify(req.query)}_${req.user?.id || 'anonymous'}`;

      // Intentar obtener del caché
      const cachedData = await cacheManager.get(cacheKey);
      
      if (cachedData) {
        console.log(`✅ Cache HIT para: ${cacheKey}`);
        return res.json(cachedData);
      }

      console.log(`❌ Cache MISS para: ${cacheKey}`);

      // Interceptar la respuesta original
      const originalJson = res.json;
      res.json = function(data) {
        // Guardar en caché solo si la respuesta es exitosa
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheManager.set(cacheKey, data, ttl).catch(err => {
            console.error('Error al guardar en caché:', err);
          });
        }
        
        // Llamar al método original
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Error en middleware de caché:', error);
      next();
    }
  };
};

// Middleware específico para datos de ganado
const cattleCacheMiddleware = cacheMiddleware(600, (req) => {
  const userId = req.user?.id || 'anonymous';
  const farmId = req.params.farmId || req.query.farmId || 'all';
  return `cattle_${userId}_${farmId}_${JSON.stringify(req.query)}`;
});

// Middleware específico para datos de fincas
const farmCacheMiddleware = cacheMiddleware(900, (req) => {
  const userId = req.user?.id || 'anonymous';
  return `farms_${userId}_${JSON.stringify(req.query)}`;
});

// Middleware específico para datos de usuarios
const userCacheMiddleware = cacheMiddleware(1800, (req) => {
  const userId = req.user?.id || req.params.id || 'anonymous';
  return `user_${userId}_${JSON.stringify(req.query)}`;
});

// Middleware para limpiar caché cuando se modifican datos
const invalidateCacheMiddleware = (patterns = []) => {
  return async (req, res, next) => {
    // Interceptar respuestas exitosas de métodos que modifican datos
    const originalJson = res.json;
    res.json = function(data) {
      // Si la operación fue exitosa, limpiar caché relacionado
      if (res.statusCode >= 200 && res.statusCode < 300) {
        patterns.forEach(pattern => {
          cacheManager.clearPattern(pattern).catch(err => {
            console.error('Error al limpiar caché:', err);
          });
        });
      }
      
      return originalJson.call(this, data);
    };

    next();
  };
};

// Middleware para comprimir respuestas
const compressionMiddleware = require('compression')({
  filter: (req, res) => {
    // No comprimir si el cliente no lo soporta
    if (req.headers['x-no-compression']) {
      return false;
    }
    
    // Comprimir solo respuestas JSON grandes
    return compression.filter(req, res);
  },
  threshold: 1024 // Solo comprimir si es mayor a 1KB
});

module.exports = {
  cacheMiddleware,
  cattleCacheMiddleware,
  farmCacheMiddleware,
  userCacheMiddleware,
  invalidateCacheMiddleware,
  compressionMiddleware
}; 