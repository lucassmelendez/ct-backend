const { supabase } = require('../config/supabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const premiumModel = require('./supabasePremiumModel');

/**
 * Crea un nuevo usuario en Supabase
 * @param {Object} userData - Datos del usuario
 * @returns {Promise<Object>} - Usuario creado
 */
const createUser = async (userData) => {
  try {
    // Normalizar el email a minúsculas
    const normalizedEmail = userData.email.toLowerCase();
    
    // Determinar el nombre completo
    let displayName = userData.name;
    let primerNombre = userData.primer_nombre;
    let segundoNombre = userData.segundo_nombre || '';
    let primerApellido = userData.primer_apellido;
    let segundoApellido = userData.segundo_apellido || '';
    
    // Convertir is_premium a id_premium (por defecto Free = 1)
    let id_premium = 1; // Free por defecto
    if (userData.is_premium !== undefined) {
      id_premium = premiumModel.convertIsPremiumToId(userData.is_premium);
    } else if (userData.id_premium !== undefined) {
      id_premium = userData.id_premium;
    }
    
    // Si existen los campos de nombre individuales pero no el nombre completo
    if (!displayName && (primerNombre || primerApellido)) {
      displayName = [primerNombre, segundoNombre, primerApellido, segundoApellido]
        .filter(Boolean)
        .join(' ');
    } 
    // Si existe solo el nombre completo, extraer los componentes
    else if (displayName && (!primerNombre && !primerApellido)) {
      const nombreCompleto = displayName.split(' ');
      primerNombre = nombreCompleto[0] || '';
      segundoNombre = nombreCompleto.length > 2 ? nombreCompleto[1] : '';
      primerApellido = nombreCompleto.length > 1 ? 
        (nombreCompleto.length > 2 ? nombreCompleto[2] : nombreCompleto[1]) : '';
      segundoApellido = nombreCompleto.length > 3 ? nombreCompleto[3] : '';
    }
    
    // Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: userData.password,
      options: {
        data: {
          full_name: displayName,
          role: userData.role || 'user'
        }
      }
    });
    
    if (authError) {
      console.error('Error al crear usuario en Supabase Auth:', authError);
      throw authError;
    }
    
    // Extraer el UUID generado
    const uid = authData.user.id;
    
    // Verificar si el usuario ya existe en la tabla usuario
    const { data: existingUser, error: checkError } = await supabase
      .from('usuario')
      .select('id_usuario')
      .eq('id_autentificar', uid)
      .maybeSingle();
      
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error al verificar usuario existente:', checkError);
      throw checkError;
    }
    
    if (existingUser) {
      console.log('Usuario ya existe en la tabla usuario, saltando inserción');
      return {
        uid,
        email: normalizedEmail,
        primer_nombre: primerNombre,
        segundo_nombre: segundoNombre,
        primer_apellido: primerApellido,
        segundo_apellido: segundoApellido,
        role: userData.role || 'user'
      };
    }
    
    // Primero verificar que la tabla autentificar tenga este usuario
    const { data: authCheck, error: authCheckError } = await supabase
      .from('autentificar')
      .select('id_autentificar')
      .eq('id_autentificar', uid)
      .maybeSingle();
    
    if (authCheckError) {
      console.error('Error al verificar autentificar:', authCheckError);
    }
    
    if (!authCheck) {
      // Insertar en autentificar si no existe
      const { error: authInsertError } = await supabase
        .from('autentificar')
        .insert({
          id_autentificar: uid,
          correo: normalizedEmail,
          contrasena: '' // No guardamos la contraseña real
        });
      
      if (authInsertError) {
        console.error('Error al insertar en autentificar:', authInsertError);
        throw authInsertError;
      }
    }
    
    // Determinar el id_rol basado en el role
    let id_rol = 2;
    if (userData.role === 'admin') id_rol = 1;
    else if (userData.role === 'veterinario') id_rol = 3;
    
    // Guardar información adicional en la tabla usuario
    const { data: profileData, error: profileError } = await supabase
      .from('usuario')
      .insert({
        primer_nombre: primerNombre,
        segundo_nombre: segundoNombre,
        primer_apellido: primerApellido,
        segundo_apellido: segundoApellido,
        id_rol: id_rol,
        id_autentificar: uid,
        id_premium: id_premium
      })
      .select()
      .single();
    
    if (profileError) {
      console.error('Error al guardar datos adicionales del usuario:', profileError);
      console.error('Datos que intentamos insertar:', {
        primer_nombre: primerNombre,
        segundo_nombre: segundoNombre,
        primer_apellido: primerApellido,
        segundo_apellido: segundoApellido,
        id_rol: id_rol,
        id_autentificar: uid,
        id_premium: id_premium,
        id_autentificar_tipo: typeof uid
      });
      
      // Si hay error al guardar el perfil, intentamos eliminar el usuario de Auth
      try {
        // No podemos usar admin.deleteUser, pero podemos registrar el error
        console.error('Error al crear perfil de usuario. Se creó la autenticación pero no se pudo crear el perfil.');
        // En este punto, el usuario ya se creó en Auth pero no pudo crearse su perfil
        // Un administrador debería limpiar esto manualmente
      } catch (deleteError) {
        console.error('Error adicional:', deleteError);
      }
      
      throw profileError;
    }
    
    return {
      uid,
      email: normalizedEmail,
      ...profileData
    };
  } catch (error) {
    console.error('Error al crear usuario:', error);
    throw error;
  }
};

