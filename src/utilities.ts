import assert from 'assert'

const IS_JSRE = (function () {
  try {
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