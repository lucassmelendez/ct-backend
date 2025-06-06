const express = require('express');
const router = express.Router();
const {
  getInformacionesVeterinarias,
  getInformacionVeterinariaById,
  createInformacionVeterinaria,
  updateInformacionVeterinaria,
  deleteInformacionVeterinaria,
  addMedicamentoToTratamiento,
  getMedicamentosByTratamiento,
  removeMedicamentoFromTratamiento
} = require('../controllers/veterinaryController');
const { supabaseAuth: protect } = require('../middlewares/supabaseAuthMiddleware');

// Rutas principales para información veterinaria
router.route('/')
  .get(protect, getInformacionesVeterinarias)
  .post(protect, createInformacionVeterinaria);

router.route('/:id')
  .get(protect, getInformacionVeterinariaById)
  .put(protect, updateInformacionVeterinaria)
  .delete(protect, deleteInformacionVeterinaria);

// Rutas para gestión de medicamentos en tratamientos
router.route('/:id/medicamentos')
  .get(protect, getMedicamentosByTratamiento)
  .post(protect, addMedicamentoToTratamiento);

router.route('/:id/medicamentos/:medicamentoId')
  .delete(protect, removeMedicamentoFromTratamiento);

module.exports = router; 