/**
 * Obtiene un usuario por su ID
 * @param {string} uid - ID del usuario
 * @returns {Promise<Object|null>} - Usuario o null si no existe
 */
const getUserById = async (uid) => {
  try {
    const { data, error } = await supabase
      .from('usuario')
      .select(`
        *,
        rol:rol(*),
        premium:premium(*)
      `)
      .eq('id_autentificar', uid)
      .single();
    
    if (error) {
      console.error('Error al obtener usuario:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    throw error;
  }
};

/**
 * Inicia sesión con email y contraseña
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña del usuario
 * @returns {Promise<Object>} - Datos del usuario autenticado
 */
const signInWithEmail = async (email, password) => {
  try {
    const normalizedEmail = email.toLowerCase();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: password
    });
    
    if (error) {
      console.error('Error al iniciar sesión:', error);
      throw error;
    }
    
    // Obtener datos adicionales del usuario
    const { data: userData, error: userError } = await supabase
      .from('usuario')
      .select(`
        *,
        rol:rol(*)
      `)
      .eq('id_autentificar', data.user.id)
      .single();
    
    if (userError) {
      console.error('Error al obtener datos del usuario:', userError);
      throw userError;
    }
    
    // Convertir el rol a formato compatible con la app existente
    let role = 'user';
    if (userData.rol && userData.rol.id_rol) {
      if (userData.rol.id_rol === 1) role = 'admin';
      else if (userData.rol.id_rol === 3) role = 'veterinario';
    }
    
    return {
      uid: data.user.id,
      email: data.user.email,
      token: data.session.access_token,
      role,
      name: `${userData.primer_nombre} ${userData.primer_apellido}`,
      primer_nombre: userData.primer_nombre,
      segundo_nombre: userData.segundo_nombre,
      primer_apellido: userData.primer_apellido,
      segundo_apellido: userData.segundo_apellido,
      id_usuario: userData.id_usuario,
      id_rol: userData.id_rol,
      rol: userData.rol
    };
  } catch (error) {
    console.error('Error en servicio de login:', error);
    throw error;
  }
};

/**
 * Actualiza un usuario
 * @param {string} uid - ID del usuario
 * @param {Object} userData - Datos a actualizar
 * @returns {Promise<Object>} - Usuario actualizado
 */
