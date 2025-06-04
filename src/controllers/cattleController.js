const asyncHandler = require('express-async-handler');
const supabaseService = require('../services/supabaseService');

const getCattle = asyncHandler(async (req, res) => {
  try {
    console.log('Buscando ganado para usuario:', req.user.uid);
    
    const cattle = await supabaseService.getAllGanados();
    
    res.json(cattle);
  } catch (error) {
    console.error('Error al obtener ganado:', error);
    res.status(500);
    throw new Error('Error al obtener ganado: ' + error.message);
  }
});

const getCattleById = asyncHandler(async (req, res) => {
  try {
    console.log('Solicitando ganado con ID:', req.params.id);
    console.log('Usuario solicitante:', req.user.uid);
    
    const cattle = await supabaseService.getGanadoById(req.params.id);

    if (!cattle) {
      res.status(404);
      throw new Error('Ganado no encontrado');
    }

    res.json(cattle);
  } catch (error) {
    console.error('Error al obtener detalles del ganado:', error);
    if (!res.statusCode || res.statusCode === 200) {
      res.status(500);
    }
    throw error;
  }
});

const createCattle = asyncHandler(async (req, res) => {
  try {
    const ganadoData = {
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const newGanado = await supabaseService.createGanado(ganadoData);
    
    res.status(201).json(newGanado);
  } catch (error) {
    res.status(400);
    throw new Error('Error al crear ganado: ' + error.message);
  }
});

const updateCattle = asyncHandler(async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString()
    };

    const updatedGanado = await supabaseService.updateGanado(req.params.id, updateData);

    if (!updatedGanado) {
      res.status(404);
      throw new Error('Ganado no encontrado');
    }

    res.json(updatedGanado);
  } catch (error) {
    if (!res.statusCode || res.statusCode === 200) {
      res.status(500);
    }
    throw error;
  }
});

const deleteCattle = asyncHandler(async (req, res) => {
  try {
    const result = await supabaseService.deleteGanado(req.params.id);

    if (!result) {
      res.status(404);
      throw new Error('Ganado no encontrado');
    }

    res.json({ message: 'Ganado eliminado' });
  } catch (error) {
    if (!res.statusCode || res.statusCode === 200) {
      res.status(500);
    }
    throw error;
  }
});

const addMedicalRecord = asyncHandler(async (req, res) => {
  try {
    const medicalData = {
      ...req.body,
      created_at: new Date().toISOString()
    };

    const record = await supabaseService.addMedicalRecord(req.params.id, medicalData);

    res.status(201).json(record);
  } catch (error) {
    res.status(400);
    throw new Error('Error al agregar registro médico: ' + error.message);
  }
});

const getMedicalRecords = asyncHandler(async (req, res) => {
  try {
    const records = await supabaseService.getMedicalRecords(req.params.id);
    res.json(records);
  } catch (error) {
    res.status(500);
    throw new Error('Error al obtener registros médicos: ' + error.message);
  }
});

/**
 * @desc    Obtener todo el ganado con información de granja
 * @route   GET /api/cattle/with-farm-info
 * @access  Private
 */
const getCattleWithFarmInfo = asyncHandler(async (req, res) => {
  try {
    const cattle = await supabaseService.getAllGanadosWithInfo();
    res.json(cattle);
  } catch (error) {
    res.status(500);
    throw new Error('Error al obtener ganado con información: ' + error.message);
  }
});

module.exports = {
  getCattle,
  getCattleById,
  createCattle,
  updateCattle,
  deleteCattle,
  addMedicalRecord,
  getMedicalRecords,
  getCattleWithFarmInfo
}; 