const { supabase } = require('../config/supabase');
const userModel = require('../models/supabaseUserModel');
const ganadoModel = require('../models/supabaseGanadoModel');
const fincaModel = require('../models/supabaseFincaModel');

/**
 * Servicio centralizado para operaciones con Supabase
 * Este servicio coordina todos los modelos y proporciona una interfaz unificada
 */
class SupabaseService {
  /**
   * Constructor
   */
  constructor() {
    this.supabase = supabase;
  }

  // ===== SERVICIOS DE USUARIO =====

  /**
   * Registra un nuevo usuario
   * @param {Object} userData - Datos del usuario
   * @returns {Promise<Object>} - Usuario creado
   */
  async registerUser(userData) {
    try {
      return await userModel.createUser(userData);
    } catch (error) {
      console.error('Error en servicio de registro:', error);
      throw error;
    }
  }

  /**
   * Inicia sesión con email y contraseña
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Promise<Object>} - Datos del usuario autenticado
   */
  async loginWithEmailAndPassword(email, password) {
    try {
      return await userModel.signInWithEmail(email, password);
    } catch (error) {
      console.error('Error en servicio de login:', error);
      throw error;
    }
  }

  /**
   * Obtiene un usuario por su ID
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object|null>} - Usuario o null si no existe
   */
  async getUserById(userId) {
    try {
      return await userModel.getUserById(userId);
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      throw error;
    }
  }

  /**
   * Actualiza un usuario
   * @param {string} userId - ID del usuario
   * @param {Object} userData - Datos a actualizar
   * @returns {Promise<Object>} - Usuario actualizado
   */
  async updateUser(userId, userData) {
    try {
      return await userModel.updateUser(userId, userData);
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      throw error;
    }
  }

