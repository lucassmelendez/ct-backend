const { supabase } = require('../config/supabase');

/**
 * Obtiene todos los tipos de premium disponibles
 * @returns {Promise<Array>} - Lista de tipos de premium
 */
const getAllPremiumTypes = async () => {
  try {
    const { data, error } = await supabase
      .from('premium')
      .select('*')
      .order('id_premium', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error al obtener tipos de premium:', error);
    throw error;
  }
};

/**
 * Obtiene un tipo de premium por su ID
 * @param {number} id - ID del tipo de premium
 * @returns {Promise<Object|null>} - Tipo de premium o null si no existe
 */
const getPremiumTypeById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('premium')
      .select('*')
      .eq('id_premium', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No encontrado
      }
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error al obtener tipo de premium:', error);
    throw error;
  }
};

/**
 * Obtiene un tipo de premium por su descripción
 * @param {string} descripcion - Descripción del tipo de premium
 * @returns {Promise<Object|null>} - Tipo de premium o null si no existe
 */
const getPremiumTypeByDescription = async (descripcion) => {
  try {
    const { data, error } = await supabase
      .from('premium')
      .select('*')
      .eq('descripcion', descripcion)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No encontrado
      }
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error al obtener tipo de premium por descripción:', error);
    throw error;
  }
};

/**
 * Inicializa la tabla premium con los valores por defecto
 * @returns {Promise<void>}
 */
const initializePremiumTypes = async () => {
  try {
    // Verificar si ya existen datos
    const { data: existingData, error: checkError } = await supabase
      .from('premium')
      .select('id_premium')
      .limit(1);
    
    if (checkError) {
      throw checkError;
    }
    
    // Si ya hay datos, no hacer nada
    if (existingData && existingData.length > 0) {
      console.log('La tabla premium ya está inicializada');
      return;
    }
    
    // Insertar los tipos de premium por defecto
    const premiumTypes = [
      { id_premium: 1, descripcion: 'Free' },
      { id_premium: 2, descripcion: 'Premium' }
    ];
    
    const { error: insertError } = await supabase
      .from('premium')
      .insert(premiumTypes);
    
    if (insertError) {
      throw insertError;
    }
    
    console.log('Tabla premium inicializada correctamente');
  } catch (error) {
    console.error('Error al inicializar tipos de premium:', error);
    throw error;
  }
};

/**
 * Convierte el valor booleano is_premium a id_premium
 * @param {number|boolean} isPremium - Valor booleano o numérico de is_premium
 * @returns {number} - ID de premium (1 para Free, 2 para Premium)
 */
const convertIsPremiumToId = (isPremium) => {
  // Si es 0, false, null o undefined -> Free (1)
  // Si es 1, true o cualquier valor truthy -> Premium (2)
  return isPremium ? 2 : 1;
};

/**
 * Convierte el id_premium a valor booleano is_premium
 * @param {number} idPremium - ID de premium
 * @returns {number} - Valor booleano (0 para Free, 1 para Premium)
 */
const convertIdToIsPremium = (idPremium) => {
  // 1 (Free) -> 0, 2 (Premium) -> 1
  return idPremium === 2 ? 1 : 0;
};

module.exports = {
  getAllPremiumTypes,
  getPremiumTypeById,
  getPremiumTypeByDescription,
  initializePremiumTypes,
  convertIsPremiumToId,
  convertIdToIsPremium
}; 