import test from 'tape'
import * as vppjs from '../src'
const { Vpp, VppRouter } = vppjs

test('vppjs.vpp', t => {
  const vpp = vppjs.vpp()
  t.ok(vpp instanceof Vpp, 'vppjs.vpp() should return a vpp instance')
  t.end()
})

test('vppjs.router', t => {
  const r = vppjs.router()
  t.ok(r instanceof VppRouter, 'vpp.router() should return a router')
  t.end()
})