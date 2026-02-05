import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';

const OUTPUT_DIR = '.vercel/output';
const FUNC_DIR = `${OUTPUT_DIR}/functions/api/index.func`;

// Clean and create directories
fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
fs.mkdirSync(FUNC_DIR, { recursive: true });
fs.mkdirSync(`${OUTPUT_DIR}/static`, { recursive: true });

// Copy static files from dist/public to .vercel/output/static
const staticSrc = 'dist/public';
if (fs.existsSync(staticSrc)) {
  copyRecursive(staticSrc, `${OUTPUT_DIR}/static`);
}

// Bundle API with esbuild
await esbuild.build({
  entryPoints: ['api/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  outfile: `${FUNC_DIR}/index.js`,
  external: [
    // Node.js built-ins
    'crypto', 'fs', 'path', 'url', 'http', 'https', 'stream', 'util', 'events', 'buffer', 'querystring', 'os', 'net', 'tls', 'zlib', 'dns', 'child_process', 'cluster', 'dgram', 'readline', 'repl', 'tty', 'v8', 'vm', 'worker_threads', 'perf_hooks', 'async_hooks', 'string_decoder', 'assert', 'constants', 'timers', 'console',
    // Node.js prefixed
    'node:*',
  ],
  banner: {
    js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`
  },
  loader: {
    '.json': 'json'
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  }
});

// Create .vc-config.json for the function
fs.writeFileSync(`${FUNC_DIR}/.vc-config.json`, JSON.stringify({
  runtime: 'nodejs18.x',
  handler: 'index.default',
  launcherType: 'Nodejs',
  maxDuration: 30
}, null, 2));

// Create config.json for Vercel Build Output
fs.writeFileSync(`${OUTPUT_DIR}/config.json`, JSON.stringify({
  version: 3,
  routes: [
    { src: '/api/(.*)', dest: '/api/index' },
    { handle: 'filesystem' },
    { src: '/(.*)', dest: '/index.html' }
  ]
}, null, 2));

console.log('Build complete!');

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const file of fs.readdirSync(src)) {
      copyRecursive(path.join(src, file), path.join(dest, file));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}
