/**
 * server.publish(url[, payload])
 * server.syncer(cli, request, payload, target[, setter])
 * server.createStream([timeout])
 *
 * cli.reply(code, seqno[, payload][, tunid])
 * cli.datagram(url, payload)
 */

import path from 'path'
import { Server, RemoteClient, VsoaRpc, VsoaPayload } from 'vsoa'
import { VppHandler } from './vpp-types'

export function RpcForward (
  rpcHandlersIter: IterableIterator<VppHandler[]>,
  server: Server, cli: RemoteClient,
  rpc: VsoaRpc, payload: VsoaPayload) {
  const urlpath = rpc.url
  const req = {
    url: urlpath,
    seqno: rpc.seqno,
    method: rpc.method,
    payload
  }

  const res = {
    reply (payload: VsoaPayload, code = 0, seqno = rpc.seqno) {
      cli.reply(code, seqno, payload)
      return res
    },
    createStream (timeout?: number) {
      const stream = server.createStream(timeout)
      cli.reply(0, rpc.seqno, stream.tunid)
      return stream
    },
    datagram (payload: VsoaPayload, url = urlpath) {
      cli.datagram(url, payload)
      return res
    }
  }

  for (const rpcHandlers of rpcHandlersIter) {
    for (const handler of rpcHandlers) {
      try {
        handler(req, res)
      } catch (err) {
        break
      }
    }
  }
}

export function DgramForward (
  dgramHandlersIter: IterableIterator<[string, VppHandler[]]>,
  basePath: string, server: Server, cli: RemoteClient,
  urlpath: string, payload: VsoaPayload) {
  const res = {
    datagram (payload: VsoaPayload, url = urlpath) {
      cli.datagram(url, payload)
      return res
    }
  }

  for (const [subPath, dgramHandlers] of dgramHandlersIter) {
    const fullPath = path.join(basePath, subPath)
    if (urlpath !== fullPath) continue

    for (const dgramHandler of dgramHandlers) {
      try {
        dgramHandler(payload, res)
      } catch (err) {
        break
      }
    }
  }
}
