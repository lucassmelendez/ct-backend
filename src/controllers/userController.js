const asyncHandler = require('express-async-handler');
const supabaseUserModel = require('../models/supabaseUserModel');
const authService = require('../services/supabaseAuthService');
const { supabase } = require('../config/supabase');

const registerUser = asyncHandler(async (req, res) => {
  // Depurar los datos recibidos completos
  console.log('Cuerpo completo de la solicitud:', req.body);

  const { 
    name, email, password, role,
    primer_nombre, segundo_nombre, primer_apellido, segundo_apellido 
  } = req.body;

  // Depurar los datos recibidos
  console.log('Datos de registro recibidos:', {
    name, 
    email, 
    password: password ? '[REDACTADO]' : undefined,
    role,
    primer_nombre, 
    segundo_nombre, 
    primer_apellido, 
    segundo_apellido
  });

  // Verificación más detallada de campos requeridos
  const validacionCampos = {
    tieneNombre: !!name,
    tienePrimerNombre: !!primer_nombre,
    tienePrimerApellido: !!primer_apellido,
    tieneEmail: !!email,
    tienePassword: !!password
  };
  
  console.log('Validación de campos:', validacionCampos);
  
  // Comprobar si tenemos al menos un nombre y un apellido o un nombre completo
  if ((!name && (!primer_nombre || !primer_apellido)) || !email || !password) {
    console.log('Validación fallida:', validacionCampos);
    
    // Mensaje más específico según lo que falte
    let mensajeError = 'Por favor ingrese los campos requeridos:';
    if (!email) mensajeError += ' email,';
    if (!password) mensajeError += ' contraseña,';
    if (!name && !primer_nombre) mensajeError += ' nombre,';
    if (!name && !primer_apellido) mensajeError += ' apellido,';
    
    // Eliminar la última coma
    mensajeError = mensajeError.slice(0, -1);
    
    res.status(400);
    throw new Error(mensajeError);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error('Por favor ingrese un correo electrónico válido');
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error('La contraseña debe tener al menos 6 caracteres');
  }

  try {
    const userData = {
      email: email.toLowerCase(),
      password,
      role: role || 'user',
    };

    // Datos de nombre que vamos a utilizar
    if (primer_nombre || primer_apellido) {
      userData.primer_nombre = primer_nombre;
      userData.segundo_nombre = segundo_nombre || '';
      userData.primer_apellido = primer_apellido;
      userData.segundo_apellido = segundo_apellido || '';
      console.log('Usando campos de nombre separados');
    } else if (name) {
      userData.name = name;
      console.log('Usando nombre completo');
    }

    console.log('Datos a enviar a authService.registerUser:', userData);
    
    // Verificación final
    if (((!userData.primer_nombre || !userData.primer_apellido) && !userData.name) || !userData.email || !userData.password) {
      console.error('Faltan datos críticos para el registro:', {
        tienePrimerNombre: !!userData.primer_nombre,
        tienePrimerApellido: !!userData.primer_apellido,
        tieneName: !!userData.name,
        tieneEmail: !!userData.email,
        tienePassword: !!userData.password
      });
      res.status(400);
      throw new Error('Por favor ingrese todos los campos requeridos');
    }
    
    try {
      const user = await authService.registerUser(userData);
      
      console.log('Usuario creado con éxito:', {
        uid: user.uid,
        email: user.email,
        role: user.role
      });

      const userResponse = {
        uid: user.uid,
        email: user.email,
        role: user.role,
        primer_nombre: user.primer_nombre || '',
        segundo_nombre: user.segundo_nombre || '',
        primer_apellido: user.primer_apellido || '',
        segundo_apellido: user.segundo_apellido || '',
        id_usuario: user.uid,
        name: user.name || `${user.primer_nombre} ${user.primer_apellido}`,
        token: user.token
      };

      console.log('Enviando respuesta de registro:', userResponse);
      res.status(201).json(userResponse);
    } catch (error) {
      console.error('Error en authService.registerUser:', error);
      
      // Detectar y manejar errores específicos de Supabase
      if (error.code === 'PGRST204' || error.message?.includes('created_at')) {
        console.error('Error de estructura de la base de datos. Es posible que falten columnas en la tabla.');
        res.status(500);
        throw new Error('Error en la configuración del servidor. Por favor contacte al administrador.');
      }
      
      throw error; // Propagar otros errores
    }
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    
    if (error.code === 'auth/email-already-exists') {
      res.status(400);
      throw new Error('El correo electrónico ya está registrado');
    } else if (error.code === 'auth/invalid-email') {
      res.status(400);
      throw new Error('El formato del correo electrónico es inválido');
    } else if (error.code === 'auth/weak-password') {
      res.status(400);
      throw new Error('La contraseña es demasiado débil');
    } else if (error.message) {
      // Si ya tiene un mensaje de error específico, lo usamos
      res.status(res.statusCode === 200 ? 500 : res.statusCode);
      throw new Error(error.message);
    } else {
      res.status(500);
      throw new Error('Error al registrar usuario. Por favor intente de nuevo más tarde.');
    }
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Por favor ingrese correo y contraseña');
  }

  try {
    const authResult = await authService.loginWithEmailAndPassword(email, password);
    
    res.json(authResult);
  } catch (error) {
    console.error('Error en inicio de sesión:', error);
    
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      res.status(401);
      throw new Error('Credenciales incorrectas. Por favor, verifica tu email y contraseña.');
    } else if (error.code === 'auth/invalid-email') {
      res.status(400);
      throw new Error('El formato del email es inválido.');
    } else if (error.code === 'auth/user-disabled') {
      res.status(403);
      throw new Error('Esta cuenta ha sido deshabilitada.');
    } else if (error.code === 'auth/too-many-requests') {
      res.status(429);
      throw new Error('Demasiados intentos fallidos. Inténtalo más tarde.');
    } else {
      res.status(500);
      throw new Error('Error al iniciar sesión. Por favor, inténtalo de nuevo.');
    }
  }
});

