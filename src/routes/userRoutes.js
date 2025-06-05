const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  changeUserRole,
  refreshToken,
  updateUserPremium,
  getPremiumTypes,
  activatePremiumOnly
} = require('../controllers/userController');
const { supabaseAuth: protect, requireAdmin: admin } = require('../middlewares/supabaseAuthMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh-token', protect, refreshToken);

router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);

// Rutas de premium
router.get('/premium-types', protect, getPremiumTypes);
router.put('/premium', protect, updateUserPremium);
router.patch('/activate-premium', protect, activatePremiumOnly);

router.get('/', protect, admin, getUsers);
router.put('/:id/role', protect, admin, changeUserRole);

module.exports = router;