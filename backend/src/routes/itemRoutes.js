const { Router } = require('express');
const itemController = require('../controllers/itemController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../utils/constants');

const router = Router();
const vendedores = authorize(ROLES.VENDEDOR, ROLES.ADMIN);

// Catálogo público
router.get('/', itemController.list);
router.get('/:id', itemController.getById);

// Gestión protegida (JWT + RBAC)
router.post('/', authenticate, vendedores, itemController.create);
router.put('/:id', authenticate, vendedores, itemController.update);
router.delete('/:id', authenticate, vendedores, itemController.remove);

module.exports = router;
