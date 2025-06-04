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
const { 
  farmCacheMiddleware, 
  cattleCacheMiddleware,
  userCacheMiddleware,
  invalidateCacheMiddleware 
} = require('../middlewares/cacheMiddleware');

// Rutas básicas de granjas
router.route('/')
  .get(supabaseAuth, farmCacheMiddleware, getFarms)
  .post(supabaseAuth, invalidateCacheMiddleware(['farms_', 'user_']), createFarm);

router.route('/:id')
  .get(supabaseAuth, farmCacheMiddleware, getFarmById)
  .put(supabaseAuth, invalidateCacheMiddleware(['farms_', 'cattle_', 'user_']), updateFarm)
  .delete(supabaseAuth, invalidateCacheMiddleware(['farms_', 'cattle_', 'user_']), deleteFarm);

// Rutas para relaciones de granja
router.route('/:id/cattle')
  .get(supabaseAuth, cattleCacheMiddleware, getFarmCattle);

router.route('/:id/workers')
  .get(supabaseAuth, userCacheMiddleware, getFarmWorkers)
  .post(supabaseAuth, invalidateCacheMiddleware(['user_', 'farms_']), addWorkerToFarm);

router.route('/:id/workers/:workerId')
  .delete(supabaseAuth, invalidateCacheMiddleware(['user_', 'farms_']), removeWorkerFromFarm);

router.route('/:id/veterinarians')
  .get(supabaseAuth, userCacheMiddleware, getFarmVeterinarians)
  .post(supabaseAuth, invalidateCacheMiddleware(['user_', 'farms_']), addVeterinarianToFarm);

router.route('/:id/veterinarians/:vetId')
  .delete(supabaseAuth, invalidateCacheMiddleware(['user_', 'farms_']), removeVeterinarianFromFarm);

module.exports = router; 