/* eslint-disable no-unused-vars */

declare module 'vsoa' {
  import { Duplex, EventEmitter } from 'stream'
  import { TlsOptions } from 'tls'

  type Callback = (err?: Error) => void

  // RPC methods
  enum VsoaRpcMethod {
    GET = 0,
    SET = 1
  }
  namespace method {
    const GET: VsoaRpcMethod.GET
    const SET: VsoaRpcMethod.SET
  }

  // RPC return code
  enum VsoaRpcCode {
    SUCCESS = 0,
    PASSWORD = 1,
    ARGUMENTS = 2,
    INVALID_URL = 3,
    NO_RESPONDING = 4,
    NO_PERMISSIONS = 5,
    NO_MEMORY = 6
  }
  namespace code {
    const SUCCESS: VsoaRpcCode.SUCCESS
    const PASSWORD: VsoaRpcCode.PASSWORD
    const ARGUMENTS: VsoaRpcCode.ARGUMENTS
    const INVALID_URL: VsoaRpcCode.INVALID_URL
    const NO_RESPONDING: VsoaRpcCode.NO_RESPONDING
    const NO_PERMISSIONS: VsoaRpcCode.NO_PERMISSIONS
    const NO_MEMORY: VsoaRpcCode.NO_MEMORY
  }

  const enum NetDomain {
    AF_INET = 2,
    AF_INET6 = 10,
  }
  const AF_INET = NetDomain.AF_INET
  const AF_INET6 = NetDomain.AF_INET6

  interface SocketAddr {
    domain?: NetDomain,
    addr?: string,
    port: number,
    backlog?: number
  }

  interface VsoaRpc {
    url: string,
    seqno: number,
    method: VsoaRpcMethod
  }

  interface VsoaStream extends Duplex {
    tunid: string
  }

  interface VsoaPayload {
    param?: object,
    data?: Buffer,
    offset?: number,
    length?: number
  }

  interface ServerOptions {
    info: string,
    passwd?: string
  }

  interface RemoteClient {
    address(): string,
    priority(p: number): void,
    setKeepAlive(b: boolean): void,
    sendTimeout(ms: number): void,
    close(): void,
    reply(code: number, seqno: number, payload: VsoaPayload): void,
    datagram(url: string, payload: VsoaPayload): void
  }

  class Server extends EventEmitter {
    constructor(options: ServerOptions)
    createStream(timeout?: number): VsoaStream
    publish(url: string, payload: VsoaPayload): void
    ondata: (cli: RemoteClient, url: string, payload: VsoaPayload) => void
    onclient: (cli: RemoteClient, connect: boolean) => void
    start(saddr: SocketAddr, tslOpt?: TlsOptions, callback?: Callback): void
    close(callbac?: Callback): void
  }
}