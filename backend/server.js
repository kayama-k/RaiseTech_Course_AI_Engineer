const express = require('express');
const cors = require('cors');

const listsRouter = require('./routes/lists');
const cardsRouter = require('./routes/cards');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/lists', listsRouter);
app.use('/api/cards', cardsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Centralized error handler so unexpected exceptions return JSON, not an HTML stack trace.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'internal server error' });
});

app.listen(PORT, () => {
  console.log(`Task board API listening on http://localhost:${PORT}`);
});
