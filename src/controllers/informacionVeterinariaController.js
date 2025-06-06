const {
  createInformacionVeterinaria,
  getInformacionVeterinariaById,
  updateInformacionVeterinaria,
  deleteInformacionVeterinaria,
  getAllInformacionesVeterinarias
} = require('../models/informacionVeterinariaModel');

/**
 * Crear nueva información veterinaria
 */
const crearInformacionVeterinaria = async (req, res) => {
  try {
    const datos = req.body;
    
    // Validaciones básicas
    if (!datos.diagnostico || !datos.tratamiento) {
      return res.status(400).json({
        success: false,
        message: 'Diagnóstico y tratamiento son campos requeridos'
      });
    }

    const nuevaInformacion = await createInformacionVeterinaria(datos);
    
    res.status(201).json({
      success: true,
      message: 'Información veterinaria creada exitosamente',
      data: nuevaInformacion
    });
  } catch (error) {
    console.error('Error en crearInformacionVeterinaria:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Obtener información veterinaria por ID
 */
const obtenerInformacionVeterinariaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }

    const informacion = await getInformacionVeterinariaById(parseInt(id));
    
    if (!informacion) {
      return res.status(404).json({
        success: false,
        message: 'Información veterinaria no encontrada'
      });
    }

    res.json({
      success: true,
      data: informacion
    });
  } catch (error) {
    console.error('Error en obtenerInformacionVeterinariaPorId:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Actualizar información veterinaria
 */
const actualizarInformacionVeterinaria = async (req, res) => {
  try {
    const { id } = req.params;
    const datos = req.body;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }

    const informacionActualizada = await updateInformacionVeterinaria(parseInt(id), datos);
    
    res.json({
      success: true,
      message: 'Información veterinaria actualizada exitosamente',
      data: informacionActualizada
    });
  } catch (error) {
    console.error('Error en actualizarInformacionVeterinaria:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Eliminar información veterinaria
 */
const eliminarInformacionVeterinaria = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }

    await deleteInformacionVeterinaria(parseInt(id));
    
    res.json({
      success: true,
      message: 'Información veterinaria eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error en eliminarInformacionVeterinaria:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Obtener todas las informaciones veterinarias
 */
const obtenerTodasLasInformacionesVeterinarias = async (req, res) => {
  try {
    const informaciones = await getAllInformacionesVeterinarias();
    
    res.json({
      success: true,
      data: informaciones
    });
  } catch (error) {
    console.error('Error en obtenerTodasLasInformacionesVeterinarias:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

module.exports = {
  crearInformacionVeterinaria,
  obtenerInformacionVeterinariaPorId,
  actualizarInformacionVeterinaria,
  eliminarInformacionVeterinaria,
  obtenerTodasLasInformacionesVeterinarias
}; 