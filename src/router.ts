import path = require('path')
import assert = require('assert')
import { EventEmitter } from 'events'
import { VsoaPayload } from 'vsoa'
import { kDgramHandlers, kRpcHandlers, kBasePubCallbacks, kRpcGet, kRpcSet } from './symbols'
import { VppPublish, VppDgramHandler, VppRpcHandler, VppPayload } from './types'
import { buildVsoaPayload, isUrlPath } from './utilities'

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
  protected rpcHandlers = new Map<string, Set<VppRpcHandler>>()
  protected dgramHandlers = new Map<string, Set<VppDgramHandler>>()
  private basePubCallbacks = new Set<VppPublish>()

  constructor (captureRejections = false) {
    super({ captureRejections })
  }

  get (subPath: string, ...handlers: VppRpcHandler[]): VppRouter {
    assertArguments(subPath, handlers)
    handlers.forEach(h => { h[kRpcGet] = true })
    addHandlers(subPath, handlers, this.rpcHandlers)
    return this
  }

  set (subPath: string, ...handlers: VppRpcHandler[]): VppRouter {
    assertArguments(subPath, handlers)
    handlers.forEach(h => { h[kRpcSet] = true })
    addHandlers(subPath, handlers, this.rpcHandlers)
    return this
  }

  dgram (subPath: string, ...handlers: VppDgramHandler[]): VppRouter {
    assertArguments(subPath, handlers)
    addHandlers(subPath, handlers, this.dgramHandlers)
    return this
  }

  use (subPath: string|VppRouter, ...routers: VppRouter[]): VppRouter {
    if (subPath instanceof VppRouter) {
      routers.unshift(subPath)
      subPath = '/'
    }
    assert(subPath && typeof subPath === 'string', 'url path must be a string')
    assert(routers.every(r => r instanceof VppRouter), 'url router must be a VppRouter')

    const self = this
    const usePath = subPath

    for (const router of routers) {
      router[kBasePubCallbacks].add(function (payload?: VsoaPayload, subPath?: string) {
        const joinedPath = path.join(usePath, subPath || '')
        return self.publish(payload, joinedPath)
      })

      for (const [subPath, dgramHandlers] of router[kDgramHandlers]) {
        const joinedPath = path.join(usePath, subPath)
        addHandlers(joinedPath, Array.from(dgramHandlers), self.dgramHandlers)
      }

      for (const [subPath, rpcHandlers] of router[kRpcHandlers]) {
        const joinedPath = path.join(usePath, subPath)
        addHandlers(joinedPath, Array.from(rpcHandlers), self.rpcHandlers)
      }
    }
    return this
  }

  /**
   * @param {VsoaPayload} payload
   * @param {string} [subPath]
   */
  publish (payload?: VppPayload, subPath?: string): VppRouter {
    for (const basePub of this[kBasePubCallbacks]) {
      basePub(buildVsoaPayload(payload), subPath)
    }
    return this
  }

  /**
   * Symbol protected memebers: internal use only
   */
  get [kRpcHandlers] () { return this.rpcHandlers.entries() }
  get [kDgramHandlers] () { return this.dgramHandlers.entries() }
  get [kBasePubCallbacks] () { return this.basePubCallbacks }
}

function assertArguments<T> (path: string, handlers: T[]) {
  assert(isUrlPath(path), `Invalid url path: "${path}"`)
  assert(handlers.length > 0 && handlers.every(f => typeof f === 'function'),
    'handler function(s) must be provided')
}

function addHandlers<T> (
  subPath: string,
  handlers: T[],
  targetContainer: Map<string, Set<T>>) {
  if (targetContainer.has(subPath)) {
    const origin = targetContainer.get(subPath)!
    for (const handler of handlers) {
      origin?.add(handler)
    }
  } else {
    targetContainer.set(subPath, new Set(handlers))
  }
}