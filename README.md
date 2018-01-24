## smiggles

The ultimate in node cerealization.

```js
const {serialize, deserialize} = require('smiggles');

const obj = ['lol', 2, [true, false], null, {fail: 'whale', trail: {ail: 'kale'}}, Uint8ClampedArray.from([7]), null, Uint16Array.from([8]), Float32Array.from([1,2,3,4])];
const buffer = smiggles.serialize(obj); // [Buffer]
const result = smiggles.deserialize(buffer); // Array

equals(obj, result); // true
```

Works with all JSON types, as well as typed arrays, with proper alignment, and _zero copy_ on either size for typed arrays (it just points into the correct `ArrayBuffer` offsets). This basically lets you send binary data, _fast_. Think Protobuf in node land. Pure JS.

What comes out of `serialize` is not a `Buffer`, but an array of `Buffer`. We do this for efficiency to prevent reallocations, and it's perfectly convenient if you want to blast-`write` the buffers serially anyway. You can `Buffer.concat` the `Buffer` array into a single `Buffer` if you like; `deserialize` will accept either format. Just beware if you do this you could be slowing down your code.

Throws if it cannot `serialize`/`deserialize` the thing you put in. If you get a result back, the result shold be transparent.