const getUserProfile = asyncHandler(async (req, res) => {
  try {
    const user = await supabaseUserModel.getUserById(req.user.uid);
    
    if (user) {
      // Obtener email desde la tabla autentificar
      const { data: authData, error: authError } = await supabase
        .from('autentificar')
        .select('correo')
        .eq('id_autentificar', req.user.uid)
        .single();
      
      if (authError) {
        console.error('Error al obtener datos de autentificación:', authError);
      }
      
      // Determinar rol del usuario
      let role = 'user';
      let id_rol = 2; // Default: trabajador
      
      if (user.rol && user.rol.id_rol) {
        id_rol = user.rol.id_rol;
        if (user.rol.id_rol === 1) role = 'admin';
        else if (user.rol.id_rol === 3) role = 'veterinario';
        else if (user.rol.id_rol === 2) role = 'user'; // trabajador
      }
      
      res.json({
        uid: user.id_autentificar,
        name: `${user.primer_nombre} ${user.primer_apellido}`,
        email: authData ? authData.correo : '',
        role: role,
        id_rol: id_rol, // Agregar el id_rol numérico
        primer_nombre: user.primer_nombre || '',
        segundo_nombre: user.segundo_nombre || '',
        primer_apellido: user.primer_apellido || '',
        segundo_apellido: user.segundo_apellido || '',
        id_usuario: user.id_usuario,
        id_premium: user.id_premium || 1,
        is_premium: user.id_premium === 2 ? 1 : 0,
        premium_type: user.premium ? user.premium.descripcion : 'Free'
      });
    } else {
      res.status(404);
      throw new Error('Usuario no encontrado');
    }
  } catch (error) {
    res.status(500);
    throw new Error('Error al obtener perfil de usuario: ' + error.message);
  }
});