  /**
   * Elimina un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<boolean>} - true si se eliminó correctamente
   */
  async deleteUser(userId) {
    try {
      return await userModel.deleteUser(userId);
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los usuarios
   * @returns {Promise<Array>} - Lista de usuarios
   */
  async getAllUsers() {
    try {
      return await userModel.getAllUsers();
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      throw error;
    }
  }

  /**
   * Cambia el rol de un usuario
   * @param {string} userId - ID del usuario
   * @param {string} role - Nuevo rol
   * @returns {Promise<Object>} - Usuario actualizado
   */
  async changeUserRole(userId, role) {
    try {
      return await userModel.changeUserRole(userId, role);
    } catch (error) {
      console.error('Error al cambiar rol de usuario:', error);
      throw error;
    }
  }

  // ===== SERVICIOS DE GANADO =====

  /**
   * Crea un nuevo ganado
   * @param {Object} datos - Datos del ganado
   * @returns {Promise<Object>} - Ganado creado
   */
  async createGanado(datos) {
    try {
      return await ganadoModel.createGanado(datos);
    } catch (error) {
      console.error('Error al crear ganado:', error);
      throw error;
    }
  }

  /**
   * Obtiene un ganado por su ID
   * @param {number} id - ID del ganado
   * @returns {Promise<Object|null>} - Ganado o null si no existe
   */
  async getGanadoById(id) {
    try {
      return await ganadoModel.getGanadoById(id);
    } catch (error) {
      console.error('Error al obtener ganado:', error);
      throw error;
    }
  }

  /**
   * Actualiza un ganado
   * @param {number} id - ID del ganado
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>} - Ganado actualizado
   */
  async updateGanado(id, datos) {
    try {
      return await ganadoModel.updateGanado(id, datos);
    } catch (error) {
      console.error('Error al actualizar ganado:', error);
      throw error;
    }
  }

  /**
   * Elimina un ganado
   * @param {number} id - ID del ganado
   * @returns {Promise<boolean>} - true si se eliminó correctamente
   */
  async deleteGanado(id) {
    try {
      return await ganadoModel.deleteGanado(id);
    } catch (error) {
      console.error('Error al eliminar ganado:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los ganados
   * @returns {Promise<Array>} - Lista de ganados
   */
  async getAllGanados() {
    try {
      return await ganadoModel.getAllGanados();
    } catch (error) {
      console.error('Error al obtener ganados:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los ganados con información completa
   * @returns {Promise<Array>} - Lista de ganados con información adicional
   */
  async getAllGanadosWithInfo() {
    try {
      return await ganadoModel.getAllGanadosWithInfo();
    } catch (error) {
      console.error('Error al obtener ganados con información:', error);
      throw error;
    }
  }

  /**
   * Obtiene los ganados por finca
   * @param {number} fincaId - ID de la finca
   * @returns {Promise<Array>} - Lista de ganados de la finca
   */
  async getGanadosByFinca(fincaId) {
    try {
      return await ganadoModel.getGanadosByFinca(fincaId);
    } catch (error) {
      console.error('Error al obtener ganados por finca:', error);
      throw error;
    }
  }

  /**
   * Obtiene los registros médicos de un ganado
   * @param {number} id - ID del ganado
   * @returns {Promise<Array>} - Lista de registros médicos
   */
  async getMedicalRecords(id) {
    try {
      return await ganadoModel.getMedicalRecords(id);
    } catch (error) {
      console.error('Error al obtener registros médicos:', error);
      throw error;
    }
  }

  /**
   * Agrega un registro médico a un ganado
   * @param {number} id - ID del ganado
   * @param {Object} medicalData - Datos del registro médico
   * @returns {Promise<Object>} - Registro médico creado
   */
  async addMedicalRecord(id, medicalData) {
    try {
      return await ganadoModel.addMedicalRecord(id, medicalData);
    } catch (error) {
      console.error('Error al agregar registro médico:', error);
      throw error;
    }
  }

  // ===== SERVICIOS DE FINCA =====

  /**
   * Crea una nueva finca
   * @param {Object} datos - Datos de la finca
   * @returns {Promise<Object>} - Finca creada
   */
  async createFinca(datos) {
    try {
      return await fincaModel.createFinca(datos);
    } catch (error) {
      console.error('Error al crear finca:', error);
      throw error;
    }
  }

  /**
   * Obtiene una finca por su ID
   * @param {number} id - ID de la finca
   * @returns {Promise<Object|null>} - Finca o null si no existe
   */
  async getFincaById(id) {
    try {
      return await fincaModel.getFincaById(id);
    } catch (error) {
      console.error('Error al obtener finca:', error);
      throw error;
    }
  }

  /**
   * Actualiza una finca
   * @param {number} id - ID de la finca
   * @param {Object} datos - Datos a actualizar
   * @returns {Promise<Object>} - Finca actualizada
   */
  async updateFinca(id, datos) {
    try {
      return await fincaModel.updateFinca(id, datos);
    } catch (error) {
      console.error('Error al actualizar finca:', error);
      throw error;
    }
  }

  /**
   * Elimina una finca
   * @param {number} id - ID de la finca
   * @returns {Promise<boolean>} - true si se eliminó correctamente
   */
  async deleteFinca(id) {
    try {
      return await fincaModel.deleteFinca(id);
    } catch (error) {
      console.error('Error al eliminar finca:', error);
      throw error;
    }
  }

  /**
   * Obtiene todas las fincas
   * @returns {Promise<Array>} - Lista de fincas
   */
  async getAllFincas() {
    try {
      return await fincaModel.getAllFincas();
    } catch (error) {
      console.error('Error al obtener fincas:', error);
      throw error;
    }
  }

  /**
   * Obtiene las fincas por propietario
   * @param {number} userId - ID del propietario
   * @returns {Promise<Array>} - Lista de fincas del propietario
   */
  async getFincasByOwner(userId) {
    try {
      return await fincaModel.getFincasByOwner(userId);
    } catch (error) {
      console.error('Error al obtener fincas por propietario:', error);
      throw error;
    }
  }
  /**
   * Obtiene los ganados de una finca
   * @param {number} fincaId - ID de la finca
   * @returns {Promise<Array>} - Lista de ganados de la finca
   */
  async getFincaGanados(fincaId) {
    try {
      console.log(`[SupabaseService] Solicitando ganados para finca ${fincaId}`);
      const result = await fincaModel.getFincaGanados(fincaId);
      return result;
    } catch (error) {
      // Loguear el error con más detalle
      console.error(`[SupabaseService] Error al obtener ganados de la finca ${fincaId}:`, {
        message: error.message,
        stack: error.stack,
        originalError: error
      });

      // Si el error es específico de que la finca no existe, propagarlo
      if (error.message.includes('no existe')) {
        throw error;
      }

      // Para otros errores, devolver array vacío y loguear
      console.warn(`[SupabaseService] Devolviendo array vacío debido a error en finca ${fincaId}`);
      return [];
    }
  }

  /**
   * Obtiene los trabajadores de una finca
   * @param {number} fincaId - ID de la finca
   * @returns {Promise<Array>} - Lista de trabajadores de la finca
   */
  async getFincaTrabajadores(fincaId) {
    try {
      return await fincaModel.getFincaTrabajadores(fincaId);
    } catch (error) {
      console.error('Error al obtener trabajadores de la finca:', error);
      throw error;
    }
  }

  /**
   * Obtiene los veterinarios de una finca
   * @param {number} fincaId - ID de la finca
   * @returns {Promise<Array>} - Lista de veterinarios de la finca
   */
  async getFincaVeterinarios(fincaId) {
    try {
      return await fincaModel.getFincaVeterinarios(fincaId);
    } catch (error) {
      console.error('Error al obtener veterinarios de la finca:', error);
      throw error;
    }
  }

  // ===== MÉTODOS ESPECIALES =====

  /**
   * Verifica que haya conexión con la base de datos
   * @returns {Promise<boolean>} - true si hay conexión
   */
  async testConnection() {
    try {
      const { data, error } = await this.supabase.from('rol').select('*').limit(1);
      
      if (error) {
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error de conexión con Supabase:', error);
      return false;
    }
  }
}

module.exports = new SupabaseService();