const { supabase } = require('../config/supabase');

/**
 * Agrega un medicamento a un tratamiento
 * @param {Object} datos - Datos de la relación tratamiento-medicamento
 * @returns {Promise<Object>} - Relación creada
 */
const addMedicamentoToTratamiento = async (datos) => {
  try {
    const tratamientoMedicamentoData = {
      id_informacion_veterinaria: datos.id_informacion_veterinaria,
      id_medicamento: datos.id_medicamento
    };
    
    const { data, error } = await supabase
      .from('tratamiento_medicamento')
      .insert([tratamientoMedicamentoData])
      .select(`
        *,
        medicamento:id_medicamento (
          id_medicamento,
          nombre,
          dosis,
          horas
        )
      `)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al agregar medicamento al tratamiento:', error);
    throw error;
  }
};

/**
 * Obtiene todos los medicamentos de un tratamiento
 * @param {number} idInformacionVeterinaria - ID de la información veterinaria
 * @returns {Promise<Array>} - Lista de medicamentos del tratamiento
 */
const getMedicamentosByTratamiento = async (idInformacionVeterinaria) => {
  try {
    const { data, error } = await supabase
      .from('tratamiento_medicamento')
      .select(`
        *,
        medicamento:id_medicamento (
          id_medicamento,
          nombre,
          dosis,
          horas
        )
      `)
      .eq('id_informacion_veterinaria', idInformacionVeterinaria);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al obtener medicamentos del tratamiento:', error);
    throw error;
  }
};



/**
 * Elimina un medicamento de un tratamiento
 * @param {number} id - ID de la relación tratamiento-medicamento
 * @returns {Promise<boolean>} - true si se eliminó correctamente
 */
const removeMedicamentoFromTratamiento = async (id) => {
  try {
    const { error } = await supabase
      .from('tratamiento_medicamento')
      .delete()
      .eq('id_tratamiento_medicamento', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error al eliminar medicamento del tratamiento:', error);
    throw error;
  }
};



/**
 * Obtiene todos los tratamientos donde se usa un medicamento específico
 * @param {number} idMedicamento - ID del medicamento
 * @returns {Promise<Array>} - Lista de tratamientos que usan el medicamento
 */
const getTratamientosByMedicamento = async (idMedicamento) => {
  try {
    const { data, error } = await supabase
      .from('tratamiento_medicamento')
      .select(`
        *,
        informacion_veterinaria:id_informacion_veterinaria (
          id_informacion_veterinaria,
          fecha_ini_tratamiento,
          fecha_fin_tratamiento,
          diagnostico,
          tratamiento,
          nota
        )
      `)
      .eq('id_medicamento', idMedicamento);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al obtener tratamientos del medicamento:', error);
    throw error;
  }
};

/**
 * Verifica si un medicamento ya está asignado a un tratamiento
 * @param {number} idInformacionVeterinaria - ID de la información veterinaria
 * @param {number} idMedicamento - ID del medicamento
 * @returns {Promise<boolean>} - true si ya existe la relación
 */
const existeRelacion = async (idInformacionVeterinaria, idMedicamento) => {
  try {
    const { data, error } = await supabase
      .from('tratamiento_medicamento')
      .select('id_tratamiento_medicamento')
      .eq('id_informacion_veterinaria', idInformacionVeterinaria)
      .eq('id_medicamento', idMedicamento)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  } catch (error) {
    console.error('Error al verificar relación:', error);
    throw error;
  }
};

module.exports = {
  addMedicamentoToTratamiento,
  getMedicamentosByTratamiento,
  removeMedicamentoFromTratamiento,
  getTratamientosByMedicamento,
  existeRelacion
}; 