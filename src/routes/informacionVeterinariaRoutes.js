const express = require('express');
const router = express.Router();
const {
  crearInformacionVeterinaria,
  obtenerInformacionVeterinariaPorId,
  actualizarInformacionVeterinaria,
  eliminarInformacionVeterinaria,
  obtenerTodasLasInformacionesVeterinarias
} = require('../controllers/informacionVeterinariaController');

// Rutas para información veterinaria
router.post('/', crearInformacionVeterinaria);
router.get('/', obtenerTodasLasInformacionesVeterinarias);
router.get('/:id', obtenerInformacionVeterinariaPorId);
router.put('/:id', actualizarInformacionVeterinaria);
router.delete('/:id', eliminarInformacionVeterinaria);

module.exports = router; 