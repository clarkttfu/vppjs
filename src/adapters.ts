import { Server, RemoteClient, VsoaRpc, VsoaPayload } from 'vsoa'
import { kRpcGet, kRpcSet } from './symbols'
import {
  VppDgramHandler, VppDgramRequest, VppDgramResponse,
  VppRpcHandler, VppRpcRequest, VppRpcResponse, VppPayload,
  VppHandler, VppRequest, VppResponse, VppError, VppBreak
} from './types'

const routerBreak = new VppBreak()

export async function RpcForward (
  rpcHandlers: VppRpcHandler[],
  server: Server, cli: RemoteClient,
  rpc: VsoaRpc, payload: VsoaPayload) {
//
  const urlpath = rpc.url
  const req: VppRpcRequest = {
    cli,
    url: urlpath,
    seqno: rpc.seqno,
    method: rpc.method,
    payload
  }

  const res: VppRpcResponse = {
    reply (payload: VppPayload, code = 0, seqno = rpc.seqno) {
      cli.reply(code, seqno, buildVsoaPayload(payload))
      return res
    },
    createStream (timeout?: number) {
      const stream = server.createStream(timeout)
      cli.reply(0, rpc.seqno, stream.tunid)
      return stream
    },
    datagram (payload: VppPayload, url = urlpath) {
      cli.datagram(url, buildVsoaPayload(payload))
      return res
    }
  }

  for (const handler of rpcHandlers) {
    switch (rpc.method) {
      case 0:
        if (handler[kRpcGet]) { await callHandler(req, res, handler) }
        break
      case 1:
        if (handler[kRpcSet]) { await callHandler(req, res, handler) }
        break
      default:
        break
    }
  }
}

export async function DgramForward (
  dgramHandlers: VppDgramHandler[],
  server: Server, cli: RemoteClient,
  urlpath: string, payload: VsoaPayload) {
//
  const req: VppDgramRequest = Object.assign({ url: urlpath, cli }, payload)
  const res: VppDgramResponse = {
    datagram (payload: VppPayload, url = urlpath) {
      cli.datagram(url, buildVsoaPayload(payload))
      return res
    }
  }

  for (const handler of dgramHandlers) {
    await callHandler(req, res, handler)
  }
}

function buildVsoaPayload (payload: VppPayload) {
  if (typeof payload === 'object') {
    if ('param' in (payload as VsoaPayload) || 'data' in payload) {
      return payload
    } else {
      return { param: payload }
    }
  } else if (typeof payload === 'string') {
    return { param: payload }
  } else if (payload == null) {
    return {}
  } else if (Buffer.isBuffer(payload)) {
    return { data: payload }
  } else {
    throw TypeError(`Invalid payload type ${typeof payload}`)
  }
}

function callHandler (req: VppRequest, res: VppResponse, handler: VppHandler) {
  return new Promise<void>(function (resolve, reject) {
    if (handler.length < 3) {
      try {
        const promise = handler(req, res)
        if (isPromiseLike(promise)) {
          promise!.then(resolve, err => reject(new VppError(req, res, err)))
        } else {
          reject(routerBreak)
        }
      } catch (err) {
        reject(err)
      }
    } else {
      try {
        handler(req, res, function (err: any) {
          if (err) {
            return reject(new VppError(req, res, err))
          }
          resolve()
        })
      } catch (err) {
        reject(new VppError(req, res, err))
      }
    }
  })
}

function isPromiseLike (p: any) {
  if (p) {
    if (p instanceof Promise) {
      return true
    }
    if (typeof p === 'object' && typeof p.then === 'function') {
      return true
    }
  }
}