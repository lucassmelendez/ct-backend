const { db } = require('../config/supabase');

const eventoGanaderoCollection = db.collection('eventos_ganaderos');

/**
 * Crear un nuevo evento ganadero
 * @param {Object} datos - Datos del evento ganadero
 * @returns {Promise<Object>} - Evento ganadero creado
 */
const createEventoGanadero = async (datos) => {
  try {
    // Verificar si ya existe un ID secuencial
    const snapshot = await eventoGanaderoCollection.orderBy('id_evento_ganadero', 'desc').limit(1).get();
    let nuevoId = 1;
    
    if (!snapshot.empty) {
      nuevoId = snapshot.docs[0].data().id_evento_ganadero + 1;
    }
    
    const eventoGanaderoData = {
      id_evento_ganadero: nuevoId,
      descripcion: datos.descripcion,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const docRef = await eventoGanaderoCollection.add(eventoGanaderoData);
    
    return {
      id: docRef.id,
      ...eventoGanaderoData
    };
  } catch (error) {
    console.error('Error al crear evento ganadero:', error);
    throw error;
  }
};

/**
 * Obtener un evento ganadero por su ID
 * @param {string} id - ID del documento en Firestore
 * @returns {Promise<Object|null>} - Evento ganadero o null si no existe
 */
const getEventoGanaderoById = async (id) => {
  try {
    const doc = await eventoGanaderoCollection.doc(id).get();
    
    if (!doc.exists) {
      return null;
    }
    
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error('Error al obtener evento ganadero:', error);
    throw error;
  }
};

/**
 * Obtener un evento ganadero por su ID numérico
 * @param {number} idNumerico - ID numérico del evento ganadero
 * @returns {Promise<Object|null>} - Evento ganadero o null si no existe
 */
const getEventoGanaderoByNumericId = async (idNumerico) => {
  try {
    const snapshot = await eventoGanaderoCollection
      .where('id_evento_ganadero', '==', parseInt(idNumerico))
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error('Error al obtener evento ganadero por ID numérico:', error);
    throw error;
  }
};

/**
 * Actualizar un evento ganadero
 * @param {string} id - ID del documento en Firestore
 * @param {Object} datos - Datos a actualizar
 * @returns {Promise<Object>} - Evento ganadero actualizado
 */
const updateEventoGanadero = async (id, datos) => {
  try {
    const updateData = {
      ...datos,
      updatedAt: new Date().toISOString()
    };
    
    await eventoGanaderoCollection.doc(id).update(updateData);
    
    return await getEventoGanaderoById(id);
  } catch (error) {
    console.error('Error al actualizar evento ganadero:', error);
    throw error;
  }
};

/**
 * Eliminar un evento ganadero
 * @param {string} id - ID del documento en Firestore
 * @returns {Promise<boolean>} - true si se eliminó correctamente
 */
const deleteEventoGanadero = async (id) => {
  try {
    await eventoGanaderoCollection.doc(id).delete();
    return true;
  } catch (error) {
    console.error('Error al eliminar evento ganadero:', error);
    throw error;
  }
};

/**
 * Obtener todos los eventos ganaderos
 * @returns {Promise<Array>} - Lista de eventos ganaderos
 */
const getAllEventosGanaderos = async () => {
  try {
    const snapshot = await eventoGanaderoCollection.orderBy('id_evento_ganadero').get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error al obtener eventos ganaderos:', error);
    throw error;
  }
};

module.exports = {
  createEventoGanadero,
  getEventoGanaderoById,
  getEventoGanaderoByNumericId,
  updateEventoGanadero,
  deleteEventoGanadero,
  getAllEventosGanaderos
}; 