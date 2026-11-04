import test from 'node:test'
import assert from 'node:assert/strict'
import { apply } from '../lib/index.js'

/** The host webServer's register contract (dsh-host-webserver): throws on a
 *  duplicate route and returns a disposer that removes it. */
function hostWebServer() {
  const table = new Map()
  return {
    register(route) {
      if (table.has(route.path)) {
        throw new Error(`webserver: duplicate ${route.kind} route "${route.path}"`)
      }
      table.set(route.path, route)
      return () => { table.delete(route.path) }
    },
    paths: () => [...table.keys()],
  }
}

test('apply returns register() disposer so fiber unload clears the route', () => {
  const webServer = hostWebServer()
  const disposer = apply({ webServer })
  assert.equal(typeof disposer, 'function', 'apply must return the route disposer')
  assert.deepEqual(webServer.paths(), ['/3d-model-viewer/files'])
  disposer()
  assert.deepEqual(webServer.paths(), [], 'disposer must remove the route')
})

test('hot update sequence: unload old fiber, then load new fiber, no duplicate', () => {
  const webServer = hostWebServer()
  // old fiber loads
  const oldDispose = apply({ webServer })
  // plugin manager hot update: old fiber unloads first, new fiber loads after
  oldDispose()
  const newDispose = apply({ webServer })
  assert.deepEqual(webServer.paths(), ['/3d-model-viewer/files'])
  newDispose()
})

test('registering while the previous fiber leaked still surfaces the host error', () => {
  const webServer = hostWebServer()
  apply({ webServer }) // leaked fiber: disposer never called
  assert.throws(() => apply({ webServer }), /duplicate exact route/)
})
