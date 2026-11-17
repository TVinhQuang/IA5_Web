// The Express app. Your assistant builds the reviews API here (or in files it
// imports from here), following docs/api/ — the spec you write first.
import express from 'express';

export const app = express();

// The one route the starter has: the checks use it to know the server is up.
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

export default app;
