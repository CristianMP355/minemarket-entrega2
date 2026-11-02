const { itemRepo } = require('../data/store');
const { validateItem } = require('../utils/validators');
const { ROLES } = require('../utils/constants');
const HttpError = require('../utils/httpError');

function getItemOr404(id) {
  const item = itemRepo.findById(id);
  if (!item) throw new HttpError(404, 'Ítem no encontrado');
  return item;
}

/** Solo el vendedor dueño del ítem o un ADMIN pueden modificarlo. */
function assertOwnership(item, user) {
  if (user.rol !== ROLES.ADMIN && item.id_vendedor !== user.id) {
    throw new HttpError(403, 'Solo el vendedor propietario o un administrador puede modificar este ítem');
  }
}

function list(req, res) {
  const { tipo, q } = req.query;
  res.json(itemRepo.findAll({ tipo, q }));
}

function getById(req, res, next) {
  try {
    res.json(getItemOr404(req.params.id));
  } catch (err) {
    next(err);
  }
}

function create(req, res, next) {
  try {
    const errors = validateItem(req.body);
    if (errors.length) throw new HttpError(400, 'Datos del ítem inválidos', errors);
    res.status(201).json(itemRepo.create(req.body, req.user.id));
  } catch (err) {
    next(err);
  }
}

function update(req, res, next) {
  try {
    const item = getItemOr404(req.params.id);
    assertOwnership(item, req.user);
    const errors = validateItem(req.body, true);
    if (errors.length) throw new HttpError(400, 'Datos del ítem inválidos', errors);
    res.json(itemRepo.update(item.id_item, req.body));
  } catch (err) {
    next(err);
  }
}

function remove(req, res, next) {
  try {
    const item = getItemOr404(req.params.id);
    assertOwnership(item, req.user);
    itemRepo.remove(item.id_item);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, remove };
