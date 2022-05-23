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

## API 

### vppjs.vpp() 

Create a new instance of [Vpp class](#vpp-class).

### vppjs.router() 

Create a new instance of [VppRouter class](#vpprouter-class).

### Vpp class

#### contructor(options)
- options: VppOptions
  - info: string or object, for VSOA server info, default 'Vpp.js'
  - passwd: string, for VSOA server authentication
  - tlsOpt: object, Node.js TLS options object, for VSOA TLS server setup
  - defaultErrorCode: Number range from 128 to 255, default 199. This is used
    by the default error handler to send reply for unhandled server error.

#### start(port, host?, backlog?, callback?)
- port: number, port number the VSOA server to listen
- host: string, host name the VSOA server to listen
- backlog: TCP connection number backlog, check Node.js document for more
  information
- callback: function, callback function when the server is listening

#### stop (callback?)
- callback: function, callback function when the server is stopped

#### publish (payload, urlpath = '/)
- payload: VsoaPayload, the raw VSOA request payload object
  - param?: String or Object, payload param data
  - data?: Buffer, optional payload data
  - offset? number, the offset of payload data inside the given buffer
  - length? number, the actual length of payload data inside the buffer
- urlpath: string, optional url path of publishement, defaults '/'.

#### Event 'connect' / 'disconnect'

- cli: RemoteClient, the [VSOA remote client](https://www.edgeros.com/edgeros/api/VSOA%20EXTENSION/vsoa.html#VSOA%20Remote%20Client%20Object) object
- server: VsoaServer, the [VSOA Server](https://www.edgeros.com/edgeros/api/VSOA%20EXTENSION/vsoa.html#VSOA%20Server%20Object) object

These events are emitted when client is connected or disconnected.

### VppRouter class

**Note, unlike Expres.js, the Vpp or VppRouter instance, for now, cannot use any
 `(req, res, nex) => {}` middleware function, but router intances only!**

#### use(subPath, ...routers): VppRouter
- subPath: string, the mounting url sub path (relative to the parent router/vpp)
  for the given sub routers
- routers: VppRouter, the sub routers to mount

#### get(subPath, ...getGandlers): VppRouter
- subPath: string, the mounting url sub path for the given RPC handlers.
- getHandlers: VppRpcHandler, handlers that will be called once there are **GET**
  RPC calls to the joined URL (parent url path + subPath).

#### set(subPath, ...setGandlers): VppRouter
- subPath: string, the mounting url sub path for the given RPC handlers.
- setHandlers: VppRpcHandler, handlers that will be called once there are **SET**
  RPC calls to the joined URL.

#### dgram(subPath, ...dgramHandlers): VppRouter
- subPath: string, the mounting url sub path for the given Datagram handlers.
- dgramHandlers: DgramHandler, handlers that will be called once there are **DGRAM**
  messages sent to the joined URL.

#### publish(vppPayload, subPath?): VppRouter
- vppPayload: VppPayload, which will be automatically converted to VsoaPayload.
- subPath: stirng, optional url path of publishement, defaults '/'.

#### VppPayload

When working with VppRouter object, APIs that accecpt VppPayload can help
automatically convert your input into the RAW VsoaPayload:
- if vppPayload is a Buffer, it will be mapped to VsoaPayload.data
- if vppPayload is a String, it will be mapped to VsoaPayload.param
- if vppPayload is an Object and has 'param' or 'data' property, it wll be 
  sent directly as RAW VsoaPayload.

#### VppRpcHandler(req, res, next?)

If this function returns a Promise, routers mounted after this one will be called
once it is resolved, otherwise the router chain will break if the promise is rejected.

If this function returns anything other than a promise object. Developer can 
still use the last `next` callback to trigger following routers. If `next` is
omitted, Vpp will break the router chain right after currrent handler call.

- req: VppRpcRequest
  - url: string, the targeting url of the incoming RPC call.
  - cli: RemoteClient, VSOA RemoteClient object.
  - method: VsoaRpcMethod, integer number of [VSOA RPC call method](https://www.edgeros.com/edgeros/api/VSOA%20EXTENSION/vsoa.html#vsoa.method), 0 = **GET**, 1 = **SET**.
  - payload: VsoaPayload, sed [publish section](#publish-payload-urlpath)
- res: VppRpcResponse
  - reply(payload?, code?, segno?)
    - payload: VppPayload, see [VppPayload section](#vpppayload).
    - code: optional VSOA status code, default 0.
    - seqno: the sequence number call respond to, default to the corresponding one.
- next: function, typical Node.js callback function

#### VppDgramHandler(req, res, next?)

Router handling logic is same as VppRpcHandler.

- req: VppDgramRequest
  - url: string, the targeting url of this incoming datagram.
  - cli: RemoteClient, VSOA RemoteClient object.
- res: VppDgramResponse
  - datagram (payload, url?)
    - payload: VppPayload, see [VppPayload section](#vpppayload).
    - url: string, optional targeting url of this replying datagram, default to 
      the incoming datagram's url.



TODO
- [ ] more tests
- [ ] accept error handlers
- [ ] simple request logging middleware
- [ ] scaffolding scripts