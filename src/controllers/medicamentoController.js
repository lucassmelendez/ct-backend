const asyncHandler = require('express-async-handler');
const medicamentoModel = require('../models/medicamentoModel');

/**
 * @desc    Obtener todos los medicamentos
 * @route   GET /api/medicamentos
 * @access  Private
 */
const getMedicamentos = asyncHandler(async (req, res) => {
  try {
    const medicamentos = await medicamentoModel.getAllMedicamentos();
    res.json(medicamentos);
  } catch (error) {
    console.error('Error al obtener medicamentos:', error);
    res.status(500);
    throw new Error('Error al obtener medicamentos: ' + error.message);
  }
});

/**
 * @desc    Obtener un medicamento por ID
 * @route   GET /api/medicamentos/:id
 * @access  Private
 */
const getMedicamentoById = asyncHandler(async (req, res) => {
  try {
    const medicamento = await medicamentoModel.getMedicamentoById(req.params.id);

    if (!medicamento) {
      res.status(404);
      throw new Error('Medicamento no encontrado');
    }

    res.json(medicamento);
  } catch (error) {
    console.error('Error al obtener medicamento:', error);
    if (!res.statusCode || res.statusCode === 200) {
      res.status(500);
    }
    throw error;
  }
});

/**
 * @desc    Crear un nuevo medicamento
 * @route   POST /api/medicamentos
 * @access  Private
 */
const createMedicamento = asyncHandler(async (req, res) => {
  try {
    const { nombre, dosis, horas } = req.body;

    if (!nombre) {
      res.status(400);
      throw new Error('El nombre del medicamento es requerido');
    }

    const medicamentoData = {
      nombre,
      dosis: dosis || '',
      horas: horas || ''
    };

    const newMedicamento = await medicamentoModel.createMedicamento(medicamentoData);
    
    res.status(201).json(newMedicamento);
  } catch (error) {
    console.error('Error al crear medicamento:', error);
    res.status(400);
    throw new Error('Error al crear medicamento: ' + error.message);
  }
});

/**
 * @desc    Actualizar un medicamento
 * @route   PUT /api/medicamentos/:id
 * @access  Private
 */
const updateMedicamento = asyncHandler(async (req, res) => {
  try {
    const { nombre, dosis, horas } = req.body;

    const updateData = {
      nombre,
      dosis,
      horas
    };

    const updatedMedicamento = await medicamentoModel.updateMedicamento(req.params.id, updateData);

    if (!updatedMedicamento) {
      res.status(404);
      throw new Error('Medicamento no encontrado');
    }

    res.json(updatedMedicamento);
  } catch (error) {
    console.error('Error al actualizar medicamento:', error);
    if (!res.statusCode || res.statusCode === 200) {
      res.status(500);
    }
    throw error;
  }
});

/**
 * @desc    Eliminar un medicamento
 * @route   DELETE /api/medicamentos/:id
 * @access  Private
 */
const deleteMedicamento = asyncHandler(async (req, res) => {
  try {
    const result = await medicamentoModel.deleteMedicamento(req.params.id);

    if (!result) {
      res.status(404);
      throw new Error('Medicamento no encontrado');
    }

    res.json({ message: 'Medicamento eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar medicamento:', error);
    if (!res.statusCode || res.statusCode === 200) {
      res.status(500);
    }
    throw error;
  }
});

module.exports = {
  getMedicamentos,
  getMedicamentoById,
  createMedicamento,
  updateMedicamento,
  deleteMedicamento
}; 