import test from 'tape'
import { isUrlPath, buildVsoaPayload } from '../src/utilities'

test('utilities.isUrlPath', t => {
  t.notOk(isUrlPath(''), 'empty string is not a valid url path')
  t.notOk(isUrlPath('abc'), 'url path should start with /')
  t.ok(isUrlPath('/'), '/ is valid url path')
  t.end()
})

test('utilities.buildVsoaPayload', t => {
  t.equal(buildVsoaPayload(null), undefined, 'accept null')
  t.equal(buildVsoaPayload(), undefined, 'accept undefined')
  t.deepEqual(buildVsoaPayload('hello'), { param: 'hello' }, 'accept string')
  t.deepEqual(buildVsoaPayload(''), { param: '' }, 'accept empty string')
  t.deepEqual(buildVsoaPayload(-128), { param: '-128' }, 'convert number to string')

  t.deepEqual(buildVsoaPayload({ param: { foo: [99] } }), { param: { foo: [99] } },
    'accept raw .param object')
  t.deepEqual(buildVsoaPayload({ data: Buffer.from([3]) }), { data: Buffer.from([3]) },
    'accept raw .data buffer')
  t.deepEqual(buildVsoaPayload({ param: [22], data: Buffer.from([5]) }),
    { param: [22], data: Buffer.from([5]) }, 'accept raw .param and .data')

  t.deepEqual(buildVsoaPayload(Buffer.from([1, 2])), { data: Buffer.from([1, 2]) },
    'accept buffer as data')
  t.deepEqual(buildVsoaPayload({ foo: [23] }), { param: { foo: [23] } },
    'accept object as param')

  t.end()
})