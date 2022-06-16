import { Server, RemoteClient, VsoaRpc, VsoaPayload } from 'vsoa'
import { kRpcGet, kRpcSet } from './symbols'
import {
  VppDgramHandler, VppDgramRequest, VppDgramResponse,
  VppRpcHandler, VppRpcRequest, VppRpcResponse, VppPayload,
  VppHandler, VppRequest, VppResponse, VppBreak
} from './types'
import { buildVsoaPayload, isPromise } from './utilities'

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
    server,
    reply (payload: VppPayload, code = 0, seqno = rpc.seqno) {
      cli.reply(code, seqno, buildVsoaPayload(payload))
      return res
    },
    publish (payload: VppPayload, url = urlpath) {
      server.publish(url, buildVsoaPayload(payload))
      return res
    },
    datagram (payload: VppPayload, url = urlpath) {
      cli.datagram(url, buildVsoaPayload(payload))
      return res
    },
    createStream (timeout?: number) {
      const stream = server.createStream(timeout)
      cli.reply(0, rpc.seqno, stream.tunid)
      return stream
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
  const req: VppDgramRequest = { url: urlpath, cli, payload }
  const res: VppDgramResponse = {
    server,
    publish (payload: VppPayload, url = urlpath) {
      server.publish(url, buildVsoaPayload(payload))
      return res
    },
    datagram (payload: VppPayload, url = urlpath) {
      cli.datagram(url, buildVsoaPayload(payload))
      return res
    }
  }

  for (const handler of dgramHandlers) {
    await callHandler(req, res, handler)
  }
}

function callHandler (req: VppRequest, res: VppResponse, handler: VppHandler) {
  return new Promise<void>(function (resolve, reject) {
    if (handler.length < 3) {
      try {
        const promise = handler(req, res)
        if (isPromise(promise)) {
          promise!.then(resolve, err => reject(err))
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
            return reject(err)
          }
          resolve()
        })
      } catch (err) {
        reject(err)
      }
    }
  })
}
