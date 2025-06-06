const express = require('express');
const router = express.Router();
const {
  getMedicamentos,
  getMedicamentoById,
  createMedicamento,
  updateMedicamento,
  deleteMedicamento
} = require('../controllers/medicamentoController');
const { supabaseAuth: protect } = require('../middlewares/supabaseAuthMiddleware');

// Rutas para medicamentos
router.route('/')
  .get(protect, getMedicamentos)
  .post(protect, createMedicamento);

router.route('/:id')
  .get(protect, getMedicamentoById)
  .put(protect, updateMedicamento)
  .delete(protect, deleteMedicamento);

module.exports = router; 