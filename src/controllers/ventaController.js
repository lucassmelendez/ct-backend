const asyncHandler = require('express-async-handler');
const supabaseService = require('../services/supabaseService');

/**
 * @desc    Obtener todas las ventas
 * @route   GET /api/ventas
 * @access  Private
 */
const getVentas = asyncHandler(async (req, res) => {
  try {
    console.log('Obteniendo todas las ventas para usuario:', req.user.uid);
    
    const ventas = await supabaseService.getAllVentas();
    
    res.json(ventas);
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500);
    throw new Error('Error al obtener ventas: ' + error.message);
  }
});

/**
 * @desc    Obtener venta por ID
 * @route   GET /api/ventas/:id
 * @access  Private
 */
const getVentaById = asyncHandler(async (req, res) => {
  try {
    console.log('Solicitando venta con ID:', req.params.id);
    console.log('Usuario solicitante:', req.user.uid);
    
    const venta = await supabaseService.getVentaById(req.params.id);

    if (!venta) {
      res.status(404);
      throw new Error('Venta no encontrada');
    }

    res.json(venta);
  } catch (error) {
    console.error('Error al obtener detalles de la venta:', error);
    if (!res.statusCode || res.statusCode === 200) {
      res.status(500);
    }
    throw error;
  }
});

/**
 * @desc    Crear nueva venta
 * @route   POST /api/ventas
 * @access  Private
 */
const createVenta = asyncHandler(async (req, res) => {
  try {
    const { ganados, ...ventaData } = req.body;
    
    // Validar datos requeridos
    if (!ventaData.comprador || !ventaData.cantidad || !ventaData.precio_unitario) {
      res.status(400);
      throw new Error('Faltan datos requeridos: comprador, cantidad y precio_unitario');
    }

    // Calcular total si no se proporciona
    if (!ventaData.total) {
      ventaData.total = ventaData.cantidad * ventaData.precio_unitario;
    }

    // Crear la venta
    const newVenta = await supabaseService.createVenta({
      ...ventaData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // Si se proporcionan IDs de ganado, crear las relaciones
    if (ganados && Array.isArray(ganados) && ganados.length > 0) {
      await supabaseService.addGanadosToVenta(newVenta.id_venta, ganados);
    }

    // Obtener la venta completa con las relaciones
    const ventaCompleta = await supabaseService.getVentaById(newVenta.id_venta);
    
    res.status(201).json(ventaCompleta);
  } catch (error) {
    console.error('Error al crear venta:', error);
    res.status(400);
    throw new Error('Error al crear venta: ' + error.message);
  }
});

/**
 * @desc    Actualizar venta
 * @route   PUT /api/ventas/:id
 * @access  Private
 */
const updateVenta = asyncHandler(async (req, res) => {
  try {
    const { ganados, ...updateData } = req.body;
    
    // Recalcular total si se actualiza cantidad o precio
    if (updateData.cantidad && updateData.precio_unitario) {
      updateData.total = updateData.cantidad * updateData.precio_unitario;
    }

    const updatedVenta = await supabaseService.updateVenta(req.params.id, {
      ...updateData,
      updated_at: new Date().toISOString()
    });

    if (!updatedVenta) {
      res.status(404);
      throw new Error('Venta no encontrada');
    }

    // Si se proporcionan nuevos IDs de ganado, actualizar las relaciones
    if (ganados && Array.isArray(ganados)) {
      // Eliminar relaciones existentes
      await supabaseService.deleteVentaGanadoByVentaId(req.params.id);
      
      // Crear nuevas relaciones
      if (ganados.length > 0) {
        await supabaseService.addGanadosToVenta(req.params.id, ganados);
      }
    }

    // Obtener la venta actualizada con las relaciones
    const ventaCompleta = await supabaseService.getVentaById(req.params.id);

    res.json(ventaCompleta);
  } catch (error) {
    console.error('Error al actualizar venta:', error);
    if (!res.statusCode || res.statusCode === 200) {
      res.status(500);
    }
    throw error;
  }
});

/**
 * @desc    Eliminar venta
 * @route   DELETE /api/ventas/:id
 * @access  Private
 */
const deleteVenta = asyncHandler(async (req, res) => {
  try {
    const result = await supabaseService.deleteVenta(req.params.id);

    if (!result) {
      res.status(404);
      throw new Error('Venta no encontrada');
    }

    res.json({ message: 'Venta eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar venta:', error);
    if (!res.statusCode || res.statusCode === 200) {
      res.status(500);
    }
    throw error;
  }
});

/**
 * @desc    Buscar ventas por comprador
 * @route   GET /api/ventas/comprador/:comprador
 * @access  Private
 */
const getVentasByComprador = asyncHandler(async (req, res) => {
  try {
    const ventas = await supabaseService.getVentasByComprador(req.params.comprador);
    res.json(ventas);
  } catch (error) {
    console.error('Error al buscar ventas por comprador:', error);
    res.status(500);
    throw new Error('Error al buscar ventas por comprador: ' + error.message);
  }
});

/**
 * @desc    Obtener estadísticas de ventas
 * @route   GET /api/ventas/stats
 * @access  Private
 */
const getVentasStats = asyncHandler(async (req, res) => {
  try {
    const stats = await supabaseService.getVentasStats();
    res.json(stats);
  } catch (error) {
    console.error('Error al obtener estadísticas de ventas:', error);
    res.status(500);
    throw new Error('Error al obtener estadísticas de ventas: ' + error.message);
  }
});

/**
 * @desc    Agregar ganado a una venta existente
 * @route   POST /api/ventas/:id/ganado
 * @access  Private
 */
const addGanadoToVenta = asyncHandler(async (req, res) => {
  try {
    const { id_ganado } = req.body;
    
    if (!id_ganado) {
      res.status(400);
      throw new Error('ID de ganado es requerido');
    }

    const relacion = await supabaseService.createVentaGanado({
      id_venta: req.params.id,
      id_ganado: id_ganado
    });

    res.status(201).json(relacion);
  } catch (error) {
    console.error('Error al agregar ganado a venta:', error);
    if (!res.statusCode || res.statusCode === 200) {
      res.status(400);
    }
    throw error;
  }
});

/**
 * @desc    Obtener ganado de una venta
 * @route   GET /api/ventas/:id/ganado
 * @access  Private
 */
const getGanadoFromVenta = asyncHandler(async (req, res) => {
  try {
    const ganados = await supabaseService.getVentaGanadoByVentaId(req.params.id);
    res.json(ganados);
  } catch (error) {
    console.error('Error al obtener ganado de venta:', error);
    res.status(500);
    throw new Error('Error al obtener ganado de venta: ' + error.message);
  }
});

module.exports = {
  getVentas,
  getVentaById,
  createVenta,
  updateVenta,
  deleteVenta,
  getVentasByComprador,
  getVentasStats,
  addGanadoToVenta,
  getGanadoFromVenta
}; 