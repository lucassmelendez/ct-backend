const { supabase } = require('../config/supabase');
const crypto = require('crypto');

// Almacenamiento en memoria para códigos de vinculación
// Estructura: { código: { fincaId, tipo, createdAt, expiresAt } }
const codigosVinculacion = new Map();

/**
 * Genera un código aleatorio de 6 caracteres alfanuméricos
 * @returns {string} - Código generado
 */
const generarCodigo = () => {
  // Generar 3 bytes aleatorios (suficiente para 6 caracteres alfanuméricos)
  const bytes = crypto.randomBytes(3);
  // Convertir a string hexadecimal y tomar los primeros 6 caracteres
  return bytes.toString('hex').toUpperCase().substring(0, 6);
};

/**
 * Crea un nuevo código de vinculación para una finca
 * @param {number} idFinca - ID de la finca
 * @param {string} tipo - Tipo de usuario ('trabajador' o 'veterinario')
 * @param {number} [duracionMinutos=60] - Duración del código en minutos
 * @returns {Promise<Object>} - Objeto con el código generado
 */
const crearCodigoVinculacion = async (idFinca, tipo, duracionMinutos = 60) => {
  try {
    // Verificar que la finca existe
    const { data: finca, error } = await supabase
      .from('finca')
      .select('id_finca')
      .eq('id_finca', idFinca)
      .single();
    
    if (error || !finca) {
      throw new Error(`La finca con ID ${idFinca} no existe`);
    }
    
    // Verificar que el tipo es válido
    const tiposValidos = ['trabajador', 'veterinario'];
    if (!tiposValidos.includes(tipo)) {
      throw new Error(`Tipo de usuario inválido. Debe ser: ${tiposValidos.join(' o ')}`);
    }
    
    // Generar código único
    let codigo;
    do {
      codigo = generarCodigo();
    } while (codigosVinculacion.has(codigo));
    
    // Calcular fecha de expiración
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + duracionMinutos * 60000);
    
    // Guardar código en memoria
    codigosVinculacion.set(codigo, {
      idFinca,
      tipo,
      createdAt,
      expiresAt
    });
    
    // Programar eliminación automática al expirar
    setTimeout(() => {
      codigosVinculacion.delete(codigo);
      console.log(`Código de vinculación ${codigo} expirado y eliminado`);
    }, duracionMinutos * 60000);
    
    return {
      codigo,
      idFinca,
      tipo,
      expiraEn: expiresAt
    };
  } catch (error) {
    console.error('Error al crear código de vinculación:', error);
    throw error;
  }
};

/**
 * Verifica un código de vinculación y asocia el usuario a la finca
 * @param {string} codigo - Código de vinculación
 * @param {string} idUsuario - ID del usuario a vincular
 * @returns {Promise<Object>} - Datos de la vinculación realizada
 */
const verificarYVincular = async (codigo, idUsuario) => {
  try {
    // Verificar que el código existe y no ha expirado
    if (!codigosVinculacion.has(codigo)) {
      throw new Error('Código de vinculación inválido o expirado');
    }
    
    const infoVinculacion = codigosVinculacion.get(codigo);
    
    // Verificar que no ha expirado
    if (infoVinculacion.expiresAt < new Date()) {
      codigosVinculacion.delete(codigo);
      throw new Error('Código de vinculación expirado');
    }
    
    // Verificar que el usuario existe
    const { data: usuario, error: userError } = await supabase
      .from('usuario')
      .select('id_usuario, id_rol, rol:rol(*)')
      .eq('id_autentificar', idUsuario)
      .single();
    
    if (userError || !usuario) {
      throw new Error('Usuario no encontrado');
    }
    
    // Verificar que el usuario tiene el rol adecuado según el tipo de vinculación
    let rolValido = false;
    if (infoVinculacion.tipo === 'trabajador' && usuario.id_rol === 2) { // rol 'user'
      rolValido = true;
    } else if (infoVinculacion.tipo === 'veterinario' && usuario.id_rol === 3) { // rol 'veterinario'
      rolValido = true;
    }
    
    if (!rolValido) {
      throw new Error(`El usuario no tiene el rol de ${infoVinculacion.tipo} requerido para esta vinculación`);
    }
    
    // Asociar usuario a la finca
    const { data: vinculacion, error: vincError } = await supabase
      .from('usuario_finca')
      .upsert({
        id_usuario: usuario.id_usuario,
        id_finca: infoVinculacion.idFinca
      })
      .select()
      .single();
    
    if (vincError) {
      throw vincError;
    }
    
    // Eliminar el código después de usarlo
    codigosVinculacion.delete(codigo);
    
    return {
      idUsuario: usuario.id_usuario,
      idFinca: infoVinculacion.idFinca,
      tipo: infoVinculacion.tipo,
      vinculacion
    };
  } catch (error) {
    console.error('Error al verificar código de vinculación:', error);
    throw error;
  }
};

/**
 * Obtiene todos los códigos de vinculación activos para una finca
 * @param {number} idFinca - ID de la finca
 * @returns {Array} - Lista de códigos activos
 */
const getCodigosActivosByFinca = (idFinca) => {
  const codigosActivos = [];
  
  for (const [codigo, info] of codigosVinculacion.entries()) {
    if (info.idFinca == idFinca && info.expiresAt > new Date()) {
      codigosActivos.push({
        codigo,
        tipo: info.tipo,
        creado: info.createdAt,
        expira: info.expiresAt
      });
    }
  }
  
  return codigosActivos;
};

/**
 * Elimina un código de vinculación
 * @param {string} codigo - Código a eliminar
 * @param {number} idFinca - ID de la finca (para verificación)
 * @returns {boolean} - true si se eliminó, false si no existía
 */
const eliminarCodigo = (codigo, idFinca) => {
  if (!codigosVinculacion.has(codigo)) {
    return false;
  }
  
  const info = codigosVinculacion.get(codigo);
  
  // Verificar que el código pertenece a la finca especificada
  if (info.idFinca != idFinca) {
    return false;
  }
  
  return codigosVinculacion.delete(codigo);
};

module.exports = {
  crearCodigoVinculacion,
  verificarYVincular,
  getCodigosActivosByFinca,
  eliminarCodigo
}; 