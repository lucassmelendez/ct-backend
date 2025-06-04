const { supabase } = require('../config/supabase');

/**
 * Crea un nuevo ganado
 * @param {Object} datos - Datos del ganado
 * @returns {Promise<Object>} - Ganado creado
 */
const createGanado = async (datos) => {
  try {
    // Verificar si ya existe un ID secuencial
    const { data: lastGanado, error: countError } = await supabase
      .from('ganado')
      .select('id_ganado')
      .order('id_ganado', { ascending: false })
      .limit(1);
    
    if (countError) {
      throw countError;
    }
    
    let nuevoId = 1;
    if (lastGanado && lastGanado.length > 0) {
      nuevoId = lastGanado[0].id_ganado + 1;
    }
    
    // Preparar datos para la inserción
    const ganadoData = {
      id_ganado: nuevoId,
      nombre: datos.nombre,
      numero_identificacion: datos.numero_identificacion || 0,
      precio_compra: datos.precio_compra || 0,
      nota: datos.nota || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Asignar referencias a otras tablas
    if (datos.id_informacion_veterinaria) ganadoData.id_informacion_veterinaria = datos.id_informacion_veterinaria;
    if (datos.id_produccion) ganadoData.id_produccion = datos.id_produccion;
    if (datos.id_estado_salud) ganadoData.id_estado_salud = datos.id_estado_salud;
    if (datos.id_genero) ganadoData.id_genero = datos.id_genero;
    
    // Si hay información de finca, agregarla
    if (datos.finca && datos.finca.id) {
      ganadoData.id_finca = datos.finca.id;
    } else if (datos.id_finca) {
      ganadoData.id_finca = datos.id_finca;
    }
    
    // Insertar en la tabla ganado
    const { data, error } = await supabase
      .from('ganado')
      .insert(ganadoData)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    // Si se proporciona información veterinaria pero no hay ID existente
    if (datos.informacion_veterinaria && !datos.id_informacion_veterinaria) {
      const infoVetData = {
        fecha_tratamiento: datos.informacion_veterinaria.fecha_tratamiento || new Date().toISOString(),
        diagnostico: datos.informacion_veterinaria.diagnostico || '',
        tratamiento: datos.informacion_veterinaria.tratamiento || '',
        nota: datos.informacion_veterinaria.nota || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: vetData, error: vetError } = await supabase
        .from('informacion_veterinaria')
        .insert(infoVetData)
        .select()
        .single();
      
      if (vetError) {
        console.error('Error al insertar información veterinaria:', vetError);
      } else {
        // Actualizar el ganado con el ID de la información veterinaria
        await supabase
          .from('ganado')
          .update({ id_informacion_veterinaria: vetData.id_informacion_veterinaria })
          .eq('id_ganado', data.id_ganado);
      }
    }
    
    // Si se proporciona estado de salud pero no hay ID existente
    if (datos.estado_salud && !datos.id_estado_salud) {
      // Verificar si existe o crear
      const { data: saludData, error: saludError } = await supabase
        .from('estado_salud')
        .select('*')
        .eq('descripcion', datos.estado_salud)
        .maybeSingle();
      
      let estadoSaludId;
      
      if (!saludData) {
        // Crear nuevo estado de salud
        const { data: newSaludData, error: newSaludError } = await supabase
          .from('estado_salud')
          .insert({ descripcion: datos.estado_salud })
          .select()
          .single();
        
        if (!newSaludError) {
          estadoSaludId = newSaludData.id_estado_salud;
        }
      } else {
        estadoSaludId = saludData.id_estado_salud;
      }
      
      if (estadoSaludId) {
        // Actualizar el ganado con el ID del estado de salud
        await supabase
          .from('ganado')
          .update({ id_estado_salud: estadoSaludId })
          .eq('id_ganado', data.id_ganado);
      }
    }
    
    // Si se proporciona información de género pero no hay ID existente
    if (datos.genero && !datos.id_genero) {
      // Verificar si existe o crear
      const { data: generoData, error: generoError } = await supabase
        .from('genero')
        .select('*')
        .eq('descripcion', datos.genero)
        .maybeSingle();
      
      let generoId;
      
      if (!generoData) {
        // Crear nuevo género
        const { data: newGeneroData, error: newGeneroError } = await supabase
          .from('genero')
          .insert({ descripcion: datos.genero })
          .select()
          .single();
        
        if (!newGeneroError) {
          generoId = newGeneroData.id_genero;
        }
      } else {
        generoId = generoData.id_genero;
      }
      
      if (generoId) {
        // Actualizar el ganado con el ID del género
        await supabase
          .from('ganado')
          .update({ id_genero: generoId })
          .eq('id_ganado', data.id_ganado);
      }
    }
    
    // Si se proporciona información de producción pero no hay ID existente
    if (datos.produccion && !datos.id_produccion) {
      const produccionData = {
        descripcion: datos.produccion.descripcion || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: prodData, error: prodError } = await supabase
        .from('produccion')
        .insert(produccionData)
        .select()
        .single();
      
      if (prodError) {
        console.error('Error al insertar información de producción:', prodError);
      } else {
        // Actualizar el ganado con el ID de producción
        await supabase
          .from('ganado')
          .update({ id_produccion: prodData.id_produccion })
          .eq('id_ganado', data.id_ganado);
      }
    }
    
    // Obtener el ganado actualizado con todas las relaciones
    return await getGanadoById(data.id_ganado);
  } catch (error) {
    console.error('Error al crear ganado:', error);
    throw error;
  }
};

/**
 * Obtiene un ganado por su ID
 * @param {number} id - ID del ganado
 * @returns {Promise<Object|null>} - Ganado o null si no existe
 */
const getGanadoById = async (id) => {
  try {
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
      .eq('id_ganado', id)
      .single();
    
    if (error) {
      console.error('Error al obtener ganado:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error al obtener ganado:', error);
    throw error;
  }
};

/**
 * Actualiza un ganado
 * @param {number} id - ID del ganado
 * @param {Object} datos - Datos a actualizar
 * @returns {Promise<Object>} - Ganado actualizado
 */
const updateGanado = async (id, datos) => {
  try {
    // Verificar si el ganado existe
    const { data: ganado, error: checkError } = await supabase
      .from('ganado')
      .select('id_ganado')
      .eq('id_ganado', id)
      .single();
    
    if (checkError || !ganado) {
      throw new Error(`El ganado con ID ${id} no existe`);
    }
    
    // Preparar datos para actualizar en la tabla principal
    const updateData = {
      ...datos,
      updated_at: new Date().toISOString()
    };
    
    // Eliminar campos que van en otras tablas
    delete updateData.informacion_veterinaria;
    delete updateData.produccion;
    delete updateData.estado_salud;
    delete updateData.genero;
    
    // Si hay referencia a finca como objeto, convertirla a id_finca
    if (updateData.finca && updateData.finca.id) {
      updateData.id_finca = updateData.finca.id;
      delete updateData.finca;
    }
    
    // Actualizar tabla principal
    const { data, error } = await supabase
      .from('ganado')
      .update(updateData)
      .eq('id_ganado', id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    // Actualizar información veterinaria si existe
    if (datos.informacion_veterinaria) {
      if (data.id_informacion_veterinaria) {
        // Actualizar existente
        await supabase
          .from('informacion_veterinaria')
          .update({
            ...datos.informacion_veterinaria,
            updated_at: new Date().toISOString()
          })
          .eq('id_informacion_veterinaria', data.id_informacion_veterinaria);
      } else {
        // Crear nuevo
        const { data: vetData, error: vetError } = await supabase
          .from('informacion_veterinaria')
          .insert({
            ...datos.informacion_veterinaria,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (!vetError && vetData) {
          // Actualizar ganado con referencia
          await supabase
            .from('ganado')
            .update({ id_informacion_veterinaria: vetData.id_informacion_veterinaria })
            .eq('id_ganado', id);
        }
      }
    }
    
    // Actualizar estado de salud si existe
    if (datos.estado_salud) {
      // Verificar si existe o crear
      const { data: saludData, error: saludError } = await supabase
        .from('estado_salud')
        .select('*')
        .eq('descripcion', datos.estado_salud)
        .maybeSingle();
      
      let estadoSaludId;
      
      if (!saludData) {
        // Crear nuevo estado de salud
        const { data: newSaludData, error: newSaludError } = await supabase
          .from('estado_salud')
          .insert({ descripcion: datos.estado_salud })
          .select()
          .single();
        
        if (!newSaludError) {
          estadoSaludId = newSaludData.id_estado_salud;
        }
      } else {
        estadoSaludId = saludData.id_estado_salud;
      }
      
      if (estadoSaludId) {
        // Actualizar el ganado con el ID del estado de salud
        await supabase
          .from('ganado')
          .update({ id_estado_salud: estadoSaludId })
          .eq('id_ganado', id);
      }
    }
    
    // Actualizar género si existe
    if (datos.genero) {
      // Verificar si existe o crear
      const { data: generoData, error: generoError } = await supabase
        .from('genero')
        .select('*')
        .eq('descripcion', datos.genero)
        .maybeSingle();
      
      let generoId;
      
      if (!generoData) {
        // Crear nuevo género
        const { data: newGeneroData, error: newGeneroError } = await supabase
          .from('genero')
          .insert({ descripcion: datos.genero })
          .select()
          .single();
        
        if (!newGeneroError) {
          generoId = newGeneroData.id_genero;
        }
      } else {
        generoId = generoData.id_genero;
      }
      
      if (generoId) {
        // Actualizar el ganado con el ID del género
        await supabase
          .from('ganado')
          .update({ id_genero: generoId })
          .eq('id_ganado', id);
      }
    }
    
    // Actualizar información de producción si existe
    if (datos.produccion) {
      if (data.id_produccion) {
        // Actualizar existente
        await supabase
          .from('produccion')
          .update({
            descripcion: datos.produccion.descripcion,
            updated_at: new Date().toISOString()
          })
          .eq('id_produccion', data.id_produccion);
      } else {
        // Crear nuevo
        const { data: prodData, error: prodError } = await supabase
          .from('produccion')
          .insert({
            descripcion: datos.produccion.descripcion || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (!prodError && prodData) {
          // Actualizar ganado con referencia
          await supabase
            .from('ganado')
            .update({ id_produccion: prodData.id_produccion })
            .eq('id_ganado', id);
        }
      }
    }
    
    return await getGanadoById(id);
  } catch (error) {
    console.error('Error al actualizar ganado:', error);
    throw error;
  }
};

/**
 * Elimina un ganado
 * @param {number} id - ID del ganado
 * @returns {Promise<boolean>} - true si se eliminó correctamente
 */
const deleteGanado = async (id) => {
  try {
    // Obtener datos del ganado para limpiar referencias
    const { data: ganado } = await supabase
      .from('ganado')
      .select('*')
      .eq('id_ganado', id)
      .single();
    
    if (!ganado) {
      throw new Error(`Ganado con ID ${id} no encontrado`);
    }
    
    // IDs para limpiar después de eliminar el ganado
    const idInformacionVeterinaria = ganado.id_informacion_veterinaria;
    const idProduccion = ganado.id_produccion;
    
    // Eliminar ganado
    const { error } = await supabase
      .from('ganado')
      .delete()
      .eq('id_ganado', id);
    
    if (error) {
      throw error;
    }
    
    // Limpiar información veterinaria si existe y no está referenciada por otros ganados
    if (idInformacionVeterinaria) {
      const { data: refCheck } = await supabase
        .from('ganado')
        .select('id_ganado')
        .eq('id_informacion_veterinaria', idInformacionVeterinaria)
        .limit(1);
      
      if (!refCheck || refCheck.length === 0) {
        // No hay más referencias, es seguro eliminar
        await supabase
          .from('informacion_veterinaria')
          .delete()
          .eq('id_informacion_veterinaria', idInformacionVeterinaria);
      }
    }
    
    // Limpiar producción si existe y no está referenciada por otros ganados
    if (idProduccion) {
      const { data: refCheck } = await supabase
        .from('ganado')
        .select('id_ganado')
        .eq('id_produccion', idProduccion)
        .limit(1);
      
      if (!refCheck || refCheck.length === 0) {
        // No hay más referencias, es seguro eliminar
        await supabase
          .from('produccion')
          .delete()
          .eq('id_produccion', idProduccion);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error al eliminar ganado:', error);
    throw error;
  }
};

/**
 * Obtiene todos los ganados
 * @returns {Promise<Array>} - Lista de ganados
 */
const getAllGanados = async () => {
  try {
    const { data, error } = await supabase
      .from('ganado')
      .select(`
        *,
        finca:finca(*),
        estado_salud:estado_salud(*),
        genero:genero(*)
      `)
      .order('id_ganado');
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error al obtener ganados:', error);
    throw error;
  }
};

/**
 * Obtiene todos los ganados con información completa
 * @returns {Promise<Array>} - Lista de ganados con información adicional
 */
const getAllGanadosWithInfo = async () => {
  try {
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
      .order('id_ganado');
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error al obtener ganados con información:', error);
    throw error;
  }
};

/**
 * Obtiene los ganados por finca
 * @param {number} fincaId - ID de la finca
 * @returns {Promise<Array>} - Lista de ganados de la finca
 */
const getGanadosByFinca = async (fincaId) => {
  try {
    const { data, error } = await supabase
      .from('ganado')
      .select(`
        *,
        informacion_veterinaria:informacion_veterinaria(*),
        produccion:produccion(*),
        estado_salud:estado_salud(*),
        genero:genero(*)
      `)
      .eq('id_finca', fincaId)
      .order('id_ganado');
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error al obtener ganados por finca:', error);
    throw error;
  }
};

/**
 * Obtiene los registros médicos de un ganado
 * @param {number} id - ID del ganado
 * @returns {Promise<Array>} - Lista de registros médicos
 */
const getMedicalRecords = async (id) => {
  try {
    // Obtener el ID de información veterinaria asociada
    const { data: ganado, error: ganadoError } = await supabase
      .from('ganado')
      .select('id_informacion_veterinaria')
      .eq('id_ganado', id)
      .single();
    
    if (ganadoError || !ganado || !ganado.id_informacion_veterinaria) {
      return [];
    }
    
    // Obtener información veterinaria
    const { data, error } = await supabase
      .from('informacion_veterinaria')
      .select('*')
      .eq('id_informacion_veterinaria', ganado.id_informacion_veterinaria)
      .single();
    
    if (error) {
      throw error;
    }
    
    // Formatear como arreglo para mantener compatibilidad con la aplicación
    return data ? [data] : [];
  } catch (error) {
    console.error('Error al obtener registros médicos:', error);
    throw error;
  }
};

/**
 * Agrega un registro médico a un ganado
 * @param {number} id - ID del ganado
 * @param {Object} medicalData - Datos del registro médico
 * @returns {Promise<Object>} - Registro médico creado
 */
const addMedicalRecord = async (id, medicalData) => {
  try {
    // Verificar si el ganado existe
    const { data: ganado, error: checkError } = await supabase
      .from('ganado')
      .select('id_ganado, id_informacion_veterinaria')
      .eq('id_ganado', id)
      .single();
    
    if (checkError || !ganado) {
      throw new Error(`El ganado con ID ${id} no existe`);
    }
    
    // Si ya tiene información veterinaria, actualizarla
    if (ganado.id_informacion_veterinaria) {
      const { data, error } = await supabase
        .from('informacion_veterinaria')
        .update({
          fecha_tratamiento: medicalData.fecha || new Date().toISOString(),
          diagnostico: medicalData.diagnostico || medicalData.descripcion || '',
          tratamiento: medicalData.tratamiento || '',
          nota: medicalData.nota || medicalData.notas || '',
          updated_at: new Date().toISOString()
        })
        .eq('id_informacion_veterinaria', ganado.id_informacion_veterinaria)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    } else {
      // Crear nueva información veterinaria
      const { data, error } = await supabase
        .from('informacion_veterinaria')
        .insert({
          fecha_tratamiento: medicalData.fecha || new Date().toISOString(),
          diagnostico: medicalData.diagnostico || medicalData.descripcion || '',
          tratamiento: medicalData.tratamiento || '',
          nota: medicalData.nota || medicalData.notas || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Actualizar ganado con referencia a la información veterinaria
      await supabase
        .from('ganado')
        .update({ id_informacion_veterinaria: data.id_informacion_veterinaria })
        .eq('id_ganado', id);
      
      return data;
    }
  } catch (error) {
    console.error('Error al agregar registro médico:', error);
    throw error;
  }
};

module.exports = {
  createGanado,
  getGanadoById,
  updateGanado,
  deleteGanado,
  getAllGanados,
  getAllGanadosWithInfo,
  getGanadosByFinca,
  getMedicalRecords,
  addMedicalRecord
}; 