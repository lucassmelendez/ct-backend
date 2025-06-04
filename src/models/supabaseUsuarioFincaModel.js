const { supabase } = require('../config/supabase');

/**
 * Asocia un usuario a una finca
 * @param {number} idUsuario - ID del usuario
 * @param {number} idFinca - ID de la finca
 * @returns {Promise<Object>} - Relación creada
 */
const asociarUsuarioFinca = async (idUsuario, idFinca) => {
  try {
    // Verificar si ya existe esta relación
    const { data: existingRelation, error: checkError } = await supabase
      .from('usuario_finca')
      .select('id_usuario_finca')
      .eq('id_usuario', idUsuario)
      .eq('id_finca', idFinca)
      .maybeSingle();
      
    if (checkError) {
      console.error('Error al verificar relación usuario-finca:', checkError);
      throw checkError;
    }
    
    // Si ya existe, no hacemos nada
    if (existingRelation) {
      return existingRelation;
    }
    
    // Si no existe, crear una nueva relación
    const { data, error } = await supabase
      .from('usuario_finca')
      .insert({
        id_usuario: idUsuario,
        id_finca: idFinca
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error al crear relación usuario-finca:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error en asociarUsuarioFinca:', error);
    throw error;
  }
};

/**
 * Elimina la asociación entre un usuario y una finca
 * @param {number} idUsuario - ID del usuario
 * @param {number} idFinca - ID de la finca
 * @returns {Promise<boolean>} - true si se eliminó correctamente
 */
const desasociarUsuarioFinca = async (idUsuario, idFinca) => {
  try {
    const { error } = await supabase
      .from('usuario_finca')
      .delete()
      .eq('id_usuario', idUsuario)
      .eq('id_finca', idFinca);
      
    if (error) {
      console.error('Error al eliminar relación usuario-finca:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error en desasociarUsuarioFinca:', error);
    throw error;
  }
};

/**
 * Obtiene todas las fincas asociadas a un usuario
 * @param {number} idUsuario - ID del usuario
 * @returns {Promise<Array>} - Lista de fincas
 */
const getFincasByUsuario = async (idUsuario) => {
  try {
    const { data, error } = await supabase
      .from('usuario_finca')
      .select(`
        finca:finca(*)
      `)
      .eq('id_usuario', idUsuario);
      
    if (error) {
      console.error('Error al obtener fincas del usuario:', error);
      throw error;
    }
    
    // Formatear los datos para el frontend
    return data.map(item => ({
      ...item.finca,
      _id: item.finca.id_finca.toString(),
      name: item.finca.nombre,
      size: item.finca.tamano
    }));
  } catch (error) {
    console.error('Error en getFincasByUsuario:', error);
    throw error;
  }
};

/**
 * Obtiene todos los usuarios asociados a una finca
 * @param {number} idFinca - ID de la finca
 * @returns {Promise<Array>} - Lista de usuarios
 */
const getUsuariosByFinca = async (idFinca) => {
  try {
    const { data, error } = await supabase
      .from('usuario_finca')
      .select(`
        usuario:usuario(
          id_usuario,
          primer_nombre,
          segundo_nombre,
          primer_apellido,
          segundo_apellido,
          id_autentificar,
          id_rol,
          rol:rol(*)
        )
      `)
      .eq('id_finca', idFinca);
      
    if (error) {
      console.error('Error al obtener usuarios de la finca:', error);
      throw error;
    }
    
    // Formatear los datos para el frontend
    return data
      .filter(item => item.usuario) // Asegurarnos de que el usuario existe
      .map(item => ({
        ...item.usuario,
        nombre_completo: `${item.usuario.primer_nombre} ${item.usuario.primer_apellido}`
      }));
  } catch (error) {
    console.error('Error en getUsuariosByFinca:', error);
    throw error;
  }
};

/**
 * Obtiene propietarios de una finca 
 * @param {number} idFinca - ID de la finca
 * @returns {Promise<Array>} - Lista de usuarios propietarios
 */
const getPropietariosByFinca = async (idFinca) => {
  try {
    // Como no tenemos columna de rol, buscamos por el id_usuario del propietario original
    // que está almacenado en la tabla finca
    const { data: finca, error: fincaError } = await supabase
      .from('finca')
      .select('id_usuario')
      .eq('id_finca', idFinca)
      .single();
    
    if (fincaError) {
      console.error('Error al obtener finca:', fincaError);
      throw fincaError;
    }
    
    if (!finca || !finca.id_usuario) {
      return [];
    }
    
    // Buscar el usuario que corresponde al propietario
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuario')
      .select(`
        id_usuario,
        primer_nombre,
        segundo_nombre,
        primer_apellido,
        segundo_apellido,
        id_autentificar,
        rol:rol(*)
      `)
      .eq('id_usuario', finca.id_usuario)
      .single();
      
    if (usuarioError) {
      console.error('Error al obtener usuario propietario:', usuarioError);
      throw usuarioError;
    }
    
    if (!usuario) {
      return [];
    }
    
    return [{
      ...usuario,
      nombre_completo: `${usuario.primer_nombre} ${usuario.primer_apellido}`,
      rol_finca: 'propietario'
    }];
  } catch (error) {
    console.error('Error en getPropietariosByFinca:', error);
    throw error;
  }
};

module.exports = {
  asociarUsuarioFinca,
  desasociarUsuarioFinca,
  getFincasByUsuario,
  getUsuariosByFinca,
  getPropietariosByFinca
}; 