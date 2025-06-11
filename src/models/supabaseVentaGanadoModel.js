const { supabase } = require('../config/supabase');

/**
 * Crea una nueva relación venta-ganado
 * @param {Object} datos - Datos de la relación
 * @returns {Promise<Object>} - Relación creada
 */
const createVentaGanado = async (datos) => {
  try {
    // Verificar si ya existe un ID secuencial
    const { data: lastVentaGanado, error: countError } = await supabase
      .from('venta_ganado')
      .select('id_venta_ganado')
      .order('id_venta_ganado', { ascending: false })
      .limit(1);
    
    if (countError) {
      throw countError;
    }
    
    let nuevoId = 1;
    if (lastVentaGanado && lastVentaGanado.length > 0) {
      nuevoId = lastVentaGanado[0].id_venta_ganado + 1;
    }
    
    // Preparar datos para la inserción
    const ventaGanadoData = {
      id_venta_ganado: nuevoId,
      id_venta: datos.id_venta,
      id_ganado: datos.id_ganado,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Insertar en la tabla venta_ganado
    const { data, error } = await supabase
      .from('venta_ganado')
      .insert(ventaGanadoData)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error al crear relación venta-ganado:', error);
    throw error;
  }
};

/**
 * Obtiene una relación venta-ganado por su ID
 * @param {number} id - ID de la relación
 * @returns {Promise<Object|null>} - Relación o null si no existe
 */
const getVentaGanadoById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('venta_ganado')
      .select(`
        *,
        venta (
          id_venta,
          cantidad,
          precio_unitario,
          total,
          comprador,
          created_at
        ),
        ganado (
          id_ganado,
          nombre,
          numero_identificacion,
          precio_compra,
          nota
        )
      `)
      .eq('id_venta_ganado', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error al obtener relación venta-ganado por ID:', error);
    throw error;
  }
};

/**
 * Obtiene todas las relaciones de una venta específica
 * @param {number} ventaId - ID de la venta
 * @returns {Promise<Array>} - Array de relaciones
 */
const getVentaGanadoByVentaId = async (ventaId) => {
  try {
    const { data, error } = await supabase
      .from('venta_ganado')
      .select(`
        *,
        ganado (
          id_ganado,
          nombre,
          numero_identificacion,
          precio_compra,
          nota
        )
      `)
      .eq('id_venta', ventaId);
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error al obtener ganado de venta:', error);
    throw error;
  }
};

/**
 * Obtiene todas las ventas de un ganado específico
 * @param {number} ganadoId - ID del ganado
 * @returns {Promise<Array>} - Array de relaciones
 */
const getVentaGanadoByGanadoId = async (ganadoId) => {
  try {
    const { data, error } = await supabase
      .from('venta_ganado')
      .select(`
        *,
        venta (
          id_venta,
          cantidad,
          precio_unitario,
          total,
          comprador,
          created_at
        )
      `)
      .eq('id_ganado', ganadoId);
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error al obtener ventas de ganado:', error);
    throw error;
  }
};

/**
 * Elimina una relación venta-ganado
 * @param {number} id - ID de la relación
 * @returns {Promise<boolean>} - true si se eliminó correctamente
 */
const deleteVentaGanado = async (id) => {
  try {
    const { error } = await supabase
      .from('venta_ganado')
      .delete()
      .eq('id_venta_ganado', id);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error al eliminar relación venta-ganado:', error);
    throw error;
  }
};

/**
 * Elimina todas las relaciones de una venta
 * @param {number} ventaId - ID de la venta
 * @returns {Promise<boolean>} - true si se eliminaron correctamente
 */
const deleteVentaGanadoByVentaId = async (ventaId) => {
  try {
    const { error } = await supabase
      .from('venta_ganado')
      .delete()
      .eq('id_venta', ventaId);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error al eliminar relaciones de venta:', error);
    throw error;
  }
};

/**
 * Agrega múltiples ganados a una venta
 * @param {number} ventaId - ID de la venta
 * @param {Array} ganadoIds - Array de IDs de ganado
 * @returns {Promise<Array>} - Array de relaciones creadas
 */
const addGanadosToVenta = async (ventaId, ganadoIds) => {
  try {
    const relaciones = [];
    
    for (const ganadoId of ganadoIds) {
      const relacion = await createVentaGanado({
        id_venta: ventaId,
        id_ganado: ganadoId
      });
      relaciones.push(relacion);
    }
    
    return relaciones;
  } catch (error) {
    console.error('Error al agregar ganados a venta:', error);
    throw error;
  }
};

/**
 * Verifica si un ganado ya está en una venta
 * @param {number} ventaId - ID de la venta
 * @param {number} ganadoId - ID del ganado
 * @returns {Promise<boolean>} - true si ya existe la relación
 */
const existsVentaGanado = async (ventaId, ganadoId) => {
  try {
    const { data, error } = await supabase
      .from('venta_ganado')
      .select('id_venta_ganado')
      .eq('id_venta', ventaId)
      .eq('id_ganado', ganadoId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    return !!data;
  } catch (error) {
    console.error('Error al verificar existencia de relación:', error);
    throw error;
  }
};

/**
 * Obtiene todas las relaciones venta-ganado
 * @returns {Promise<Array>} - Array de relaciones
 */
const getAllVentaGanado = async () => {
  try {
    const { data, error } = await supabase
      .from('venta_ganado')
      .select(`
        *,
        venta (
          id_venta,
          cantidad,
          precio_unitario,
          total,
          comprador,
          created_at
        ),
        ganado (
          id_ganado,
          nombre,
          numero_identificacion,
          precio_compra
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error al obtener todas las relaciones venta-ganado:', error);
    throw error;
  }
};

module.exports = {
  createVentaGanado,
  getVentaGanadoById,
  getVentaGanadoByVentaId,
  getVentaGanadoByGanadoId,
  deleteVentaGanado,
  deleteVentaGanadoByVentaId,
  addGanadosToVenta,
  existsVentaGanado,
  getAllVentaGanado
}; 