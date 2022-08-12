vpp.js
====

VSOA app framework like Express.js

## Get started

``` JavaScript
const vppjs = require('vppjs');
const vpp = vppjs.vpp();

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

#### Vpp Event 'connect' and 'disconnect'

These events are emitted when client is connected or disconnected:

- cli: RemoteClient, the [VSOA remote client](https://www.edgeros.com/edgeros/api/VSOA%20EXTENSION/vsoa.html#VSOA%20Remote%20Client%20Object) object
- server: VsoaServer, the [VSOA Server](https://www.edgeros.com/edgeros/api/VSOA%20EXTENSION/vsoa.html#VSOA%20Server%20Object) object

```
vpp.on('connect', (cli, server) => {
  // do something
})
```

#### vpp.contructor(options)
- `options`: *{VppOptions}*
  - `info`: *{String|Object}*, for VSOA server info, default 'Vpp.js'
  - `passwd`: *{String}*, for VSOA server authentication
  - `tlsOpt`: *{Object}*, Node.js TLS options object, for VSOA TLS server setup
  - `defaultErrorCode`: *{Number}*, range from 128 to 255, default 199. This is used
    by the default error handler to send reply for unhandled server error.

#### vpp.start(port[, host][, backlog][, callback])
- `port`: *{Number}*, port number the VSOA server to listen
- `host`: *{String}*, host name the VSOA server to listen
- `backlog`: *{Number}*, TCP connection backlog, check Node.js document for more information
- `callback`: *{Function}*, callback function when the server socket is listening

#### vpp.stop ([callback])
- `callback`: *{Function}*, callback function when the server is stopped

#### vpp.publish (payload[, urlpath])

- `payload`: *{VsoaPayload}*, the raw VSOA request payload object
  - `param`: *{String|Object}*, payload param data
  - `data`: *{Buffer}*, optional payload data
  - `offset`: *{Number}*, optional offset of payload data inside the given buffer
  - `length`: *{Number}*, optional length of actual payload data inside the buffer
- `urlpath`: *{String}*, optional url path of publishement, defaults '/'.


### VppRouter class

**Note:** unlike Expres.js, the Vpp or VppRouter instance for now, cannot use
arbitrary `(req, res, nex) => {}` middleware function, but router intances only!

#### router.use(subPath, ...routers): VppRouter
- `subPath`: *{String}*, the mounting url sub path (relative to the parent router/vpp)
  for the given sub routers
- `routers`: *{VppRouter}*, the sub routers to mount

#### router.get(subPath, ...getHandlers): VppRouter
- `subPath`: *{String}*, the mounting url sub path for the given RPC handlers.
- `getHandlers`: *{VppRpcHandler}*, handlers that will be called once there are **GET**
  RPC calls to the joined URL (parent url path + subPath).

#### router.set(subPath, ...setHandlers): VppRouter
- `subPath`: *{String}*, the mounting url sub path for the given RPC handlers.
- `setHandlers`: *{VppRpcHandler}*, handlers that will be called once there are **SET**
  RPC calls to the joined URL.

#### router.dgram(subPath, ...dgramHandlers): VppRouter
- `subPath`: *{String}*, the mounting url sub path for the given Datagram handlers.
- `dgramHandlers`: *{DgramHandler}*, handlers that will be called once there are **DGRAM**
  messages sent to the joined URL.

#### router.publish(payload[, subPath]): VppRouter
- `payload`: [VppPayload](#vpppayload)
- `subPath`: *{String}*, optional url path of publishement, defaults '/'.

### VppPayload

When working with VppRouter object, APIs that accecpt VppPayload can help
automatically convert it into the **raw** VsoaPayload:
- if vppPayload is a Buffer, it will be mapped to VsoaPayload.data (you cannot
  pass `offset` and `length` in this form)
- if vppPayload is a String or Number, it will be mapped to VsoaPayload.param
- if vppPayload is an Object and has 'param' or 'data' property, it wll be 
  sent directly as RAW VsoaPayload.

### VppRpcHandler(req, res[, next])

If this function returns a Promise, routers mounted after this one will be called
once it is resolved, otherwise the router chain will break if the promise is rejected.

If this function returns anything other than a promise object. Developer can 
still use the last `next` callback to trigger following routers. If `next` is
omitted, Vpp will break the router chain right after currrent handler call.

- `req`: [VppRpcRequest](#VppRpcRequest)
- `res`: [VppRpcResponse](#VppRpcResponse)
- `next`: optional Node.js style callback function

### VppRpcRequest

#### req.cli
VSOA RemoteClient object, which could be used to call original VSOA client API.

#### req.url
A string of the targeting url of the incoming RPC call.

#### req.seqno
Number of the raw RPC call `seqno`.

#### req.method
Enum value of `VsoaRpcMethod`, an integer number of [VSOA RPC call method](https://www.edgeros.com/edgeros/api/VSOA%20EXTENSION/vsoa.html#vsoa.method): 0 = **GET**, 1 = **SET**.

#### req.payload
Incoming raw *{VsoaPayload}* object, see [publish section](#vpppublish-payload-urlpath)

### VppRpcResponse

#### res.server
Raw VSOA Server object, which might be used for advanced usecases.

#### res.reply(payload[, code][, segno]): VppRpcResponse
- `payload`: *{VppPayload}*, see [VppPayload section](#vpppayload).
- `code`: *{Number}*, optional VSOA status code, default 0.
- `seqno`: *{Number}*, sequence number to respond, default to the one from `req`.

#### res.publish(payload[, url]): VppRpcResponse
- `payload`: *{VppPayload}*, see [VppPayload section](#vpppayload).
- `url`: *{String}*, optional url to publish, default to the incoming RPC call url.

#### res.datagram(payload[, url]): VppRpcResponse
- `payload`: *{VppPayload}*, see [VppPayload section](#vpppayload).
- `url`: *{String}*, optional url to send the datagram, default to the incoming
  RPC call url.

#### res.createStream([payload], [timeout]): VsoaStream
- `payload`: *{VppPayload|undefined}*, see [VppPayload section](#vpppayload).
- `timeout`: *{Number}*, optional timeout in milliseconds, use default VSOA value.

### VppDgramHandler(req, res[, next])

Router handling logic is same as VppRpcHandler.

- `req`: *{VppDgramRequest}*
- `res`: *{VppDgramResponse}*
- `next`: Node.js style callback function

### VppDgramRequest

#### dgramReq.url
A string of the targeting url of this incoming datagram.

#### dgramReq.cli
VSOA RemoteClient object, which could be used to call original VSOA client API.

#### dgramReq.payload

Incoming raw *{VsoaPayload}* object, see [publish section](#vpppublish-payload-urlpath)

### VppDgramResponse

#### dgramRes.server
Raw VSOA Server object, which might be used for advanced usecases.

#### dgramRes.publish(payload[, url]): VppDgramResponse
- `payload`: *{VppPayload}*, see [VppPayload section](#vpppayload).
- `url`: *{String}*, optional url to publish, default to the incoming datagram's url.

#### dgramRes.datagram (payload[, url]): VppDgramResponse
- `payload`: *{VppPayload}*, see [VppPayload section](#vpppayload).
- `url`: *{String}*, optional targeting url of this replying datagram, default to 
  the incoming datagram's url.


TODO
- [ ] more unit tests
- [ ] accept error handlers
- [ ] simple request logging middleware
- [ ] scaffolding scripts