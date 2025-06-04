const asyncHandler = require('express-async-handler');
const supabaseService = require('../services/supabaseService');

/**
 * @desc    Obtener todas las fincas del usuario
 * @route   GET /api/farms
 * @access  Private
 */
const getFarms = asyncHandler(async (req, res) => {
  try {
    console.log('Buscando fincas para usuario:', req.user.uid);
    
    // Obtener las fincas asociadas al usuario desde la tabla usuario_finca
    const farms = await supabaseService.getFincasByOwner(req.user.uid);
    
    res.json(farms);
  } catch (error) {
    console.error('Error al obtener fincas:', error);
    res.status(500);
    throw new Error('Error al obtener fincas: ' + error.message);
  }
});

/**
 * @desc    Obtener una finca por ID
 * @route   GET /api/farms/:id
 * @access  Private
 */
const getFarmById = asyncHandler(async (req, res) => {
  try {
    const farm = await supabaseService.getFincaById(req.params.id);

    if (!farm) {
      res.status(404);
      throw new Error('Finca no encontrada');
    }

    res.json(farm);
  } catch (error) {
    if (!res.statusCode || res.statusCode === 200) {
      res.status(500);
    }
    throw error;
  }
});

/**
 * @desc    Crear una nueva finca
 * @route   POST /api/farms
 * @access  Private
 */
const createFarm = asyncHandler(async (req, res) => {
  try {
    console.log('Cuerpo completo de la solicitud:', JSON.stringify(req.body, null, 2));
    
    // Validar que el nombre de la finca no sea nulo o vacío
    if (!req.body.nombre && !req.body.name) {
      res.status(400);
      throw new Error('El nombre de la finca es obligatorio');
    }
    
    // Traducir los campos del frontend al formato del backend
    // Solo incluir campos que existen en la tabla finca
    const farmData = {
      nombre: req.body.nombre || req.body.name,
      tamano: req.body.tamano || req.body.size || 0,
      propietario_id: req.user.uid
    };

    // Asegurarse de que el nombre esté definido
    console.log('Datos de finca a crear:', {
      nombre: farmData.nombre,
      tamano: farmData.tamano,
      propietario_id: farmData.propietario_id
    });

    const newFarm = await supabaseService.createFinca(farmData);
    
    res.status(201).json(newFarm);
  } catch (error) {
    res.status(400);
    throw new Error('Error al crear finca: ' + error.message);
  }
});

/**
 * @desc    Actualizar una finca existente
 * @route   PUT /api/farms/:id
 * @access  Private
 */
const updateFarm = asyncHandler(async (req, res) => {
  try {
    console.log('Cuerpo completo de la solicitud de actualización:', JSON.stringify(req.body, null, 2));
    
    // Validar que haya datos para actualizar
    if (Object.keys(req.body).length === 0) {
      res.status(400);
      throw new Error('No se proporcionaron datos para actualizar');
    }
    
    // Traducir los campos del frontend al formato del backend
    // Solo incluir campos que existen en la tabla finca
    const updateData = {};
    
    // Mapear campos
    if (req.body.name || req.body.nombre) {
      updateData.nombre = req.body.nombre || req.body.name;
    }
    
    if (req.body.size || req.body.tamano) {
      updateData.tamano = req.body.tamano || req.body.size;
    }
    
    // No permitir cambiar el propietario
    delete updateData.propietario_id;
    
    console.log('Datos de finca a actualizar:', updateData);
    
    const updatedFarm = await supabaseService.updateFinca(req.params.id, updateData);
    
    if (!updatedFarm) {
      res.status(404);
      throw new Error('Finca no encontrada');
    }
    
    res.json(updatedFarm);
  } catch (error) {
    if (!res.statusCode || res.statusCode === 200) {
      res.status(500);
    }
    throw error;
  }
});

/**
 * @desc    Eliminar una finca
 * @route   DELETE /api/farms/:id
 * @access  Private
 */
const deleteFarm = asyncHandler(async (req, res) => {
  try {
    const result = await supabaseService.deleteFinca(req.params.id);
    
    if (!result) {
      res.status(404);
      throw new Error('Finca no encontrada');
    }
    
    res.json({ message: 'Finca eliminada' });
  } catch (error) {
    if (!res.statusCode || res.statusCode === 200) {
      res.status(500);
    }
    throw error;
  }
});

/**
 * @desc    Obtener ganado de una finca
 * @route   GET /api/farms/:id/cattle
 * @access  Private
 */
