// Do not edit. Starts `src/server.js` on a free port for one check, and
// stops it afterwards — every check gets a freshly started server, with only
// the three seed reviews.
import { spawn } from 'node:child_process';
import net from 'node:net';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.unref();
    s.on('error', reject);
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });
}

export async function startServer() {
  const port = await freePort();
  const child = spawn(process.execPath, ['src/server.js'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(port), NODE_ENV: 'test' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', (d) => { output += d; });
  child.stderr.on('data', (d) => { output += d; });
  let exited = false;
  child.on('exit', () => { exited = true; });

  const base = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 8000;
  for (;;) {
    if (exited) throw new Error(`src/server.js stopped before it answered:\n${output}`);
    try {
      const r = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(1000) });
      if (r.ok) break;
    } catch { /* not listening yet */ }
    if (Date.now() > deadline) {
      child.kill('SIGKILL');
      throw new Error(`no answer from GET /api/health on port ${port} within 8 s (does src/server.js read PORT?)\n${output}`);
    }
    await new Promise((r) => setTimeout(r, 100));
  }

  return {
    base,
    async stop() {
      if (exited) return;
      const gone = new Promise((r) => child.once('exit', r));
      child.kill('SIGTERM');
      const t = setTimeout(() => child.kill('SIGKILL'), 2000);
      await gone;
      clearTimeout(t);
    },
  };
}