const updateUser = async (uid, userData) => {
  try {
    // Buscar el usuario por id_autentificar
    const { data: userFind, error: findError } = await supabase
      .from('usuario')
      .select('id_usuario')
      .eq('id_autentificar', uid)
      .single();
    
    if (findError) {
      throw findError;
    }
    
    const userId = userFind.id_usuario;
    const updateData = { ...userData };
    
    // Manejar conversión de is_premium a id_premium
    if ('is_premium' in updateData) {
      updateData.id_premium = premiumModel.convertIsPremiumToId(updateData.is_premium);
      delete updateData.is_premium;
    } else if ('id_premium' in updateData) {
      updateData.id_premium = parseInt(updateData.id_premium) || 1;
    }
    
    // Para correo y contraseña, necesitamos otra estrategia porque updateUser requiere sesión
    
    // Si se actualiza el correo, actualizarlo en la tabla autentificar
    if (userData.email) {
      const { error: emailUpdateError } = await supabase
        .from('autentificar')
        .update({ correo: userData.email })
        .eq('id_autentificar', uid);
      
      if (emailUpdateError) {
        throw emailUpdateError;
      }
      
      // Eliminar email de los datos a actualizar en la tabla usuario
      delete updateData.email;
    }
    
    // Para la contraseña, no podemos actualizarla sin una sesión de autenticación
    // El usuario tendrá que usar la funcionalidad de "olvidé mi contraseña"
    if (userData.password) {
      console.log('No se puede actualizar la contraseña sin una sesión activa. El usuario debe usar "Olvidé mi contraseña"');
      delete updateData.password;
    }
    
    // Si se actualiza el rol
    if (userData.role) {
      let id_rol = 2; // Por defecto user
      if (userData.role === 'admin') id_rol = 1;
      else if (userData.role === 'veterinario') id_rol = 3;
      
      updateData.id_rol = id_rol;
      delete updateData.role;
    }
    
    // Eliminar campos que no pertenecen a la tabla usuario
    delete updateData.created_at;
    delete updateData.updated_at;
    
    // Si no hay datos para actualizar en la tabla usuario, devolver lo que tenemos
    if (Object.keys(updateData).length === 0) {
      // Obtener datos actuales del usuario
      const { data: currentUserData, error: getUserError } = await supabase
        .from('usuario')
        .select(`
          *,
          rol:rol(*),
          premium:premium(*)
        `)
        .eq('id_usuario', userId)
        .single();
        
      if (getUserError) {
        throw getUserError;
      }
      
      // Obtener email actual desde autentificar
      const { data: authData, error: authError } = await supabase
        .from('autentificar')
        .select('correo')
        .eq('id_autentificar', uid)
        .single();
        
      // Determinar rol del usuario
      let role = 'user';
      if (currentUserData.rol && currentUserData.rol.id_rol) {
        if (currentUserData.rol.id_rol === 1) role = 'admin';
        else if (currentUserData.rol.id_rol === 3) role = 'veterinario';
      }
      
      return {
        uid,
        id_usuario: userId,
        email: userData.email || (authData ? authData.correo : ''),
        role,
        primer_nombre: currentUserData.primer_nombre,
        segundo_nombre: currentUserData.segundo_nombre,
        primer_apellido: currentUserData.primer_apellido,
        segundo_apellido: currentUserData.segundo_apellido,
        id_premium: currentUserData.id_premium || 1,
        is_premium: premiumModel.convertIdToIsPremium(currentUserData.id_premium || 1),
        premium_type: currentUserData.premium ? currentUserData.premium.descripcion : 'Free'
      };
    }
    
    // Actualizar datos en la tabla usuario
    const { data, error } = await supabase
      .from('usuario')
      .update(updateData)
      .eq('id_usuario', userId)
      .select(`
        *,
        rol:rol(*),
        premium:premium(*)
      `)
      .single();
    
    if (error) {
      throw error;
    }
    
    // Obtener email actualizado desde autentificar
    const { data: authData } = await supabase
      .from('autentificar')
      .select('correo')
      .eq('id_autentificar', uid)
      .single();
    
    // Determinar rol del usuario
    let role = 'user';
    if (data.rol && data.rol.id_rol) {
      if (data.rol.id_rol === 1) role = 'admin';
      else if (data.rol.id_rol === 3) role = 'veterinario';
    }
    
    return {
      uid,
      id_usuario: userId,
      email: userData.email || (authData ? authData.correo : ''),
      role,
      primer_nombre: data.primer_nombre,
      segundo_nombre: data.segundo_nombre,
      primer_apellido: data.primer_apellido,
      segundo_apellido: data.segundo_apellido,
      id_premium: data.id_premium || 1,
      is_premium: premiumModel.convertIdToIsPremium(data.id_premium || 1),
      premium_type: data.premium ? data.premium.descripcion : 'Free'
    };
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    throw error;
  }
};

