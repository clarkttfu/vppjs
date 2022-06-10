import { RemoteClient, VsoaPayload, method as VsoaRpcMethod, VsoaStream, Server } from 'vsoa'
import { kRpcGet, kRpcSet } from './symbols'

declare interface VppRouter {}

export type VppPayload = string | Buffer | object
export type VppCallback = (err?: Error, data?: any) => void

export type VppPublish = (payload: VppPayload, subPath?: string) => VppRouter

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
  pulish (payload: VppPayload, url?: string): VppRpcResponse
  datagram (payload: VppPayload, url?: string): VppRpcResponse
  createStream (timeout?: number): VsoaStream
}

export type VppRpcHandler = {(
  req: VppRpcRequest,
  res: VppRpcResponse,
  next?: VppCallback
): Promise<any>|undefined,
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
  pulish (payload: VppPayload, url?: string): VppDgramResponse
  datagram (payload: VppPayload, url?: string): VppDgramResponse
}
export type VppDgramHandler = (
  req: VppDgramRequest,
  res: VppDgramResponse,
  next?: VppCallback
) => Promise<any>|undefined

export type VppRequest = VppRpcRequest | VppDgramRequest
export type VppResponse = VppRpcResponse | VppDgramResponse
export type VppHandler = (req: any, res: any, next?: VppCallback) => Promise<any>|undefined

export class VppError<U, V> extends Error {
  constructor (public req: U, public res: V, public cause: any) {
    super(cause instanceof Error ? cause.message : String(cause))
  }
}

export class VppBreak extends Error {
  constructor () {
    super('Vppjs Router break')
  }
}