// Next.js uses this package as a compile-time boundary. Route tests execute
// the handlers directly, so the marker must be a no-op in the Node runner.
const Module = require('node:module')
const originalLoad = Module._load

Module._load = function load(request, parent, isMain) {
  if (request === 'server-only') return {}
  return originalLoad.call(this, request, parent, isMain)
}
