function notFound(req, res) {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON mal formado' });
  }
  const status = err.status || 500;
  const body = { error: status === 500 ? 'Error interno del servidor' : err.message };
  if (err.details) body.detalles = err.details;
  if (status === 500 && process.env.NODE_ENV !== 'test') console.error(err);
  return res.status(status).json(body);
}

module.exports = { notFound, errorHandler };
