## smiggles

The ultimate in node cerealization.

```js
const {serialize, deserialize} = require('smiggles');

const obj = ['lol', 2, [true, false], null, {fail: 'whale', trail: {ail: 'kale'}}, Uint8ClampedArray.from([7]), null, Uint16Array.from([8]), Float32Array.from([1,2,3,4])];
const arrayBuffer = smiggles.serialize(obj); // ArrayBuffer
// const arrayBuffer = smiggles.serialize(obj, new ArrayBuffer(1024)); // pass in an optional ArrayBuffer to use
const result = smiggles.deserialize(buffer); // Array

equals(obj, result); // true
```

Works with all JSON types, as well as typed arrays, with proper alignment, and _zero copy_ on either size for typed arrays (it just points into the correct `ArrayBuffer` offsets). This basically lets you send binary data, _fast_. Think Protobuf in node land. Pure JS.

Note that `serialize` takes an optional `ArrayBuffer` for serialize into: it must be big enough to hold the serialized result. If it is not big enough you will get a throw.

Throws if it cannot `serialize`/`deserialize` the thing you put in. If you get a result back, the result should be transparent.
