import assert = require('assert')
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

export function buildVsoaPayload (payload?: VppPayload): VsoaPayload | undefined {
  const type = typeof payload
  if (type === 'object') {
    const rawPayload = payload as VsoaPayload
    if (Buffer.isBuffer(rawPayload.data)) {
      return payload
    } else if (rawPayload.param) {
      return payload
    } else {
      return { param: payload }
    }
  } else if (type === 'string' || type === 'number') {
    return { param: payload }
  } else if (Buffer.isBuffer(payload)) {
    return { data: payload }
  } else if (payload != null) {
    throw TypeError(`Invalid payload type ${typeof payload}`)
  }
}