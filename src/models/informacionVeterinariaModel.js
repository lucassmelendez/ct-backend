const { supabase } = require('../config/supabase');

/**
 * Crea una nueva información veterinaria
 * @param {Object} datos - Datos de la información veterinaria
 * @returns {Promise<Object>} - Información veterinaria creada
 */
const createInformacionVeterinaria = async (datos) => {
  try {
    // Preparar los datos según la estructura de la tabla
    const informacionVeterinariaData = {
      fecha_tratamiento: datos.fecha_tratamiento || new Date().toISOString(),
      diagnostico: datos.diagnostico || '',
      tratamiento: datos.tratamiento || '',
      nota: datos.nota || ''
    };
    
    const { data, error } = await supabase
      .from('informacion_veterinaria')
      .insert([informacionVeterinariaData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al crear información veterinaria:', error);
    throw error;
  }
};

/**
 * Obtiene una información veterinaria por su ID
 * @param {number} id - ID de la información veterinaria
 * @returns {Promise<Object|null>} - Información veterinaria o null si no existe
 */
const getInformacionVeterinariaById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('informacion_veterinaria')
      .select('*')
      .eq('id_informacion_veterinaria', id)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al obtener información veterinaria:', error);
    throw error;
  }
};

/**
 * Actualiza una información veterinaria
 * @param {number} id - ID de la información veterinaria
 * @param {Object} datos - Datos a actualizar
 * @returns {Promise<Object>} - Información veterinaria actualizada
 */
const updateInformacionVeterinaria = async (id, datos) => {
  try {
    const updateData = {
      fecha_tratamiento: datos.fecha_tratamiento,
      diagnostico: datos.diagnostico,
      tratamiento: datos.tratamiento,
      nota: datos.nota
    };
    
    // Eliminar campos undefined
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );
    
    const { data, error } = await supabase
      .from('informacion_veterinaria')
      .update(updateData)
      .eq('id_informacion_veterinaria', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al actualizar información veterinaria:', error);
    throw error;
  }
};

/**
 * Elimina una información veterinaria
 * @param {number} id - ID de la información veterinaria
 * @returns {Promise<boolean>} - true si se eliminó correctamente
 */
const deleteInformacionVeterinaria = async (id) => {
  try {
    const { error } = await supabase
      .from('informacion_veterinaria')
      .delete()
      .eq('id_informacion_veterinaria', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error al eliminar información veterinaria:', error);
    throw error;
  }
};

/**
 * Obtiene todas las informaciones veterinarias
 * @returns {Promise<Array>} - Lista de informaciones veterinarias
 */
const getAllInformacionesVeterinarias = async () => {
  try {
    const { data, error } = await supabase
      .from('informacion_veterinaria')
      .select('*')
      .order('id_informacion_veterinaria', { ascending: true });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al obtener informaciones veterinarias:', error);
    throw error;
  }
};

module.exports = {
  createInformacionVeterinaria,
  getInformacionVeterinariaById,
  updateInformacionVeterinaria,
  deleteInformacionVeterinaria,
  getAllInformacionesVeterinarias
}; 