import assert from 'assert'
import { EventEmitter } from 'events'
import { VsoaPayload } from 'vsoa'
import { kRpcSubPaths, kRpcGetHandlers, kRpcSetHandlers, kDgramHandlers } from './symbols'
import { VppHandler } from './vpp-types'
import { isUrlPath } from './utilities'

/**
* Router class collect business handlers' setup; and Vpp link routers to the
* VsoaServer requests once loaded; And adapters will normalize the incoming RPC
* call and datagram events to the **standard** (req, res, next) API callback.
*
* The last URL Router applies so the previous one will be overridden:
*   vapp.use('/abc/', moduleA) // this one is overriden
*   vapp.use('/abc/', moduleB) // this one takes effect
*/

export class VppRouter extends EventEmitter {
  private rpcSubPaths = new Set<string>()
  private getHandlers = new Map<string, VppHandler[]>()
  private setHandlers = new Map<string, VppHandler[]>()
  private dgramHandlers = new Map<string, VppHandler[]>()

  get (subPath: string, ...handlers: VppHandler[]) {
    assertArguments(subPath, handlers)
    addHandlers(subPath, handlers, this.getHandlers)
    this.rpcSubPaths.add(subPath)
  }

  set (subPath: string, ...handlers: VppHandler[]) {
    assertArguments(subPath, handlers)
    addHandlers(subPath, handlers, this.setHandlers)
    this.rpcSubPaths.add(subPath)
  }

  /**
  * Send datagram to the specified url
  * @param {string} subPath sub url path of this router module
  * @param  {...any} handlers
  */
  dgram (subPath: string, ...handlers: VppHandler[]) {
    assertArguments(subPath, handlers)
    addHandlers(subPath, handlers, this.dgramHandlers)
  }

  /**
  * @param {string} [subPath]
  * @param {*} payload
  */
  publish (subPath: string|VsoaPayload, payload?: VsoaPayload) {
    if (payload === undefined) {
      payload = subPath
      subPath = '/'
    }
    this.emit('publish', subPath, payload)
  }

  /**
   * Symbol protected memebers: internal use only
   */
  get [kRpcGetHandlers] () { return this.getHandlers.values() }
  get [kRpcSetHandlers] () { return this.setHandlers.values() }
  get [kDgramHandlers] () { return this.dgramHandlers.entries() }
  get [kRpcSubPaths] () { return this.rpcSubPaths.values() }
}

function assertArguments (path: string, handlers: VppHandler[]) {
  assert(isUrlPath(path), `Invalid url path: "${path}"`)
  assert(handlers.length > 0 && handlers.every(f => typeof f === 'function'),
    'handler function(s) must be provided')
}

function addHandlers (
  subPath: string,
  handlers: VppHandler[],
  targetContainer: Map<string, VppHandler[]>) {
  if (targetContainer.has(subPath)) {
    targetContainer.set(subPath, targetContainer.get(subPath)!.concat(handlers))
  } else {
    targetContainer.set(subPath, handlers)
  }
}