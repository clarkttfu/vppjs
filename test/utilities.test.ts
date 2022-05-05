import test from 'tape'
import { isUrlPath } from '../src/utilities'

test('utilities.isUrlPath', t => {
  t.notOk(isUrlPath(''), 'empty string is not a valid url path')
  t.notOk(isUrlPath('abc'), 'url path should start with /')
  t.ok(isUrlPath('/'), '/ is valid url path')
  t.end()
})