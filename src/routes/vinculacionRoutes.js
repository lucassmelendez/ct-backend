const express = require('express');
const router = express.Router();
const codigoVinculacionController = require('../controllers/codigoVinculacionController');
const { supabaseAuth } = require('../middlewares/supabaseAuthMiddleware');

// Generar código de vinculación (requiere autenticación)
router.post('/generar', supabaseAuth, codigoVinculacionController.generarCodigo);

// Verificar y aplicar código de vinculación (requiere autenticación)
router.post('/verificar', supabaseAuth, codigoVinculacionController.verificarCodigo);

// Obtener códigos activos para una finca (requiere autenticación)
router.get('/finca/:idFinca', supabaseAuth, codigoVinculacionController.getCodigosByFinca);

// Eliminar un código de vinculación (requiere autenticación)
router.delete('/codigo/:codigo/finca/:idFinca', supabaseAuth, codigoVinculacionController.eliminarCodigo);

module.exports = router; 