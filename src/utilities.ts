import assert = require('assert')
import path = require('path')
import { VsoaPayload } from 'vsoa'
import { VppPayload } from './types'

const IS_JSRE = (function () {
  try {
    require('iosched')
    // eslint-disable-next-line n/no-deprecated-api
    return require('sys').kernName() === 'SylixOS'
  } catch (err) {
    return false
  }
})()

export function isUrlPath (urlpath?: string) {
  return urlpath && typeof urlpath === 'string' && urlpath.startsWith('/')
}

export function assertUrlPath (urlpath?: string, msg?: string) {
  assert(isUrlPath(urlpath), msg || `Invalid url path: "${urlpath}"`)
}

export function isIPv4 (ipaddr: string) {
  if (IS_JSRE) {
    return require('inetaddr').isIPv4(ipaddr)
  } else {
    return require('net').isIPv4(ipaddr)
  }
}

export function isPromise (p: any) {
  if (p instanceof Promise) {
    return true
  }
  if (p && typeof p.then === 'function') {
    return true
  }
}

export function pathJoin (...paths: string[]): string {
  return (path.posix?.join || path.join).apply(null, paths)
}

/**
 * Candy function that automatically build VSOA payload object:
 * 1. if input is an object and
 *   a. it contains 'param' field then raw VSOA payload is assumed;
 *   b. it contains 'data' field of Buffer then raw VSOA payload  is assumed;
 *   c. OTHERWISE plain object is assumed, send it as 'param'.
 * 2. if input is string, send it as 'param'.
 * 3. if input is Buffer, send it as 'data'.
 * 4. if input is number, convert it to string then send as 'param', because
 *    VSOA will IGNORE number in payload.param.
 * 5. OTHERWISE, returns undefined
 */
export function buildVsoaPayload (payload?: VppPayload): VsoaPayload | undefined {
  switch (typeof payload) {
    case 'object':
      if (Buffer.isBuffer(payload)) {
        return { data: payload }
      } else if (payload == null) {
        return undefined
      } else if (payload.param || Buffer.isBuffer(payload.data)) {
        return payload
      } else {
        return { param: payload }
      }
    case 'string':
      return { param: payload }
    case 'number':
      return { param: String(payload) }
    case 'undefined':
      return undefined
    default:
      throw TypeError(`Invalid payload type ${typeof payload}`)
  }
}