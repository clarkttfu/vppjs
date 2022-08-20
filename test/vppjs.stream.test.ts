import test from 'tape'
import * as vppjs from '../src'

test('vppjs stream', t => {
  const port = 3399
  const vsoa = require('vsoa')
  const vpp = vppjs.vpp()

  vpp.get('/', function (_, res) {
    const s = res.createStream()
      .on('connect', () => {
        s.write('hello')
        s.end()
      })
  })

  vpp.start(port, (err?: Error): void => {
    if (err) return t.fail(err.message)

    const client = new vsoa.Client()
    client.connect({ addr: 'localhost', port }, (err: Error) => {
      if (err) return t.fail('failled connect to test server')
      client.call('/', (err: Error, payload: vppjs.VsoaPayload, tunid: Number) => {
        if (err) return t.fail('failled to start stream rpc call')

        client.createStream(tunid)
          .on('data', (chunk: Buffer|string) => {
            t.equal(chunk.toString(), 'hello', 'call stream call')
            t.end()
            client.close()
            vpp.stop()
          })
      })
    })
  })
})