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
  getPremiumTypes
} = require('../controllers/userController');
const { supabaseAuth: protect, requireAdmin: admin } = require('../middlewares/supabaseAuthMiddleware');
const { 
  userCacheMiddleware, 
  invalidateCacheMiddleware,
  cacheMiddleware
} = require('../middlewares/cacheMiddleware');

router.post('/register', invalidateCacheMiddleware(['user_']), registerUser);
router.post('/login', loginUser);
router.post('/refresh-token', protect, refreshToken);

router.get('/profile', protect, userCacheMiddleware, getUserProfile);
router.put('/profile', protect, invalidateCacheMiddleware(['user_']), updateUserProfile);

// Rutas de premium
router.get('/premium-types', protect, cacheMiddleware(3600), getPremiumTypes);
router.put('/premium', protect, invalidateCacheMiddleware(['user_']), updateUserPremium);

router.get('/', protect, admin, userCacheMiddleware, getUsers);
router.put('/:id/role', protect, admin, invalidateCacheMiddleware(['user_']), changeUserRole);

module.exports = router;