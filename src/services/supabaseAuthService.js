const { supabase } = require('../config/supabase');
const userModel = require('../models/supabaseUserModel');

/**
 * Servicio centralizado de autenticación con Supabase
 */
class SupabaseAuthService {
  /**
   * Registra un nuevo usuario
   * @param {Object} userData - Datos del usuario a registrar
   * @returns {Promise<Object>} - Usuario registrado
   */
  async registerUser(userData) {
    try {
      console.log('supabaseAuthService.registerUser - Datos recibidos:', {
        email: userData.email,
        primer_nombre: userData.primer_nombre,
        primer_apellido: userData.primer_apellido,
        role: userData.role
      });
      
      // Normalizar email y datos de nombre
      const normalizedData = {
        ...userData,
        email: userData.email.toLowerCase()
      };
      
      // Asegurar que se incluyan los nombres apropiados
      if (!normalizedData.name && (normalizedData.primer_nombre || normalizedData.primer_apellido)) {
        // Reconstruir el campo name para mantener compatibilidad
        normalizedData.name = [
          normalizedData.primer_nombre || '',
          normalizedData.segundo_nombre || '',
          normalizedData.primer_apellido || '',
          normalizedData.segundo_apellido || ''
        ].filter(Boolean).join(' ');
        
        console.log('Nombre reconstruido desde campos separados:', normalizedData.name);
      }
      
      // Crear usuario usando el modelo
      console.log('Enviando datos finales al modelo:', {
        email: normalizedData.email,
        name: normalizedData.name,
        primer_nombre: normalizedData.primer_nombre,
        primer_apellido: normalizedData.primer_apellido
      });
      
      try {
        // Verificar primero si la estructura de la base de datos es correcta
        const { data: checkData, error: checkError } = await supabase
          .from('usuario')
          .select('*')
          .limit(1);
          
        if (checkError) {
          console.error('Error al verificar estructura de tabla usuario:', checkError);
          throw checkError;
        }
        
        const user = await userModel.createUser(normalizedData);
        return user;
      } catch (error) {
        console.error('Error en el proceso de registro:', error);
        
        // Verificar si es un error relacionado con la estructura de la tabla
        if (error.code === 'PGRST204' || 
            (error.message && error.message.includes('created_at'))) {
          console.error('Posible problema con la estructura de la tabla usuario.');
          
          // Crear respuesta de error más descriptiva
          const enhancedError = new Error('Error en la estructura de la base de datos. Por favor aplique las actualizaciones necesarias.');
          enhancedError.code = 'DB_STRUCTURE_ERROR';
          enhancedError.details = error.message;
          throw enhancedError;
        }
        
        throw error;
      }
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
      const normalizedEmail = email.toLowerCase();
      
      // Autenticar usuario usando el modelo
      const userAuth = await userModel.signInWithEmail(normalizedEmail, password);
      
      if (!userAuth) {
        throw new Error('Error de autenticación');
      }
      
      // Devolver los datos del usuario con el token
      return {
        uid: userAuth.uid,
        email: userAuth.email,
        role: userAuth.role,
        name: userAuth.name || '',
        primer_nombre: userAuth.primer_nombre || '',
        segundo_nombre: userAuth.segundo_nombre || '',
        primer_apellido: userAuth.primer_apellido || '',
        segundo_apellido: userAuth.segundo_apellido || '',
        id_usuario: userAuth.id_usuario,
        token: userAuth.token
      };
    } catch (error) {
      console.error('Error en servicio de login:', error);
      throw error;
    }
  }

  /**
   * Verifica la validez de un token y obtiene los datos del usuario
   * @param {string} token - Token de autenticación
   * @returns {Promise<Object>} - Datos del usuario autenticado
   */
  async verifyToken(token) {
    try {
      const { data, error } = await supabase.auth.getUser(token);
      
      if (error || !data.user) {
        throw new Error('Token inválido o expirado');
      }
      
      // Obtener información adicional del usuario desde la base de datos
      const userData = await userModel.getUserById(data.user.id);
      
      if (!userData) {
        throw new Error('Usuario no encontrado');
      }
      
      return {
        uid: data.user.id,
        ...userData
      };
    } catch (error) {
      console.error('Error al verificar token:', error);
      throw error;
    }
  }

  /**
   * Refresca el token de un usuario
   * @param {string} refreshToken - Token de refresco
   * @returns {Promise<string>} - Nuevo token de acceso
   */
  async refreshToken(refreshToken) {
    try {
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken
      });
      
      if (error) {
        throw error;
      }
      
      return data.session.access_token;
    } catch (error) {
      console.error('Error al refrescar token:', error);
      throw error;
    }
  }

  /**
   * Cierra la sesión del usuario
   * @returns {Promise<void>}
   */
  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  }
}

module.exports = new SupabaseAuthService(); 