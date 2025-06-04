const { supabase } = require('../config/supabase');
const usuarioFincaModel = require('./supabaseUsuarioFincaModel');

/**
 * Crea una nueva finca
 * @param {Object} datos - Datos de la finca
 * @returns {Promise<Object>} - Finca creada
 */
const createFinca = async (datos) => {
  try {
    // Verificar si ya existe un ID secuencial
    const { data: lastFinca, error: countError } = await supabase
      .from('finca')
      .select('id_finca')
      .order('id_finca', { ascending: false })
      .limit(1);
    
    if (countError) {
      throw countError;
    }
    
    let nuevoId = 1;
    if (lastFinca && lastFinca.length > 0) {
      nuevoId = lastFinca[0].id_finca + 1;
    }
    
    // Preparar datos para la inserción
    const fincaData = {
      id_finca: nuevoId,
      nombre: datos.nombre,
      tamano: datos.tamano || 0
    };
    
    // Insertar en la tabla finca
    const { data, error } = await supabase
      .from('finca')
      .insert(fincaData)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    // Si hay información de propietario, crear la relación en la tabla usuario_finca
    if (datos.propietario_id) {
      let idUsuario;
      
      // Si el ID del propietario es un UUID, buscar su id_usuario correspondiente
      if (datos.propietario_id.includes('-')) {
        const { data: usuario, error: userError } = await supabase
          .from('usuario')
          .select('id_usuario')
          .eq('id_autentificar', datos.propietario_id)
          .single();
          
        if (userError) {
          console.error('Error al buscar id_usuario:', userError);
          throw userError;
        }
        
        if (usuario) {
          idUsuario = usuario.id_usuario;
        }
      } else {
        // Si ya es un número, usarlo directamente
        idUsuario = parseInt(datos.propietario_id);
      }
      
      if (idUsuario) {
        // Crear la relación en la tabla usuario_finca
        try {
          await usuarioFincaModel.asociarUsuarioFinca(idUsuario, data.id_finca);
        } catch (error) {
          console.error('Error al crear relación usuario-finca:', error);
          // No fallamos aquí, continuamos con la creación de la finca
        }
      }
    }
    
    // Devolver los datos con formato para compatibilidad
    return {
      ...data,
      name: data.nombre,
      size: data.tamano
    };
  } catch (error) {
    console.error('Error al crear finca:', error);
    throw error;
  }
};

/**
 * Obtiene una finca por su ID
 * @param {number} id - ID de la finca
 * @returns {Promise<Object|null>} - Finca o null si no existe
 */
const getFincaById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('finca')
      .select('*')
      .eq('id_finca', id)
      .single();
    
    if (error) {
      console.error('Error al obtener finca:', error);
      return null;
    }
    
    if (data) {
      return {
        ...data,
        _id: data.id_finca.toString(),
        name: data.nombre,
        size: data.tamano
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error al obtener finca:', error);
    throw error;
  }
};

/**
 * Actualiza una finca
 * @param {number} id - ID de la finca
 * @param {Object} datos - Datos a actualizar
 * @returns {Promise<Object>} - Finca actualizada
 */
