import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverDir = resolve(__dirname, '../dist/frontend-samawe/server');

const serverMjsPath = resolve(serverDir, 'server.mjs');
let serverContent = readFileSync(serverMjsPath, 'utf-8');

if (serverContent.includes('angular-app-engine-manifest')) {
  console.log('Manifest imports already present, skipping.');
  process.exit(0);
}

// Find the SSR chunk that contains "Angular app engine manifest is not set"
const chunkImportMatch = serverContent.match(/from"\.\/([^"]+)"/g);
if (!chunkImportMatch) {
  console.error('Could not find chunk imports in server.mjs');
  process.exit(1);
}

let ssrChunkFile = null;
for (const imp of chunkImportMatch) {
  const file = imp.match(/from"\.\/([^"]+)"/)[1];
  const chunkPath = resolve(serverDir, file);
  try {
    const chunkContent = readFileSync(chunkPath, 'utf-8');
    if (chunkContent.includes('Angular app engine manifest is not set')) {
      ssrChunkFile = file;
      break;
    }
  } catch {}
}

if (!ssrChunkFile) {
  console.error('Could not find SSR chunk with manifest error');
  process.exit(1);
}

console.log(`Found SSR chunk: ${ssrChunkFile}`);

const chunkPath = resolve(serverDir, ssrChunkFile);
let chunkContent = readFileSync(chunkPath, 'utf-8');

// Add setter for oc (engine manifest) right after "var oc;"
chunkContent = chunkContent.replace(
  'var oc;',
  'var oc;function __setOc(t){oc=t}'
);

// Add the new setter to exports
chunkContent = chunkContent.replace(
  /export\{([^}]+)\}/,
  'export{$1,__setOc as j,tp as k}'
);

writeFileSync(chunkPath, chunkContent, 'utf-8');
console.log(`Patched ${ssrChunkFile}: added engine manifest setter`);

// Now patch server.mjs to import manifests and call setters
const chunkImportPattern = new RegExp(
  `(import\\{[^}]+\\}from"\\.\\/${ssrChunkFile.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}")`
);

const match = serverContent.match(chunkImportPattern);
if (!match) {
  console.error('Could not find chunk import in server.mjs');
  process.exit(1);
}

const originalImport = match[1];
// Add j (__setOc) and k (tp/setAngularAppManifest) to the import
const newImport = originalImport.replace('}from', ',j as __setEngineManifest,k as __setAppManifest}from');

const manifestCode = [
  newImport.replace(originalImport, ''),
  `import __engineManifest from './angular-app-engine-manifest.mjs';`,
  `import __appManifest from './angular-app-manifest.mjs';`,
  `__setEngineManifest(__engineManifest);`,
  `__setAppManifest(__appManifest);`,
].join('\n');

// Insert manifest code right after the polyfills import
serverContent = serverContent.replace(
  originalImport,
  newImport
);

serverContent = serverContent.replace(
  "import './polyfills.server.mjs';",
  `import './polyfills.server.mjs';\nimport __engineManifest from './angular-app-engine-manifest.mjs';\nimport __appManifest from './angular-app-manifest.mjs';`
);

// Add the setter calls right after all imports (before first var/const/let/function)
serverContent = serverContent.replace(
  newImport,
  newImport + '\n__setEngineManifest(__engineManifest);\n__setAppManifest(__appManifest);'
);

writeFileSync(serverMjsPath, serverContent, 'utf-8');
console.log('Patched server.mjs: added manifest imports and initialization');
