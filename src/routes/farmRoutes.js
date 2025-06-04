const express = require('express');
const router = express.Router();
const {
  getFarms,
  getFarmById,
  createFarm,
  updateFarm,
  deleteFarm,
  getFarmCattle,
  getFarmWorkers,
  getFarmVeterinarians,
  addWorkerToFarm,
  addVeterinarianToFarm,
  removeWorkerFromFarm,
  removeVeterinarianFromFarm
} = require('../controllers/farmController');
const { supabaseAuth } = require('../middlewares/supabaseAuthMiddleware');

// Rutas básicas de granjas
router.route('/')
  .get(supabaseAuth, getFarms)
  .post(supabaseAuth, createFarm);

router.route('/:id')
  .get(supabaseAuth, getFarmById)
  .put(supabaseAuth, updateFarm)
  .delete(supabaseAuth, deleteFarm);

// Rutas para relaciones de granja
router.route('/:id/cattle')
  .get(supabaseAuth, getFarmCattle);

router.route('/:id/workers')
  .get(supabaseAuth, getFarmWorkers)
  .post(supabaseAuth, addWorkerToFarm);

router.route('/:id/workers/:workerId')
  .delete(supabaseAuth, removeWorkerFromFarm);

router.route('/:id/veterinarians')
  .get(supabaseAuth, getFarmVeterinarians)
  .post(supabaseAuth, addVeterinarianToFarm);

router.route('/:id/veterinarians/:vetId')
  .delete(supabaseAuth, removeVeterinarianFromFarm);

module.exports = router; 