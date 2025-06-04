const express = require('express');
const router = express.Router();
const {
  getCattle,
  getCattleById,
  createCattle,
  updateCattle,
  deleteCattle,
  addMedicalRecord,
  getMedicalRecords,
  getCattleWithFarmInfo
} = require('../controllers/cattleController');
const { supabaseAuth: protect } = require('../middlewares/supabaseAuthMiddleware');
const { 
  cattleCacheMiddleware, 
  invalidateCacheMiddleware 
} = require('../middlewares/cacheMiddleware');

router.route('/')
  .get(protect, cattleCacheMiddleware, getCattle)
  .post(protect, invalidateCacheMiddleware(['cattle_', 'farms_']), createCattle);

router.route('/with-farm-info')
  .get(protect, cattleCacheMiddleware, getCattleWithFarmInfo);

router.route('/:id')
  .get(protect, cattleCacheMiddleware, getCattleById)
  .put(protect, invalidateCacheMiddleware(['cattle_', 'farms_']), updateCattle)
  .delete(protect, invalidateCacheMiddleware(['cattle_', 'farms_']), deleteCattle);

router.route('/:id/medical')
  .post(protect, invalidateCacheMiddleware(['cattle_']), addMedicalRecord);

router.route('/:id/medical-records')
  .get(protect, cattleCacheMiddleware, getMedicalRecords);

module.exports = router; 