import assert from 'assert'

declare global {
  // eslint-disable-next-line no-unused-vars
  const Task: Function
}

const IS_JSRE = typeof global.Task === 'function'

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