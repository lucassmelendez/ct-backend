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

router.route('/')
  .get(protect, getCattle)
  .post(protect, createCattle);

router.route('/with-farm-info')
  .get(protect, getCattleWithFarmInfo);

router.route('/:id')
  .get(protect, getCattleById)
  .put(protect, updateCattle)
  .delete(protect, deleteCattle);

router.route('/:id/medical')
  .post(protect, addMedicalRecord);

router.route('/:id/medical-records')
  .get(protect, getMedicalRecords);

module.exports = router; 