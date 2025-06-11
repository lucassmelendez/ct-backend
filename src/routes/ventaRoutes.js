const express = require('express');
const router = express.Router();
const {
  getVentas,
  getVentaById,
  createVenta,
  updateVenta,
  deleteVenta,
  getVentasByComprador,
  getVentasStats,
  addGanadoToVenta,
  getGanadoFromVenta
} = require('../controllers/ventaController');
const { supabaseAuth: protect } = require('../middlewares/supabaseAuthMiddleware');

// Rutas de estadísticas - debe ir antes de /:id para evitar conflictos
router.route('/stats')
  .get(protect, getVentasStats);

// Rutas para buscar por comprador
router.route('/comprador/:comprador')
  .get(protect, getVentasByComprador);

// Rutas principales
router.route('/')
  .get(protect, getVentas)
  .post(protect, createVenta);

router.route('/:id')
  .get(protect, getVentaById)
  .put(protect, updateVenta)
  .delete(protect, deleteVenta);

// Rutas para gestionar ganado en ventas
router.route('/:id/ganado')
  .get(protect, getGanadoFromVenta)
  .post(protect, addGanadoToVenta);

module.exports = router; 