const usuarioFincaModel = require('../models/supabaseUsuarioFincaModel');
const userModel = require('../models/supabaseUserModel');
const fincaModel = require('../models/supabaseFincaModel');

/**
 * Asocia un usuario a una finca
 * @param {Request} req - Objeto de solicitud de Express
 * @param {Response} res - Objeto de respuesta de Express
 */
const asociarUsuarioFinca = async (req, res) => {
  try {
    const { id_usuario, id_finca } = req.body;
    
    if (!id_usuario || !id_finca) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren id_usuario e id_finca'
      });
    }
    
    // Verificar si el usuario existe
    let idUsuarioNumerico = id_usuario;
    
    // Si es un UUID, obtener el id_usuario numérico
    if (typeof id_usuario === 'string' && id_usuario.includes('-')) {
      const usuario = await userModel.getUserByAuthId(id_usuario);
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      idUsuarioNumerico = usuario.id_usuario;
    }
    
    // Verificar si la finca existe
    const finca = await fincaModel.getFincaById(id_finca);
    if (!finca) {
      return res.status(404).json({
        success: false,
        message: 'Finca no encontrada'
      });
    }
    
    const data = await usuarioFincaModel.asociarUsuarioFinca(idUsuarioNumerico, id_finca);
    
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error al asociar usuario a finca:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al asociar usuario a finca',
      error: error.message
    });
  }
};

/**
 * Desasocia un usuario de una finca
 * @param {Request} req - Objeto de solicitud de Express
 * @param {Response} res - Objeto de respuesta de Express
 */
const desasociarUsuarioFinca = async (req, res) => {
  try {
    const { id_usuario, id_finca } = req.body;
    
    if (!id_usuario || !id_finca) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren id_usuario e id_finca'
      });
    }
    
    // Verificar si el usuario existe
    let idUsuarioNumerico = id_usuario;
    
    // Si es un UUID, obtener el id_usuario numérico
    if (typeof id_usuario === 'string' && id_usuario.includes('-')) {
      const usuario = await userModel.getUserByAuthId(id_usuario);
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      idUsuarioNumerico = usuario.id_usuario;
    }
    
    await usuarioFincaModel.desasociarUsuarioFinca(idUsuarioNumerico, id_finca);
    
    return res.status(200).json({
      success: true,
      message: 'Usuario desasociado de la finca correctamente'
    });
  } catch (error) {
    console.error('Error al desasociar usuario de finca:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al desasociar usuario de finca',
      error: error.message
    });
  }
};

/**
 * Obtiene todas las fincas asociadas a un usuario
 * @param {Request} req - Objeto de solicitud de Express
 * @param {Response} res - Objeto de respuesta de Express
 */
const getFincasByUsuario = async (req, res) => {
  try {
    const { id_usuario } = req.params;
    
    if (!id_usuario) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere id_usuario'
      });
    }
    
    // Verificar si el usuario existe
    let idUsuarioNumerico = id_usuario;
    
    // Si es un UUID, obtener el id_usuario numérico
    if (typeof id_usuario === 'string' && id_usuario.includes('-')) {
      const usuario = await userModel.getUserByAuthId(id_usuario);
      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      idUsuarioNumerico = usuario.id_usuario;
    }
    
    const fincas = await usuarioFincaModel.getFincasByUsuario(idUsuarioNumerico);
    
    return res.status(200).json({
      success: true,
      data: fincas
    });
  } catch (error) {
    console.error('Error al obtener fincas del usuario:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener fincas del usuario',
      error: error.message
    });
  }
};

/**
 * Obtiene todos los usuarios asociados a una finca
 * @param {Request} req - Objeto de solicitud de Express
 * @param {Response} res - Objeto de respuesta de Express
 */
const getUsuariosByFinca = async (req, res) => {
  try {
    const { id_finca } = req.params;
    
    if (!id_finca) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere id_finca'
      });
    }
    
    const usuarios = await usuarioFincaModel.getUsuariosByFinca(id_finca);
    
    return res.status(200).json({
      success: true,
      data: usuarios
    });
  } catch (error) {
    console.error('Error al obtener usuarios de la finca:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios de la finca',
      error: error.message
    });
  }
};

/**
 * Obtiene propietarios de una finca
 * @param {Request} req - Objeto de solicitud de Express
 * @param {Response} res - Objeto de respuesta de Express
 */
const getPropietariosByFinca = async (req, res) => {
  try {
    const { id_finca } = req.params;
    
    if (!id_finca) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere id_finca'
      });
    }
    
    const propietarios = await usuarioFincaModel.getPropietariosByFinca(id_finca);
    
    return res.status(200).json({
      success: true,
      data: propietarios
    });
  } catch (error) {
    console.error('Error al obtener propietarios de la finca:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener propietarios de la finca',
      error: error.message
    });
  }
};

module.exports = {
  asociarUsuarioFinca,
  desasociarUsuarioFinca,
  getFincasByUsuario,
  getUsuariosByFinca,
  getPropietariosByFinca
}; 