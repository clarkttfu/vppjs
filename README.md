vpp.js
====

VSOA app framework like Express.js

## Get started

``` JavaScript
const vppjs = require('vppjs');
const vpp = vppjs();

const router = vpp.Router()
const devices = {};

router.dgram('/ping', (req, res) => {
  return res.datagram({ param: 'pong'});
});

router.get('/file/', (req, res) => {
  const fileId = req.payload.param;
  fs.createReadStream('./files/' + fileId).pipe(res.createStream());
});

router.set('/user/', (req, res) => {
  const userInfo = req.payload.param;
  devices[userInfo.id] = userInfo;
  res.reply('ok');
});

vpp.use('/foo', router);
```