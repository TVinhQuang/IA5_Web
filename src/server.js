// Starts the API. `npm start` → http://localhost:3001
// The checks start this file with their own PORT: keep reading process.env.PORT.
import { app } from './app.js';

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => {
  console.log(`Reviews API on http://localhost:${port}`);
});
