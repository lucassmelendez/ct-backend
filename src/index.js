const express = require('express');
const cors = require('cors');
const compression = require('compression');
require('dotenv').config(); // Cargar variables de entorno

// Importar configuración de caché
const { initializeCache, cacheManager } = require('./config/cache');

const userRoutes = require('./routes/userRoutes');
const cattleRoutes = require('./routes/cattleRoutes');
const farmRoutes = require('./routes/farmRoutes');
const usuarioFincaRoutes = require('./routes/usuarioFincaRoutes');
const vinculacionRoutes = require('./routes/vinculacionRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Inicializar caché al arrancar el servidor
const initializeServer = async () => {
  try {
    await initializeCache();
    console.log('✅ Sistema de caché inicializado');
  } catch (error) {
    console.warn('⚠️ Error al inicializar caché:', error.message);
    console.log('Continuando sin caché...');
  }
};

// Mostrar configuración
console.log('Iniciando servidor con configuración:');
console.log(`- Puerto: ${PORT}`);
console.log(`- Entorno: ${process.env.NODE_ENV || 'development'}`);
console.log(`- Supabase URL: ${process.env.EXPO_PUBLIC_SUPABASE_URL || 'No configurado'}`);

// Middleware de compresión (debe ir antes que otros middlewares)
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 1024
}));

// Configuración CORS para permitir conexiones desde el frontend
app.use(cors({
  origin: '*',  // En producción, debes limitar esto a tu dominio frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Middleware para loggear las solicitudes
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

app.use('/api/users', userRoutes);
app.use('/api/cattle', cattleRoutes);
app.use('/api/farms', farmRoutes);
app.use('/api/usuario-finca', usuarioFincaRoutes);
app.use('/api/vincular', vinculacionRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'API de CowTracker funcionando correctamente' });
});

// Endpoint de prueba para verificar conexión
app.get('/api/test', (req, res) => {
  res.json({ status: 'ok', message: 'Conexión exitosa al backend' });
});

// Endpoint para obtener estadísticas de caché
app.get('/api/cache/stats', (req, res) => {
  try {
    const stats = cacheManager.getStats();
    res.json({
      status: 'ok',
      cache: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error al obtener estadísticas de caché',
      error: error.message
    });
  }
});

// Endpoint para limpiar caché manualmente
app.post('/api/cache/clear', async (req, res) => {
  try {
    const { pattern } = req.body;
    
    if (pattern) {
      await cacheManager.clearPattern(pattern);
      res.json({
        status: 'ok',
        message: `Caché limpiado para patrón: ${pattern}`
      });
    } else {
      // Limpiar todo el caché
      await cacheManager.clearPattern('');
      res.json({
        status: 'ok',
        message: 'Todo el caché ha sido limpiado'
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error al limpiar caché',
      error: error.message
    });
  }
});

// Inicializar servidor
const startServer = async () => {
  await initializeServer();
  
  // Escuchar en todas las interfaces de red (0.0.0.0) en lugar de solo localhost
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
    console.log(`API disponible en http://localhost:${PORT}/api`);
    console.log(`Para acceder desde otros dispositivos, usa http://TU_IP_LOCAL:${PORT}/api`);
    console.log(`Estadísticas de caché: http://localhost:${PORT}/api/cache/stats`);
  });
};

startServer().catch(console.error);

module.exports = app;