/**
 * Elimina un usuario
 * @param {string} uid - ID del usuario
 * @returns {Promise<boolean>} - true si se eliminó correctamente
 */
const deleteUser = async (uid) => {
  try {
    // Buscar el usuario por id_autentificar
    const { data: userFind, error: findError } = await supabase
      .from('usuario')
      .select('id_usuario')
      .eq('id_autentificar', uid)
      .single();
    
    if (findError) {
      throw findError;
    }
    
    const userId = userFind.id_usuario;
    
    // Eliminar de la tabla usuario
    const { error: profileError } = await supabase
      .from('usuario')
      .delete()
      .eq('id_usuario', userId);
    
    if (profileError) {
      throw profileError;
    }
    
    // En lugar de eliminar el usuario en auth, simplemente cerramos su sesión
    // ya que eliminar requiere permisos de administrador
    const { error: signOutError } = await supabase.auth.signOut();
    
    if (signOutError) {
      console.error('Error al cerrar sesión del usuario:', signOutError);
      // No lanzamos error aquí para no impedir la operación
    }
    
    return true;
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    throw error;
  }
};

/**
 * Obtiene todos los usuarios
 * @returns {Promise<Array>} - Lista de usuarios
 */
const getAllUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('usuario')
      .select(`
        *,
        rol:rol(*),
        autentificar:autentificar(*),
        premium:premium(*)
      `);
    
    if (error) {
      throw error;
    }
    
    // Formatear para compatibilidad con la app
    return data.map(user => {
      let role = 'user';
      if (user.rol && user.rol.id_rol) {
        if (user.rol.id_rol === 1) role = 'admin';
        else if (user.rol.id_rol === 3) role = 'veterinario';
      }
      
      return {
        uid: user.id_autentificar,
        id_usuario: user.id_usuario,
        email: user.autentificar ? user.autentificar.correo : '',
        role,
        name: `${user.primer_nombre} ${user.primer_apellido}`,
        primer_nombre: user.primer_nombre,
        segundo_nombre: user.segundo_nombre,
        primer_apellido: user.primer_apellido,
        segundo_apellido: user.segundo_apellido,
        id_premium: user.id_premium || 1,
        is_premium: premiumModel.convertIdToIsPremium(user.id_premium || 1),
        premium_type: user.premium ? user.premium.descripcion : 'Free'
      };
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    throw error;
  }
};

/**
 * Cambia el rol de un usuario
 * @param {string} uid - ID del usuario
 * @param {string} role - Nuevo rol
 * @returns {Promise<Object>} - Usuario actualizado
 */