const updateUserProfile = asyncHandler(async (req, res) => {
  try {
    const { 
      name, email, password,
      primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
      is_premium, id_premium
    } = req.body;
    
    const updateData = {};
    if (email) updateData.email = email;
    if (password) updateData.password = password;
    
    // Manejar premium
    if (id_premium !== undefined) {
      updateData.id_premium = id_premium;
    } else if (is_premium !== undefined) {
      updateData.is_premium = is_premium;
    }
    
    if (primer_nombre || primer_apellido) {
      updateData.primer_nombre = primer_nombre;
      updateData.segundo_nombre = segundo_nombre || '';
      updateData.primer_apellido = primer_apellido;
      updateData.segundo_apellido = segundo_apellido || '';
    } else if (name) {
      updateData.name = name;
    }
    
    const updatedUser = await supabaseUserModel.updateUser(req.user.uid, updateData);
    
    // Obtener el rol del usuario actualizado
    let role = 'user';
    let id_rol = 2; // Default: trabajador
    
    if (updatedUser.id_rol) {
      id_rol = updatedUser.id_rol;
      if (updatedUser.id_rol === 1) role = 'admin';
      else if (updatedUser.id_rol === 3) role = 'veterinario';
      else if (updatedUser.id_rol === 2) role = 'user'; // trabajador
    }
    
    res.json({
      uid: updatedUser.uid || updatedUser.id_autentificar,
      email: updatedUser.email || '',
      role: role,
      id_rol: id_rol, // Agregar el id_rol numérico
      primer_nombre: updatedUser.primer_nombre || '',
      segundo_nombre: updatedUser.segundo_nombre || '',
      primer_apellido: updatedUser.primer_apellido || '',
      segundo_apellido: updatedUser.segundo_apellido || '',
      id_usuario: updatedUser.id_usuario,
      id_premium: updatedUser.id_premium || 1,
      is_premium: updatedUser.is_premium || 0,
      premium_type: updatedUser.premium_type || 'Free'
    });
  } catch (error) {
    res.status(500);
    throw new Error('Error al actualizar perfil: ' + error.message);
  }
});

const getUsers = asyncHandler(async (req, res) => {
  try {
    const users = await supabaseUserModel.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500);
    throw new Error('Error al obtener usuarios: ' + error.message);
  }
});

const changeUserRole = asyncHandler(async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;
    
    if (!role) {
      res.status(400);
      throw new Error('Por favor especifique el rol');
    }
    
    const validRoles = ['user', 'admin', 'trabajador', 'veterinario'];
    if (!validRoles.includes(role)) {
      res.status(400);
      throw new Error('Rol inválido');
    }
    
    const updatedUser = await supabaseUserModel.changeUserRole(userId, role);
    
    res.json({
      uid: updatedUser.uid,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role
    });
  } catch (error) {
    res.status(500);
    throw new Error('Error al cambiar rol de usuario: ' + error.message);
  }
});

/**
 * @desc    Refrescar token de autenticación
 * @route   POST /api/users/refresh-token
 * @access  Private
 */
const refreshToken = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.uid;
    
    const newToken = await authService.refreshToken(userId);
    
    res.json({
      token: newToken
    });
  } catch (error) {
    console.error('Error al refrescar token:', error);
    res.status(500);
    throw new Error('Error al refrescar token de autenticación');
  }
});

/**
 * Actualiza el tipo de premium de un usuario
 */
const updateUserPremium = asyncHandler(async (req, res) => {
  try {
    const { id_premium } = req.body;
    
    if (!id_premium || ![1, 2].includes(parseInt(id_premium))) {
      res.status(400);
      throw new Error('ID de premium inválido. Debe ser 1 (Free) o 2 (Premium)');
    }
    
    const updatedUser = await supabaseUserModel.updateUserPremium(req.user.uid, parseInt(id_premium));
    
    res.json({
      success: true,
      message: `Usuario actualizado a ${updatedUser.premium_type} exitosamente`,
      user: {
        uid: updatedUser.uid,
        id_premium: updatedUser.id_premium,
        is_premium: updatedUser.is_premium,
        premium_type: updatedUser.premium_type
      }
    });
  } catch (error) {
    res.status(500);
    throw new Error('Error al actualizar premium: ' + error.message);
  }
});

/**
 * Obtiene los tipos de premium disponibles
 */
const getPremiumTypes = asyncHandler(async (req, res) => {
  try {
    const premiumModel = require('../models/supabasePremiumModel');
    const premiumTypes = await premiumModel.getAllPremiumTypes();
    
    res.json({
      success: true,
      data: premiumTypes
    });
  } catch (error) {
    res.status(500);
    throw new Error('Error al obtener tipos de premium: ' + error.message);
  }
});

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  changeUserRole,
  refreshToken,
  updateUserPremium,
  getPremiumTypes
};