const getFarmCattle = asyncHandler(async (req, res) => {
  try {
    const fincaId = req.params.id;
    console.log(`[FarmController] Solicitando ganado para finca ID: ${fincaId}`);
    
    // Validación de entrada
    if (!fincaId) {
      console.warn('[FarmController] ID de finca no proporcionado');
      return res.status(400).json({ 
        success: false,
        message: 'ID de finca no proporcionado',
        data: [],
        metadata: { requestedFarmId: fincaId }
      });
    }

    console.log(`[FarmController] Buscando ganado para finca ${fincaId} con usuario ${req.user.uid}`);
    const cattle = await supabaseService.getFincaGanados(fincaId);
    
    // Estructura de respuesta mejorada
    const response = {
      success: true,
      data: cattle || [],
      message: cattle.length === 0 ? `No se encontró ganado para la finca ${fincaId}` : `Se encontraron ${cattle.length} registros de ganado`,
      metadata: {
        farmId: fincaId,
        count: cattle ? cattle.length : 0,
        userId: req.user.uid,
        timestamp: new Date().toISOString()
      }
    };

    console.log(`[FarmController] Respondiendo con ${response.data.length} registros de ganado para finca ${fincaId}`);
    return res.json(response);
    
  } catch (error) {
    console.error(`[FarmController] Error en getFarmCattle para ID ${req.params.id}:`, error);
    
    // Manejar errores específicos
    if (error.message.includes('no existe')) {
      return res.status(404).json({
        success: false,
        message: error.message,
        data: [],
        metadata: {
          farmId: req.params.id,
          error: 'FARM_NOT_FOUND'
        }
      });
    }
    
    // Para otros errores, devolver error 500
    return res.status(500).json({
      success: false,
      message: 'Error al obtener ganado de la finca',
      data: [],
      metadata: {
        farmId: req.params.id,
        error: 'INTERNAL_SERVER_ERROR'
      }
    });
  }
});

/**
 * @desc    Obtener trabajadores de una finca
 * @route   GET /api/farms/:id/workers
 * @access  Private
 */
const getFarmWorkers = asyncHandler(async (req, res) => {
  try {
    const workers = await supabaseService.getFincaTrabajadores(req.params.id);
    res.json(workers);
  } catch (error) {
    res.status(500);
    throw new Error('Error al obtener trabajadores de la finca: ' + error.message);
  }
});

/**
 * @desc    Obtener veterinarios de una finca
 * @route   GET /api/farms/:id/veterinarians
 * @access  Private
 */
const getFarmVeterinarians = asyncHandler(async (req, res) => {
  try {
    const vets = await supabaseService.getFincaVeterinarios(req.params.id);
    res.json(vets);
  } catch (error) {
    res.status(500);
    throw new Error('Error al obtener veterinarios de la finca: ' + error.message);
  }
});

/**
 * @desc    Agregar un trabajador a una finca
 * @route   POST /api/farms/:id/workers
 * @access  Private
 */
const addWorkerToFarm = asyncHandler(async (req, res) => {
  try {
    res.status(501).json({ message: 'Funcionalidad no implementada en Supabase' });
  } catch (error) {
    res.status(500);
    throw new Error('Error al agregar trabajador a la finca: ' + error.message);
  }
});

/**
 * @desc    Agregar un veterinario a una finca
 * @route   POST /api/farms/:id/veterinarians
 * @access  Private
 */
const addVeterinarianToFarm = asyncHandler(async (req, res) => {
  try {
    res.status(501).json({ message: 'Funcionalidad no implementada en Supabase' });
  } catch (error) {
    res.status(500);
    throw new Error('Error al agregar veterinario a la finca: ' + error.message);
  }
});

/**
 * @desc    Eliminar un trabajador de una finca
 * @route   DELETE /api/farms/:id/workers/:workerId
 * @access  Private
 */
const removeWorkerFromFarm = asyncHandler(async (req, res) => {
  try {
    res.status(501).json({ message: 'Funcionalidad no implementada en Supabase' });
  } catch (error) {
    res.status(500);
    throw new Error('Error al eliminar trabajador de la finca: ' + error.message);
  }
});

/**
 * @desc    Eliminar un veterinario de una finca
 * @route   DELETE /api/farms/:id/veterinarians/:vetId
 * @access  Private
 */
const removeVeterinarianFromFarm = asyncHandler(async (req, res) => {
  try {
    res.status(501).json({ message: 'Funcionalidad no implementada en Supabase' });
  } catch (error) {
    res.status(500);
    throw new Error('Error al eliminar veterinario de la finca: ' + error.message);
  }
});

module.exports = {
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
};