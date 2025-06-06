const { supabase } = require('../config/supabase');

/**
 * Crea un nuevo medicamento
 * @param {Object} datos - Datos del medicamento
 * @returns {Promise<Object>} - Medicamento creado
 */
const createMedicamento = async (datos) => {
  try {
    const medicamentoData = {
      nombre: datos.nombre,
      dosis: datos.dosis || '',
      horas: datos.horas || ''
    };
    
    const { data, error } = await supabase
      .from('medicamento')
      .insert([medicamentoData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al crear medicamento:', error);
    throw error;
  }
};

/**
 * Obtiene un medicamento por su ID
 * @param {number} id - ID del medicamento
 * @returns {Promise<Object|null>} - Medicamento o null si no existe
 */
const getMedicamentoById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('medicamento')
      .select('*')
      .eq('id_medicamento', id)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al obtener medicamento:', error);
    throw error;
  }
};

/**
 * Actualiza un medicamento
 * @param {number} id - ID del medicamento
 * @param {Object} datos - Datos a actualizar
 * @returns {Promise<Object>} - Medicamento actualizado
 */
const updateMedicamento = async (id, datos) => {
  try {
    const updateData = {
      nombre: datos.nombre,
      dosis: datos.dosis,
      horas: datos.horas
    };
    
    // Eliminar campos undefined
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );
    
    const { data, error } = await supabase
      .from('medicamento')
      .update(updateData)
      .eq('id_medicamento', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al actualizar medicamento:', error);
    throw error;
  }
};

/**
 * Elimina un medicamento
 * @param {number} id - ID del medicamento
 * @returns {Promise<boolean>} - true si se eliminó correctamente
 */
const deleteMedicamento = async (id) => {
  try {
    const { error } = await supabase
      .from('medicamento')
      .delete()
      .eq('id_medicamento', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error al eliminar medicamento:', error);
    throw error;
  }
};

/**
 * Obtiene todos los medicamentos
 * @returns {Promise<Array>} - Lista de medicamentos
 */
const getAllMedicamentos = async () => {
  try {
    const { data, error } = await supabase
      .from('medicamento')
      .select('*')
      .order('nombre', { ascending: true });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al obtener medicamentos:', error);
    throw error;
  }
};

/**
 * Busca medicamentos por nombre o tipo
 * @param {string} termino - Término de búsqueda
 * @returns {Promise<Array>} - Lista de medicamentos encontrados
 */
const searchMedicamentos = async (termino) => {
  try {
    const { data, error } = await supabase
      .from('medicamento')
      .select('*')
      .eq('activo', true)
      .or(`nombre.ilike.%${termino}%,tipo.ilike.%${termino}%,laboratorio.ilike.%${termino}%`)
      .order('nombre', { ascending: true });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al buscar medicamentos:', error);
    throw error;
  }
};

/**
 * Obtiene medicamentos por tipo
 * @param {string} tipo - Tipo de medicamento
 * @returns {Promise<Array>} - Lista de medicamentos del tipo especificado
 */
const getMedicamentosByTipo = async (tipo) => {
  try {
    const { data, error } = await supabase
      .from('medicamento')
      .select('*')
      .eq('activo', true)
      .eq('tipo', tipo)
      .order('nombre', { ascending: true });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al obtener medicamentos por tipo:', error);
    throw error;
  }
};

/**
 * Actualiza el stock de un medicamento
 * @param {number} id - ID del medicamento
 * @param {number} cantidad - Nueva cantidad en stock
 * @returns {Promise<Object>} - Medicamento actualizado
 */
const updateStock = async (id, cantidad) => {
  try {
    const { data, error } = await supabase
      .from('medicamento')
      .update({ 
        stock_disponible: cantidad,
        updated_at: new Date().toISOString()
      })
      .eq('id_medicamento', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al actualizar stock:', error);
    throw error;
  }
};

/**
 * Obtiene medicamentos con stock bajo (menos de 10 unidades)
 * @returns {Promise<Array>} - Lista de medicamentos con stock bajo
 */
const getMedicamentosStockBajo = async () => {
  try {
    const { data, error } = await supabase
      .from('medicamento')
      .select('*')
      .eq('activo', true)
      .lt('stock_disponible', 10)
      .order('stock_disponible', { ascending: true });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al obtener medicamentos con stock bajo:', error);
    throw error;
  }
};

module.exports = {
  createMedicamento,
  getMedicamentoById,
  updateMedicamento,
  deleteMedicamento,
  getAllMedicamentos,
  searchMedicamentos,
  getMedicamentosByTipo,
  updateStock,
  getMedicamentosStockBajo
}; 