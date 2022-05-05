import { Server, RemoteClient, VsoaRpc, VsoaPayload } from 'vsoa'
import { kRpcMethod } from './symbols'
import {
  VppDgramHandler, VppDgramRequest, VppDgramResponse,
  VppRpcHandler, VppRpcRequest, VppRpcResponse,
  VppHandler, VppRequest, VppResponse, VppError, VppPayload
} from './types'

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
    if (handler[kRpcMethod] !== rpc.method) {
      continue
    }
    await callHandler(req, res, handler)
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
  } else if (Buffer.isBuffer(payload)) {
    return { data: payload }
  } else {
    throw TypeError(`Invalid payload type ${typeof payload}`)
  }
}

function callHandler (req: VppRequest, res: VppResponse, handler: VppHandler) {
  return new Promise<void>(function (resolve, reject) {
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
  })
}