const express = require('express');
const cors = require('cors');
const config = require('./config');
const authRoutes = require('./routes/authRoutes');
const itemRoutes = require('./routes/itemRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.disable('x-powered-by');
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok', servicio: 'MineMarket API' }));
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
