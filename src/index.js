const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Cargar variables de entorno
const userRoutes = require('./routes/userRoutes');
const cattleRoutes = require('./routes/cattleRoutes');
const farmRoutes = require('./routes/farmRoutes');
const usuarioFincaRoutes = require('./routes/usuarioFincaRoutes');
const vinculacionRoutes = require('./routes/vinculacionRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Mostrar configuración
console.log('Iniciando servidor con configuración:');
console.log(`- Puerto: ${PORT}`);
console.log(`- Entorno: ${process.env.NODE_ENV || 'development'}`);
console.log(`- Supabase URL: ${process.env.EXPO_PUBLIC_SUPABASE_URL || 'No configurado'}`);

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

// Escuchar en todas las interfaces de red (0.0.0.0) en lugar de solo localhost
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log(`API disponible en http://localhost:${PORT}/api`);
  console.log(`Para acceder desde otros dispositivos, usa http://TU_IP_LOCAL:${PORT}/api`);
});

module.exports = app;