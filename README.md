VSOA app framework like Express.js
----

## Get started

``` JavaScript
const vppjs = require('vppjs');
const vpp = vppjs();
const devices = {};

vpp.use('/ping', (req, res) => {
  if (req.method === 'datagram') {
    return res.datagram('/ping', 'pong');
  } 
});

vpp.get('/file/:id', (req, res) => {
  fs.createReadStream('./files/' + req.id).pipe(res.createStream());
});

vpp.set('/user/:id', (req, res) => {
  devices[req.id] = req.param;
  res.ok();
});

```