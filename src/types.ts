import { RemoteClient, VsoaPayload, method as VsoaRpcMethod, VsoaStream } from 'vsoa'
import { kRpcMethod } from './symbols'

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
  reply (payload?: VppPayload, code?: number, seqno?: number): void
  createStream (timeout?: number): VsoaStream
  datagram (payload: VppPayload, url?: string): void
}

export type VppRpcHandler = {(
  req: VppRpcRequest,
  res: VppRpcResponse,
  next?: VppCallback
): Promise<any>|undefined,
  [kRpcMethod]?: VsoaRpcMethod
}

export interface VppDgramRequest extends VsoaPayload {
  url: string,
  cli: RemoteClient
}
export interface VppDgramResponse {
  datagram (payload: VppPayload, url?: string): void
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