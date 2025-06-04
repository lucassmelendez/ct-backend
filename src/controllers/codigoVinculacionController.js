const asyncHandler = require('express-async-handler');
const codigosModel = require('../models/supabaseCodigosVinculacionModel');
const userModel = require('../models/supabaseUserModel');

/**
 * @desc    Generar un código de vinculación para trabajador o veterinario
 * @route   POST /api/vincular/generar
 * @access  Private (solo admin)
 */
const generarCodigo = asyncHandler(async (req, res) => {
  try {
    const { idFinca, tipo, duracionMinutos } = req.body;
    
    if (!idFinca || !tipo) {
      res.status(400);
      throw new Error('Se requiere idFinca y tipo (trabajador o veterinario)');
    }
    
    // Verificar que el usuario es propietario de la finca o admin
    // Esto se puede mejorar según tu lógica de autorización
    
    const codigo = await codigosModel.crearCodigoVinculacion(
      idFinca, 
      tipo, 
      duracionMinutos || 60
    );
    
    res.status(201).json({
      success: true,
      data: codigo
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    throw new Error(`Error al generar código: ${error.message}`);
  }
});

/**
 * @desc    Verificar y aplicar un código de vinculación
 * @route   POST /api/vincular/verificar
 * @access  Private
 */
const verificarCodigo = asyncHandler(async (req, res) => {
  try {
    const { codigo } = req.body;
    
    if (!codigo) {
      res.status(400);
      throw new Error('Se requiere el código de vinculación');
    }
    
    // El id del usuario se obtiene del token de autenticación
    const idUsuario = req.user.uid;
    
    const resultado = await codigosModel.verificarYVincular(codigo, idUsuario);
    
    res.status(200).json({
      success: true,
      message: 'Vinculación exitosa',
      data: resultado
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    throw new Error(`Error al verificar código: ${error.message}`);
  }
});

/**
 * @desc    Obtener todos los códigos activos para una finca
 * @route   GET /api/vincular/finca/:idFinca
 * @access  Private (solo admin o propietario)
 */
const getCodigosByFinca = asyncHandler(async (req, res) => {
  try {
    const { idFinca } = req.params;
    
    if (!idFinca) {
      res.status(400);
      throw new Error('Se requiere el ID de la finca');
    }
    
    // Verificar que el usuario es propietario de la finca o admin
    // Esto se puede mejorar según tu lógica de autorización
    
    const codigos = codigosModel.getCodigosActivosByFinca(idFinca);
    
    res.status(200).json({
      success: true,
      data: codigos
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    throw new Error(`Error al obtener códigos: ${error.message}`);
  }
});

/**
 * @desc    Eliminar un código de vinculación
 * @route   DELETE /api/vincular/codigo/:codigo/finca/:idFinca
 * @access  Private (solo admin o propietario)
 */
const eliminarCodigo = asyncHandler(async (req, res) => {
  try {
    const { codigo, idFinca } = req.params;
    
    if (!codigo || !idFinca) {
      res.status(400);
      throw new Error('Se requiere el código y el ID de la finca');
    }
    
    // Verificar que el usuario es propietario de la finca o admin
    // Esto se puede mejorar según tu lógica de autorización
    
    const resultado = codigosModel.eliminarCodigo(codigo, idFinca);
    
    if (!resultado) {
      res.status(404);
      throw new Error('Código no encontrado o no pertenece a la finca especificada');
    }
    
    res.status(200).json({
      success: true,
      message: 'Código eliminado correctamente'
    });
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    throw new Error(`Error al eliminar código: ${error.message}`);
  }
});

module.exports = {
  generarCodigo,
  verificarCodigo,
  getCodigosByFinca,
  eliminarCodigo
}; 