const changeUserRole = async (uid, role) => {
  try {
    // Mapear el rol a id_rol
    let id_rol = 2; // Por defecto user
    if (role === 'admin') id_rol = 1;
    else if (role === 'veterinario') id_rol = 3;
    
    // Buscar el usuario por id_autentificar
    const { data: userFind, error: findError } = await supabase
      .from('usuario')
      .select('id_usuario')
      .eq('id_autentificar', uid)
      .single();
    
    if (findError) {
      throw findError;
    }
    
    const userId = userFind.id_usuario;
    
    // Actualizar en la tabla usuario
    const { data, error } = await supabase
      .from('usuario')
      .update({ id_rol })
      .eq('id_usuario', userId)
      .select(`
        *,
        rol:rol(*),
        autentificar:autentificar(*),
        premium:premium(*)
      `)
      .single();
    
    if (error) {
      throw error;
    }
    
    // No intentamos actualizar los metadatos de auth porque requiere permisos de admin
    
    // Formatear la respuesta
    let roleStr = 'user';
    if (data.rol && data.rol.id_rol) {
      if (data.rol.id_rol === 1) roleStr = 'admin';
      else if (data.rol.id_rol === 2) roleStr = 'user';
      else if (data.rol.id_rol === 3) roleStr = 'veterinario';
    }
    
    return {
      uid: data.id_autentificar,
      id_usuario: data.id_usuario,
      email: data.autentificar ? data.autentificar.correo : '',
      role: roleStr,
      name: `${data.primer_nombre} ${data.primer_apellido}`,
      primer_nombre: data.primer_nombre,
      segundo_nombre: data.segundo_nombre,
      primer_apellido: data.primer_apellido,
      segundo_apellido: data.segundo_apellido,
      id_premium: data.id_premium || 1,
      is_premium: premiumModel.convertIdToIsPremium(data.id_premium || 1),
      premium_type: data.premium ? data.premium.descripcion : 'Free'
    };
  } catch (error) {
    console.error('Error al cambiar rol de usuario:', error);
    throw error;
  }
};

/**
 * Obtiene un usuario por su ID de autenticación
 * @param {string} authId - ID de autenticación (id_autentificar)
 * @returns {Promise<Object|null>} - Usuario o null si no existe
 */
const getUserByAuthId = async (authId) => {
  try {
    const { data, error } = await supabase
      .from('usuario')
      .select(`
        *,
        rol:rol(*),
        premium:premium(*)
      `)
      .eq('id_autentificar', authId)
      .single();
    
    if (error) {
      console.error('Error al obtener usuario por id_autentificar:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error al obtener usuario por id_autentificar:', error);
    throw error;
  }
};

/**
 * Actualiza el tipo de premium de un usuario
 * @param {string} uid - ID del usuario
 * @param {number} idPremium - ID del tipo de premium (1: Free, 2: Premium)
 * @returns {Promise<Object>} - Usuario actualizado
 */
const updateUserPremium = async (uid, idPremium) => {
  try {
    // Validar que el id_premium sea válido
    if (![1, 2].includes(idPremium)) {
      throw new Error('ID de premium inválido. Debe ser 1 (Free) o 2 (Premium)');
    }
    
    // Buscar el usuario por id_autentificar
    const { data: userFind, error: findError } = await supabase
      .from('usuario')
      .select('id_usuario')
      .eq('id_autentificar', uid)
      .single();
    
    if (findError) {
      throw findError;
    }
    
    const userId = userFind.id_usuario;
    
    // Actualizar el tipo de premium
    const { data, error } = await supabase
      .from('usuario')
      .update({ id_premium: idPremium })
      .eq('id_usuario', userId)
      .select(`
        *,
        rol:rol(*),
        premium:premium(*)
      `)
      .single();
    
    if (error) {
      throw error;
    }
    
    // Obtener email desde autentificar
    const { data: authData } = await supabase
      .from('autentificar')
      .select('correo')
      .eq('id_autentificar', uid)
      .single();
    
    // Determinar rol del usuario
    let role = 'user';
    if (data.rol && data.rol.id_rol) {
      if (data.rol.id_rol === 1) role = 'admin';
      else if (data.rol.id_rol === 3) role = 'veterinario';
    }
    
    return {
      uid: data.id_autentificar,
      id_usuario: data.id_usuario,
      email: authData ? authData.correo : '',
      role,
      primer_nombre: data.primer_nombre,
      segundo_nombre: data.segundo_nombre,
      primer_apellido: data.primer_apellido,
      segundo_apellido: data.segundo_apellido,
      id_premium: data.id_premium,
      is_premium: premiumModel.convertIdToIsPremium(data.id_premium),
      premium_type: data.premium ? data.premium.descripcion : 'Free'
    };
  } catch (error) {
    console.error('Error al actualizar premium de usuario:', error);
    throw error;
  }
};

module.exports = {
  createUser,
  getUserById,
  signInWithEmail,
  updateUser,
  deleteUser,
  getAllUsers,
  changeUserRole,
  getUserByAuthId,
  updateUserPremium
}; 