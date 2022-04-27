import assert from 'assert'

export function isUrlPath (urlpath: string) {
  return urlpath && typeof urlpath === 'string' && urlpath.startsWith('/')
}

export function assertUrlPath (urlpath: string, msg: string) {
  assert(isUrlPath(urlpath), msg || `Invalid url path: "${urlpath}"`)
}