const updateFinca = async (id, datos) => {
  try {
    // Verificar si la finca existe
    const { data: finca, error: checkError } = await supabase
      .from('finca')
      .select('id_finca')
      .eq('id_finca', id)
      .single();
    
    if (checkError || !finca) {
      throw new Error(`La finca con ID ${id} no existe`);
    }
    
    // Preparar datos para actualizar
    const updateData = { ...datos };
    
    // Si hay información de área en formato diferente
    if (datos.area && !datos.tamano) {
      updateData.tamano = datos.area;
      delete updateData.area;
    }
    
    // Si hay información de propietario, actualizar la relación en usuario_finca
    if (datos.propietario_id) {
      let idUsuario;
      
      // Si el ID del propietario es un UUID, buscar su id_usuario correspondiente
      if (datos.propietario_id.includes('-')) {
        const { data: usuario, error: userError } = await supabase
          .from('usuario')
          .select('id_usuario')
          .eq('id_autentificar', datos.propietario_id)
          .single();
          
        if (userError) {
          console.error('Error al buscar id_usuario:', userError);
          throw userError;
        }
        
        if (usuario) {
          idUsuario = usuario.id_usuario;
          
          // Intentar crear la relación en usuario_finca
          try {
            await usuarioFincaModel.asociarUsuarioFinca(idUsuario, id);
          } catch (error) {
            console.error('Error al actualizar relación usuario-finca:', error);
          }
        }
      }
      
      // No incluimos propietario_id en los datos a actualizar
      delete updateData.propietario_id;
    }
    
    // Actualizar finca
    const { data, error } = await supabase
      .from('finca')
      .update(updateData)
      .eq('id_finca', id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error al actualizar finca:', error);
    throw error;
  }
};

/**
 * Elimina una finca
 * @param {number} id - ID de la finca
 * @returns {Promise<boolean>} - true si se eliminó correctamente
 */
const deleteFinca = async (id) => {
  try {
    // Primero actualizar ganados asociados para quitar la relación
    const { error: updateError } = await supabase
      .from('ganado')
      .update({ id_finca: null })
      .eq('id_finca', id);
    
    if (updateError) {
      console.error('Error al desasociar ganados:', updateError);
    }
    
    // Eliminar relaciones en usuario_finca
    try {
      const { error: relError } = await supabase
        .from('usuario_finca')
        .delete()
        .eq('id_finca', id);
      
      if (relError) {
        console.error('Error al eliminar relaciones usuario-finca:', relError);
      }
    } catch (relError) {
      console.error('Error al eliminar relaciones usuario-finca:', relError);
    }
    
    // Finalmente eliminar la finca
    const { error } = await supabase
      .from('finca')
      .delete()
      .eq('id_finca', id);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error al eliminar finca:', error);
    throw error;
  }
};

/**
 * Obtiene todas las fincas
 * @returns {Promise<Array>} - Lista de fincas
 */
const getAllFincas = async () => {
  try {
    const { data, error } = await supabase
      .from('finca')
      .select('*')
      .order('id_finca');
    
    if (error) {
      throw error;
    }
    
    // Formatear los datos para el frontend
    const formattedFincas = data.map(finca => ({
      ...finca,
      _id: finca.id_finca.toString(),
      name: finca.nombre,
      size: finca.tamano
    }));
    
    // Para cada finca, buscar sus propietarios (si existen)
    for (const finca of formattedFincas) {
      try {
        const propietarios = await buscarPropietariosFinca(finca.id_finca);
        if (propietarios && propietarios.length > 0) {
          finca.propietario = {
            id: propietarios[0].id_autentificar,
            id_usuario: propietarios[0].id_usuario,
            name: `${propietarios[0].primer_nombre} ${propietarios[0].primer_apellido}`
          };
        }
      } catch (err) {
        console.error(`Error al buscar propietarios para finca ${finca.id_finca}:`, err);
      }
    }
    
    return formattedFincas;
  } catch (error) {
    console.error('Error al obtener todas las fincas:', error);
    throw error;
  }
};

/**
 * Función auxiliar para buscar propietarios de una finca
 * @param {number} fincaId - ID de la finca
 * @returns {Promise<Array>} - Lista de usuarios asociados
 */
const buscarPropietariosFinca = async (fincaId) => {
  try {
    // Buscamos usuarios asociados a la finca en la tabla usuario_finca
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
          id_rol
        )
      `)
      .eq('id_finca', fincaId);
    
    if (error) {
      throw error;
    }
    
    // Filtramos para quedarnos con los usuarios que existen
    return data
      .filter(item => item.usuario)
      .map(item => item.usuario);
  } catch (error) {
    console.error(`Error en buscarPropietariosFinca para finca ${fincaId}:`, error);
    return [];
  }
};

/**
 * Obtiene las fincas asociadas a un usuario
 * @param {string} userId - ID del usuario (id_autentificar)
 * @returns {Promise<Array>} - Lista de fincas
 */
const getFincasByOwner = async (userId) => {
  try {
    // Primero obtener el id_usuario a partir del id_autentificar
    const { data: usuario, error: userError } = await supabase
      .from('usuario')
      .select('id_usuario')
      .eq('id_autentificar', userId)
      .single();
    
    if (userError) {
      console.error('Error al buscar id_usuario:', userError);
      throw userError;
    }
    
    if (!usuario) {
      throw new Error(`Usuario con ID ${userId} no encontrado`);
    }
    
    // Usar el modelo de usuario_finca para obtener las fincas del usuario
    return await usuarioFincaModel.getFincasByUsuario(usuario.id_usuario);
  } catch (error) {
    console.error('Error al obtener fincas del propietario:', error);
    throw error;
  }
};

/**
 * Obtiene los ganados de una finca
 * @param {number} fincaId - ID de la finca
 * @returns {Promise<Array>} - Lista de ganados de la finca
 */
const getFincaGanados = async (fincaId) => {
  try {
    // Validación estricta del ID de finca
    if (!fincaId) {
      console.error('getFincaGanados: ID de finca no proporcionado');
      throw new Error('ID de finca es requerido');
    }

    // Asegurar que el ID es un número
    const numericFincaId = Number(fincaId);
    if (isNaN(numericFincaId)) {
      console.error(`getFincaGanados: ID de finca inválido: "${fincaId}"`);
      throw new Error('ID de finca debe ser un número');
    }

    console.log(`getFincaGanados: Consultando finca ${numericFincaId}`);
    
    // Verificar si la finca existe
    const { data: finca, error: fincaError } = await supabase
      .from('finca')
      .select('id_finca, nombre')
      .eq('id_finca', numericFincaId)
      .single();
      
    if (fincaError) {
      console.error(`getFincaGanados: Error al verificar finca ${numericFincaId}:`, fincaError);
      throw new Error(`Error al verificar finca: ${fincaError.message}`);
    }
    
    if (!finca) {
      console.error(`getFincaGanados: La finca ${numericFincaId} no existe en la base de datos`);
      throw new Error(`La finca ${numericFincaId} no existe`);
    }
    
    console.log(`getFincaGanados: Finca ${numericFincaId} (${finca.nombre}) encontrada, buscando ganado...`);

    // Consultar ganado con todas las relaciones
    const { data, error } = await supabase
      .from('ganado')
      .select(`
        *,
        finca:finca(*),
        informacion_veterinaria:informacion_veterinaria(*),
        produccion:produccion(*),
        estado_salud:estado_salud(*),
        genero:genero(*)
      `)
      .eq('id_finca', numericFincaId)
      .order('id_ganado');
    
    if (error) {
      console.error(`getFincaGanados: Error en la consulta de ganado para finca ${numericFincaId}:`, error);
      throw new Error(`Error al consultar ganado: ${error.message}`);
    }
    
    const cattleCount = data ? data.length : 0;
    console.log(`getFincaGanados: Encontrados ${cattleCount} ganados para finca ${numericFincaId}`);
    
    // Asegurar que siempre devolvemos un array
    return data || [];
  } catch (error) {
    console.error(`getFincaGanados: Error general al obtener ganados de la finca ${fincaId}:`, error);
    throw error; // Propagar el error para que sea manejado en capas superiores
  }
};

/**
 * Obtiene todos los trabajadores de una finca
 * @param {number} fincaId - ID de la finca
 * @returns {Promise<Array>} - Lista de usuarios con rol trabajador
 */
const getFincaTrabajadores = async (fincaId) => {
  try {
    // Obtener todos los usuarios asociados a la finca
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
          autentificar:autentificar(
            correo
          )
        )
      `)
      .eq('id_finca', fincaId);
    
    if (error) {
      throw error;
    }
    
    // Filtrar solo los que tienen rol de trabajador (id_rol=2)
    return data
      .filter(item => item.usuario && item.usuario.id_rol === 2)
      .map(item => ({
        ...item.usuario,
        nombre_completo: `${item.usuario.primer_nombre} ${item.usuario.primer_apellido}`,
        correo: item.usuario.autentificar?.correo || 'Sin correo',
        rol_finca: 'trabajador'
      }));
  } catch (error) {
    console.error('Error al obtener trabajadores de la finca:', error);
    throw error;
  }
};

/**
 * Obtiene todos los veterinarios de una finca
 * @param {number} fincaId - ID de la finca
 * @returns {Promise<Array>} - Lista de usuarios con rol veterinario
 */
const getFincaVeterinarios = async (fincaId) => {
  try {
    // Obtener todos los usuarios asociados a la finca
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
          autentificar:autentificar(
            correo
          )
        )
      `)
      .eq('id_finca', fincaId);
    
    if (error) {
      throw error;
    }
    
    // Filtrar solo los que tienen rol de veterinario (id_rol=3)
    return data
      .filter(item => item.usuario && item.usuario.id_rol === 3)
      .map(item => ({
        ...item.usuario,
        nombre_completo: `${item.usuario.primer_nombre} ${item.usuario.primer_apellido}`,
        correo: item.usuario.autentificar?.correo || 'Sin correo',
        rol_finca: 'veterinario'
      }));
  } catch (error) {
    console.error('Error al obtener veterinarios de la finca:', error);
    throw error;
  }
};

module.exports = {
  createFinca,
  getFincaById,
  updateFinca,
  deleteFinca,
  getAllFincas,
  getFincasByOwner,
  getFincaGanados,
  getFincaTrabajadores,
  getFincaVeterinarios
};