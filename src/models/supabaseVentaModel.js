const { supabase } = require('../config/supabase');

/**
 * Crea una nueva venta
 * @param {Object} datos - Datos de la venta
 * @returns {Promise<Object>} - Venta creada
 */
const createVenta = async (datos) => {
  try {
    // Verificar si ya existe un ID secuencial
    const { data: lastVenta, error: countError } = await supabase
      .from('venta')
      .select('id_venta')
      .order('id_venta', { ascending: false })
      .limit(1);
    
    if (countError) {
      throw countError;
    }
    
    let nuevoId = 1;
    if (lastVenta && lastVenta.length > 0) {
      nuevoId = lastVenta[0].id_venta + 1;
    }
    
    // Preparar datos para la inserción
    const ventaData = {
      id_venta: nuevoId,
      cantidad: datos.cantidad || 0,
      precio_unitario: datos.precio_unitario || 0,
      total: datos.total || (datos.cantidad * datos.precio_unitario),
      comprador: datos.comprador || ''
    };
    
    // Insertar en la tabla venta
    const { data, error } = await supabase
      .from('venta')
      .insert(ventaData)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error al crear venta:', error);
    throw error;
  }
};

/**
 * Obtiene una venta por su ID
 * @param {number} id - ID de la venta
 * @returns {Promise<Object|null>} - Venta o null si no existe
 */
const getVentaById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('venta')
      .select(`
        *,
        venta_ganado (
          *,
          ganado (
            id_ganado,
            nombre,
            numero_identificacion,
            precio_compra,
            nota
          )
        )
      `)
      .eq('id_venta', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error al obtener venta por ID:', error);
    throw error;
  }
};

/**
 * Actualiza una venta
 * @param {number} id - ID de la venta
 * @param {Object} datos - Datos actualizados
 * @returns {Promise<Object>} - Venta actualizada
 */
  const updateVenta = async (id, datos) => {
  try {
    const updateData = {
      ...datos
    };
    
    // Remover campos que no deben actualizarse
    delete updateData.id_venta;
    
    const { data, error } = await supabase
      .from('venta')
      .update(updateData)
      .eq('id_venta', id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error al actualizar venta:', error);
    throw error;
  }
};

/**
 * Elimina una venta
 * @param {number} id - ID de la venta
 * @returns {Promise<boolean>} - true si se eliminó correctamente
 */
const deleteVenta = async (id) => {
  try {
    // Primero eliminar las relaciones en venta_ganado
    await supabase
      .from('venta_ganado')
      .delete()
      .eq('id_venta', id);
    
    // Luego eliminar la venta
    const { error } = await supabase
      .from('venta')
      .delete()
      .eq('id_venta', id);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error al eliminar venta:', error);
    throw error;
  }
};

/**
 * Obtiene todas las ventas
 * @returns {Promise<Array>} - Array de ventas
 */
const getAllVentas = async () => {
  try {
    const { data, error } = await supabase
      .from('venta')
      .select(`
        *,
        venta_ganado (
          *,
          ganado (
            id_ganado,
            nombre,
            numero_identificacion,
            precio_compra
          )
        )
      `)
      .order('id_venta', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error al obtener todas las ventas:', error);
    throw error;
  }
};

/**
 * Obtiene ventas por comprador
 * @param {string} comprador - Nombre del comprador
 * @returns {Promise<Array>} - Array de ventas
 */
const getVentasByComprador = async (comprador) => {
  try {
    const { data, error } = await supabase
      .from('venta')
      .select(`
        *,
        venta_ganado (
          *,
          ganado (
            id_ganado,
            nombre,
            numero_identificacion
          )
        )
      `)
      .ilike('comprador', `%${comprador}%`)
      .order('id_venta', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error al obtener ventas por comprador:', error);
    throw error;
  }
};

/**
 * Obtiene estadísticas de ventas
 * @returns {Promise<Object>} - Estadísticas de ventas
 */
const getVentasStats = async () => {
  try {
    const { data, error } = await supabase
      .from('venta')
      .select('total, cantidad, id_venta');
    
    if (error) {
      throw error;
    }
    
    const totalVentas = data.length;
    const totalIngresos = data.reduce((sum, venta) => sum + (venta.total || 0), 0);
    const totalAnimalesVendidos = data.reduce((sum, venta) => sum + (venta.cantidad || 0), 0);
    
    return {
      totalVentas,
      totalIngresos,
      totalAnimalesVendidos,
      promedioVenta: totalVentas > 0 ? totalIngresos / totalVentas : 0
    };
  } catch (error) {
    console.error('Error al obtener estadísticas de ventas:', error);
    throw error;
  }
};

module.exports = {
  createVenta,
  getVentaById,
  updateVenta,
  deleteVenta,
  getAllVentas,
  getVentasByComprador,
  getVentasStats
}; 