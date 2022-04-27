import path from 'path'
import assert from 'assert'
import { EventEmitter } from 'events'
import { isIPv4 } from 'net'
import { Server, AF_INET, AF_INET6, VsoaPayload, VsoaRpc, RemoteClient } from 'vsoa'
import { kRpcGetHandlers, kRpcSetHandlers, kDgramHandlers, kRpcSubPaths } from './symbols'
import { RpcForward, DgramForward } from './adapters'
import { VppRouter } from './router'
import { VppCallback, VppHandler } from './vpp-types'

export default vppjs
export function Router (this: any) {
  if (!(this instanceof VppRouter)) {
    return new VppRouter()
  }
}

export interface VppOptions {
  info?: string,
  passwd?: string,
  tlsOpt?: object
  captureRejections?: boolean
}

export class Vpp extends EventEmitter {
  private server: Server
  private serverTlsOpt: undefined | object
  private routes = new Map<string, VppRouter>()

  constructor (options: VppOptions) {
    const opt: VppOptions = Object.assign({ info: 'Edge Container Stack Daemon' }, options)
    super({ captureRejections: opt.captureRejections })
    this.server = new Server({ info: opt.info!, passwd: opt.passwd })
    this.serverTlsOpt = opt.tlsOpt
  }

  /**
   * @param {number} port tcp port number
   * @param {string} [host] ipv4 or ipv6 address
   * @param {number} [backlog] tcp server backlog
   * @param {function} [callback] tcp server backlog
   * @returns {VsoaNativeServer}
   */
  start (port: number, host?: string, backlog?: number, callback?: VppCallback) {
    if (typeof host === 'function') {
      callback = host
      host = undefined
      backlog = undefined
    } else if (typeof backlog === 'function') {
      assert(host && typeof host === 'string', 'Server host must be a string')
      callback = backlog
      backlog = undefined
    }
    assert(port && typeof port === 'number', 'Server port must be a number')

    if (host == null || host === 'localhost') {
      host = '127.0.0.1'
    }

    const saddr = {
      domain: isIPv4(host) ? AF_INET : AF_INET6,
      addr: host,
      port,
      backlog
    }

    const self = this
    const server = self.server
    const routes = self.routes

    server.ondata = function (cli: RemoteClient, url: string, payload: VsoaPayload) {
      for (const [basePath, router] of routes) {
        if (url.startsWith(basePath)) {
          DgramForward(router[kDgramHandlers], basePath, server, cli, url, payload)
        }
      }
    }
    server.onclient = function (cli: RemoteClient, connect: boolean) {
      if (connect) {
        self.emit('connect', cli, server)
      } else {
        self.emit('disconnect', cli, server)
      }
    }
    server.start(saddr, self.serverTlsOpt, callback)

    return self
  }

  stop (callback?: VppCallback) {
    this.server.close(callback)
    return this
  }

  /**
   * Mount module handler to vsoa url
   * @param {string} basePath module mount point
   * @param {VppRouter} moduleRouter
   */
  use (basePath: string | VppRouter, moduleRouter?: VppRouter) {
    if (basePath instanceof VppRouter) {
      moduleRouter = basePath
      basePath = '/'
    } else {
      assert(basePath && typeof basePath === 'string', 'url must be a string')
      assert(moduleRouter instanceof VppRouter)
    }

    const server = this.server
    this.routes.set(basePath, moduleRouter)

    moduleRouter.on('publish', function (subPath: string, payload: any) {
      const fullpath = path.join(basePath as string, subPath)
      server.publish(fullpath, payload)
    })

    for (const subPath of moduleRouter[kRpcSubPaths]) {
      const fullpath = path.join(basePath, subPath)
      server.on(fullpath, function (cli: RemoteClient, req: VsoaRpc, payload: VsoaPayload) {
        let rpcHandlers: IterableIterator<VppHandler[]>
        switch (req.method) {
          case 1:
            rpcHandlers = moduleRouter![kRpcSetHandlers]; break
          default: // 0: GET
            rpcHandlers = moduleRouter![kRpcGetHandlers]
        }
        RpcForward(rpcHandlers, server, cli, req, payload)
      })
    }
  }
}

function vppjs (vppOpt: VppOptions) {
  return new Vpp(vppOpt)
}
