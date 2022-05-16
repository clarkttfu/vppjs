import assert from 'assert'
import { Server, AF_INET, AF_INET6, VsoaPayload, VsoaRpc, RemoteClient } from 'vsoa'
import {
  VppCallback, VppError,
  VppDgramHandler, VppDgramRequest, VppDgramResponse,
  VppRpcHandler, VppRpcRequest, VppRpcResponse, VppBreak
} from './types'
import { RpcForward, DgramForward } from './adapters'
import { VppRouter } from './router'
import { isIPv4 } from './utilities'

export { Server, RemoteClient, VsoaPayload }
export { VppRouter, VppCallback, VppError }
export { VppDgramHandler, VppDgramRequest, VppDgramResponse }
export { VppRpcHandler, VppRpcRequest, VppRpcResponse }

export interface VppOptions {
  info?: string,
  passwd?: string,
  tlsOpt?: object
  captureRejections?: boolean
}

export class Vpp extends VppRouter {
  private server: Server
  private serverTlsOpt: undefined | object

  constructor (options?: VppOptions) {
    const opt: VppOptions = Object.assign({ info: 'Edge Container Stack Daemon' }, options)
    super(opt.captureRejections)
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
    initializeRoutes(server, this.dgramHandlers, this.rpcHandlers)

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

  publish (payload: VsoaPayload, urlpath = '/') {
    this.server.publish(urlpath, payload)
    return this
  }
}

export default vpp
export function vpp (vppOpt?: VppOptions): Vpp {
  return new Vpp(vppOpt)
}

export function router (this: any, captureRejections = false): VppRouter {
  return new VppRouter(captureRejections)
}

function initializeRoutes (
  server: Server,
  dgramRoutes: Map<string, VppDgramHandler[]>,
  rpcRoutes: Map<string, VppRpcHandler[]>,
  defaultErrorCode = 199) {
  server.ondata = function (cli: RemoteClient, urlpath: string, payload: VsoaPayload) {
    if (dgramRoutes.has(urlpath)) {
      const promise = DgramForward(dgramRoutes.get(urlpath)!, server, cli, urlpath, payload)
      promise.catch((err: VppError<VppDgramRequest, VppDgramResponse>) => {
        // default error handler
        if (!(err instanceof VppBreak)) {
          console.log(`Dgram handler error ${urlpath}`, err.cause)
        }
      })
    }
  }

  for (const [subPath, rpcHandlers] of rpcRoutes) {
    server.on(subPath, function (cli: RemoteClient, req: VsoaRpc, payload: VsoaPayload) {
      const promise = RpcForward(rpcHandlers, server, cli, req, payload)
      promise.catch((err: VppError<VppRpcRequest, VppRpcResponse>) => {
        // default error handler
        if (!(err instanceof VppBreak)) {
          console.log(`Dgram handler error ${req.url}`, err.cause)
          err.res.reply(undefined, defaultErrorCode)
        }
      })
    })
  }
}