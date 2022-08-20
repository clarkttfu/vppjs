import { RemoteClient, VsoaPayload, method as VsoaRpcMethod, VsoaStream, Server } from 'vsoa'
import { kRpcGet, kRpcSet } from './symbols'

export const AF_INET = 2
export const AF_INET6 = 10

declare interface VppRouter {}

export type VppPayload = string | Buffer | object
export type VppCallback = (err?: Error, data?: any) => void

export type VppPublish = (payload?: VppPayload, subPath?: string) => VppRouter

export interface VppRpcRequest {
  url: string,
  seqno: number,
  cli: RemoteClient,
  method: VsoaRpcMethod,
  payload: VsoaPayload
}
export interface VppRpcResponse {
  server: Server,
  reply (payload?: VppPayload, code?: number, seqno?: number): VppRpcResponse
  publish (payload: VppPayload, url?: string): VppRpcResponse
  datagram (payload: VppPayload, url?: string): VppRpcResponse
  createStream (payload?: VppPayload, timeout?: number): VsoaStream
}

export type VppRpcHandler = {(
  req: VppRpcRequest,
  res: VppRpcResponse,
  next?: VppCallback
): Promise<any>|void,
  [kRpcGet]?: boolean
  [kRpcSet]?: boolean
}

export interface VppDgramRequest {
  url: string,
  cli: RemoteClient,
  payload: VsoaPayload
}
export interface VppDgramResponse {
  server: Server,
  publish (payload: VppPayload, url?: string): VppDgramResponse
  datagram (payload: VppPayload, url?: string): VppDgramResponse
}
export type VppDgramHandler = (
  req: VppDgramRequest,
  res: VppDgramResponse,
  next?: VppCallback
) => Promise<any>|void

export type VppRequest = VppRpcRequest | VppDgramRequest
export type VppResponse = VppRpcResponse | VppDgramResponse
export type VppHandler = VppRpcHandler | VppDgramHandler

export class VppBreak extends Error {
  constructor () {
    super('Vppjs Router break')
  }
}