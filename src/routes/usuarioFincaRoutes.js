const express = require('express');
const router = express.Router();
const usuarioFincaController = require('../controllers/usuarioFincaController');
const authMiddleware = require('../middlewares/supabaseAuthMiddleware');

// Asociar un usuario a una finca
router.post('/asociar', authMiddleware.supabaseAuth, usuarioFincaController.asociarUsuarioFinca);

// Desasociar un usuario de una finca
router.post('/desasociar', authMiddleware.supabaseAuth, usuarioFincaController.desasociarUsuarioFinca);

// Obtener fincas de un usuario
router.get('/usuario/:id_usuario', authMiddleware.supabaseAuth, usuarioFincaController.getFincasByUsuario);

// Obtener usuarios de una finca
router.get('/finca/:id_finca', authMiddleware.supabaseAuth, usuarioFincaController.getUsuariosByFinca);

// Obtener propietarios de una finca
router.get('/finca/:id_finca/propietarios', authMiddleware.supabaseAuth, usuarioFincaController.getPropietariosByFinca);

module.exports = router; 