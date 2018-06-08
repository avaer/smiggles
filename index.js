let id = 0;
const TYPES = {
  boolean: id++,
  number: id++,
  string: id++,
  null: id++,
  array: id++,
  object: id++,
  ArrayBuffer: id++,
  Int8Array: id++,
  Uint8Array: id++,
  Uint8ClampedArray: id++,
  Int16Array: id++,
  Uint16Array: id++,
  Int32Array: id++,
  Uint32Array: id++,
  Float32Array: id++,
  Float64Array: id++,
  ImageBitmap: id++,
  undefined: id++,
};

let localImageBitmap = null;
let localRawBuffer = null;

const LINKAGE = {
  INLINE: 0,
  TRANSFER: 1,
};
const transferListSymbol = Symbol();

const _typeBuffer = typeId => {
  const uint8Array = Uint8Array.from([typeId]);
  return new Buffer(uint8Array.buffer, uint8Array.byteOffset, uint8Array.byteLength);
};
const _alignLength = (n, alignment) => {
  const offset = n % alignment;
  if (offset !== 0) {
    return alignment - offset;
  } else {
    return 0;
  }
};
const _alignBuffer = (n, alignment) => {
  const alignLength = _alignLength(n, alignment);
  if (alignLength !== 0) {
    return Buffer.alloc(alignLength);
  } else {
    return null;
  }
};
const _lengthBuffer = length => {
  const uint32Array = Uint32Array.from([length]);
  return new Buffer(uint32Array.buffer, uint32Array.byteOffset, uint32Array.byteLength);
};
const _booleanBuffer = b => {
  const uint8Array = Uint8Array.from([+b]);
  return new Buffer(uint8Array.buffer, uint8Array.byteOffset, uint8Array.byteLength);
};
const _numberBuffer = n => {
  const float64Array = Float64Array.from([n]);
  return new Buffer(float64Array.buffer, float64Array.byteOffset, float64Array.byteLength);
};
const _addressBuffer = address => {
  const uint32Array = Uint32Array.from(address);
  return new Buffer(uint32Array.buffer, uint32Array.byteOffset, uint32Array.byteLength);
};
const serialize = (o, transferList = [], arrayBuffer = new ArrayBuffer(getSize(o, transferList))) => {
  const buffer = new Buffer(arrayBuffer, 0, arrayBuffer.byteLength);
  let length = 0;

  const _serializeTypedArray = (typedArray, type) => {
    buffer.set(_typeBuffer(type), length);
    length += Uint8Array.BYTES_PER_ELEMENT;

    const linkage = transferList.includes(typedArray.buffer) ? LINKAGE.TRANSFER : LINKAGE.INLINE;
    buffer.set(_typeBuffer(linkage), length);
    length += Uint8Array.BYTES_PER_ELEMENT;

    if (linkage === LINKAGE.INLINE) {
      const lengthAlignBuffer = _alignBuffer(length, Uint32Array.BYTES_PER_ELEMENT);
      if (lengthAlignBuffer) {
        buffer.set(lengthAlignBuffer, length);
        length += lengthAlignBuffer.length;
      }

      buffer.set(_lengthBuffer(typedArray.length), length);
      length += Uint32Array.BYTES_PER_ELEMENT;

      const dataAlignBuffer = _alignBuffer(length, typedArray.constructor.BYTES_PER_ELEMENT);
      if (dataAlignBuffer) {
        buffer.set(dataAlignBuffer, length);
        length += dataAlignBuffer.length;
      }

      const dataBuffer = new Buffer(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
      buffer.set(dataBuffer, length);
      length += dataBuffer.byteLength;
    } else {
      const addressAlignBuffer = _alignBuffer(length, Uint32Array.BYTES_PER_ELEMENT);
      if (addressAlignBuffer) {
        buffer.set(addressAlignBuffer, length);
        length += addressAlignBuffer.length;
      }

      const rawBuffer = new localRawBuffer(typedArray.buffer);
      const address = rawBuffer.toAddress();
      const addressBuffer = _addressBuffer(address);
      buffer.set(addressBuffer, length);
      length += Uint32Array.BYTES_PER_ELEMENT * 4;

      buffer.set(_lengthBuffer(typedArray.byteOffset), length);
      length += Uint32Array.BYTES_PER_ELEMENT;
      buffer.set(_lengthBuffer(typedArray.length), length);
      length += Uint32Array.BYTES_PER_ELEMENT;

      if (typedArray.buffer[transferListSymbol]) { // elide gc
        typedArray.buffer[transferListSymbol].toAddress(); // XXX can save object construction here
        typedArray.buffer[transferListSymbol] = null;
      }
    }
  };
  const _serialize = o => {
    if (typeof o === 'boolean') {
      buffer.set(_typeBuffer(TYPES.boolean), length);
      length += Uint8Array.BYTES_PER_ELEMENT;

      buffer.set(_booleanBuffer(o), length);
      length += Uint8Array.BYTES_PER_ELEMENT;
    } else if (typeof o === 'number') {
      buffer.set(_typeBuffer(TYPES.number), length);
      length += Uint8Array.BYTES_PER_ELEMENT;

      const dataAlignBuffer = _alignBuffer(length, Float64Array.BYTES_PER_ELEMENT);
      if (dataAlignBuffer) {
        buffer.set(dataAlignBuffer, length);
        length += dataAlignBuffer.length;
      }

      buffer.set(_numberBuffer(o), length);
      length += Float64Array.BYTES_PER_ELEMENT;
    } else if (typeof o === 'string') {
      buffer.set(_typeBuffer(TYPES.string), length);
      length += Uint8Array.BYTES_PER_ELEMENT;

      const lengthAlignBuffer = _alignBuffer(length, Uint32Array.BYTES_PER_ELEMENT);
      if (lengthAlignBuffer) {
        buffer.set(lengthAlignBuffer, length);
        length += lengthAlignBuffer.length;
      }

      const stringBuffer = new Buffer(o, 'utf8');
      buffer.set(_lengthBuffer(stringBuffer.length), length);
      length += Uint32Array.BYTES_PER_ELEMENT;

      buffer.set(stringBuffer, length);
      length += stringBuffer.length;
    } else if (typeof o === 'undefined') {
      buffer.set(_typeBuffer(TYPES.undefined), length);
      length += Uint8Array.BYTES_PER_ELEMENT;
    } else if (typeof o === 'object') {
      if (o === null) {
        buffer.set(_typeBuffer(TYPES.null), length);
        length += Uint8Array.BYTES_PER_ELEMENT;
      } else if (o.constructor.name === 'Array') {
        buffer.set(_typeBuffer(TYPES.array), length);
        length += Uint8Array.BYTES_PER_ELEMENT;

        const lengthAlignBuffer = _alignBuffer(length, Uint32Array.BYTES_PER_ELEMENT);
        if (lengthAlignBuffer) {
          buffer.set(lengthAlignBuffer, length);
          length += lengthAlignBuffer.length;
        }

        buffer.set(_lengthBuffer(o.length), length);
        length += Uint32Array.BYTES_PER_ELEMENT;

        for (let i = 0; i < o.length; i++) {
          _serialize(o[i]);
        }
      } else if (o.constructor.name === 'ArrayBuffer') {
        buffer.set(_typeBuffer(TYPES.ArrayBuffer), length);
        length += Uint8Array.BYTES_PER_ELEMENT;

        const linkage = transferList.includes(o) ? LINKAGE.TRANSFER : LINKAGE.INLINE;
        buffer.set(_typeBuffer(linkage), length);
        length += Uint8Array.BYTES_PER_ELEMENT;

        if (linkage === LINKAGE.INLINE) {
          const lengthAlignBuffer = _alignBuffer(length, Uint32Array.BYTES_PER_ELEMENT);
          if (lengthAlignBuffer) {
            buffer.set(lengthAlignBuffer, length);
            length += lengthAlignBuffer.length;
          }

          const arrayBufferLength = o.byteLength;
          const arrayBufferBuffer = new Buffer(o, 0, arrayBufferLength);
          buffer.set(_lengthBuffer(arrayBufferLength), length);
          length += Uint32Array.BYTES_PER_ELEMENT;

          buffer.set(arrayBufferBuffer, length);
          length += arrayBufferLength;
        } else {
          const addressAlignBuffer = _alignBuffer(length, Uint32Array.BYTES_PER_ELEMENT);
          if (addressAlignBuffer) {
            buffer.set(addressAlignBuffer, length);
            length += addressAlignBuffer.length;
          }

          const rawBuffer = new localRawBuffer(o);
          const address = rawBuffer.toAddress();
          const addressBuffer = _addressBuffer(address);
          buffer.set(addressBuffer, length);
          length += Uint32Array.BYTES_PER_ELEMENT * 4;
          
          if (o[transferListSymbol]) { // elide gc
            o[transferListSymbol].toAddress();
            o[transferListSymbol] = null;
          }
        }
      } else if (o.constructor.name === 'Int8Array') {
        _serializeTypedArray(o, TYPES.Int8Array);
      } else if (o.constructor.name === 'Uint8Array') {
        _serializeTypedArray(o, TYPES.Uint8Array);
      } else if (o.constructor.name === 'Uint8ClampedArray') {
        _serializeTypedArray(o, TYPES.Uint8ClampedArray);
      } else if (o.constructor.name === 'Int16Array') {
        _serializeTypedArray(o, TYPES.Int16Array);
      } else if (o.constructor.name === 'Uint16Array') {
        _serializeTypedArray(o, TYPES.Uint16Array);
      } else if (o.constructor.name === 'Int32Array') {
        _serializeTypedArray(o, TYPES.Int32Array);
      } else if (o.constructor.name === 'Uint32Array') {
        _serializeTypedArray(o, TYPES.Uint32Array);
      } else if (o.constructor.name === 'Float32Array') {
        _serializeTypedArray(o, TYPES.Float32Array);
      } else if (o.constructor.name === 'Float64Array') {
        _serializeTypedArray(o, TYPES.Float64Array);
      } else if (o.constructor.name === 'ImageBitmap') {
        buffer.set(_typeBuffer(TYPES.ImageBitmap), length);
        length += Uint8Array.BYTES_PER_ELEMENT;

        const lengthAlignBuffer = _alignBuffer(length, Uint32Array.BYTES_PER_ELEMENT);
        if (lengthAlignBuffer) {
          buffer.set(lengthAlignBuffer, length);
          length += lengthAlignBuffer.length;
        }

        buffer.set(_lengthBuffer(o.width), length);
        length += Uint32Array.BYTES_PER_ELEMENT;

        buffer.set(_lengthBuffer(o.height), length);
        length += Uint32Array.BYTES_PER_ELEMENT;

        const dataLength = o.width * o.height * 4;
        const dataBuffer = new Buffer(o.data.buffer, o.data.byteOffset, dataLength);
        buffer.set(dataBuffer, length);
        length += dataLength;
      } else {
        buffer.set(_typeBuffer(TYPES.object), length);
        length += Uint8Array.BYTES_PER_ELEMENT;

        const lengthAlignBuffer = _alignBuffer(length, Uint32Array.BYTES_PER_ELEMENT);
        if (lengthAlignBuffer) {
          buffer.set(lengthAlignBuffer, length);
          length += lengthAlignBuffer.length;
        }

        const keys = Object.keys(o);
        buffer.set(_lengthBuffer(keys.length), length);
        length += Uint32Array.BYTES_PER_ELEMENT;

        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];

          const lengthAlignBuffer = _alignBuffer(length, Uint32Array.BYTES_PER_ELEMENT);
          if (lengthAlignBuffer) {
            buffer.set(lengthAlignBuffer, length);
            length += lengthAlignBuffer.length;
          }

          const keyBuffer = new Buffer(key, 'utf8');
          buffer.set(_lengthBuffer(keyBuffer.length), length);
          length += Uint32Array.BYTES_PER_ELEMENT;

          buffer.set(keyBuffer, length);
          length += keyBuffer.length;

          _serialize(o[key]);
        }
      }
    } else {
      throw new Error('cannot serialize: ' + JSON.stringify(o));
    }
  };
  _serialize(o);

  return arrayBuffer;
};
const deserialize = arrayBuffer => {
  const b = new Buffer(arrayBuffer, 0, arrayBuffer.byteLength);
  const transferList = [];

  let result;
  let length = 0;
  const _deserializeTypedArray = (constructor, setter) => {
    const linkage = new Uint8Array(b.buffer, b.byteOffset + length, 1)[0];
    length += Uint8Array.BYTES_PER_ELEMENT;

    if (linkage === LINKAGE.INLINE) {
      length += _alignLength(length, Uint32Array.BYTES_PER_ELEMENT);

      const typedArrayLength = new Uint32Array(b.buffer, b.byteOffset + length, 1)[0];
      length += Uint32Array.BYTES_PER_ELEMENT;

      length += _alignLength(length, constructor.BYTES_PER_ELEMENT);

      const typedArray = new constructor(b.buffer, b.byteOffset + length, typedArrayLength);
      setter(typedArray);
      length += typedArray.byteLength;
    } else {
      length += _alignLength(length, Uint32Array.BYTES_PER_ELEMENT);

      const address = Array.from(new Uint32Array(b.buffer, b.byteOffset + length, 4));
      length += Uint32Array.BYTES_PER_ELEMENT * 4;

      let rawBuffer = transferList.find(transfer => transfer.equals(address));
      if (!rawBuffer) {
        rawBuffer = localRawBuffer.fromAddress(address);
        transferList.push(rawBuffer);
      }
      const arrayBuffer = rawBuffer.getArrayBuffer();
      arrayBuffer[transferListSymbol] = rawBuffer; // bind storage lifetime

      const typedArrayOffset = new Uint32Array(b.buffer, b.byteOffset + length, 1)[0];
      length += Uint32Array.BYTES_PER_ELEMENT;
      const typedArrayLength = new Uint32Array(b.buffer, b.byteOffset + length, 1)[0];
      length += Uint32Array.BYTES_PER_ELEMENT;

      const typedArray = new constructor(arrayBuffer, typedArrayOffset, typedArrayLength);
      setter(typedArray);
    }
  };
  const _recurse = setter => {
    const type = new Uint8Array(b.buffer, b.byteOffset + length, 1)[0];
    length += Uint8Array.BYTES_PER_ELEMENT;

    if (type === TYPES.boolean) {
      setter(new Uint8Array(b.buffer, b.byteOffset + length, 1)[0] !== 0);
      length += Uint8Array.BYTES_PER_ELEMENT;
    } else if (type === TYPES.number) {
      length += _alignLength(length, Float64Array.BYTES_PER_ELEMENT);

      setter(new Float64Array(b.buffer, b.byteOffset + length, 1)[0]);
      length += Float64Array.BYTES_PER_ELEMENT;
    } else if (type === TYPES.string) {
      length += _alignLength(length, Uint32Array.BYTES_PER_ELEMENT);

      const stringLength = new Uint32Array(b.buffer, b.byteOffset + length, 1)[0];
      length += Uint32Array.BYTES_PER_ELEMENT;

      setter(new Buffer(b.buffer, b.byteOffset + length, stringLength).toString('utf8'));
      length += stringLength;
    } else if (type === TYPES.null) {
      setter(null);
    } else if (type === TYPES.undefined) {
      setter(undefined);
    } else if (type === TYPES.array) {
      length += _alignLength(length, Uint32Array.BYTES_PER_ELEMENT);

      const arrayLength = new Uint32Array(b.buffer, b.byteOffset + length, 1)[0];
      length += Uint32Array.BYTES_PER_ELEMENT;

      const array = Array(arrayLength);
      for (let i = 0; i < arrayLength; i++) {
        _recurse(value => {
          array[i] = value;
        });
      }
      setter(array);
    } else if (type === TYPES.ArrayBuffer) {
      const linkage = new Uint8Array(b.buffer, b.byteOffset + length, 1)[0];
      length += Uint8Array.BYTES_PER_ELEMENT;

      if (linkage === LINKAGE.INLINE) {
        length += _alignLength(length, Uint32Array.BYTES_PER_ELEMENT);

        const arrayBufferLength = new Uint32Array(b.buffer, b.byteOffset + length, 1)[0];
        length += Uint32Array.BYTES_PER_ELEMENT;

        const arrayBuffer = b.buffer.slice(b.byteOffset + length, b.byteOffset + length + arrayBufferLength);
        setter(arrayBuffer);
        length += arrayBuffer.byteLength;
      } else {
        length += _alignLength(length, Uint32Array.BYTES_PER_ELEMENT);

        const address = Array.from(new Uint32Array(b.buffer, b.byteOffset + length, 4));
        length += Uint32Array.BYTES_PER_ELEMENT * 4;

        let rawBuffer = transferList.find(transfer => transfer.equals(address));
        if (!rawBuffer) {
          rawBuffer = localRawBuffer.fromAddress(address);
          transferList.push(rawBuffer);
        }
        const arrayBuffer = rawBuffer.getArrayBuffer();
        arrayBuffer[transferListSymbol] = rawBuffer; // bind storage lifetime
        setter(arrayBuffer);
      }
    } else if (type === TYPES.Int8Array) {
      _deserializeTypedArray(Int8Array, setter);
    } else if (type === TYPES.Uint8Array) {
      _deserializeTypedArray(Uint8Array, setter);
    } else if (type === TYPES.Uint8ClampedArray) {
      _deserializeTypedArray(Uint8ClampedArray, setter);
    } else if (type === TYPES.Int16Array) {
      _deserializeTypedArray(Int16Array, setter);
    } else if (type === TYPES.Uint16Array) {
      _deserializeTypedArray(Uint16Array, setter);
    } else if (type === TYPES.Int32Array) {
      _deserializeTypedArray(Int32Array, setter);
    } else if (type === TYPES.Uint32Array) {
      _deserializeTypedArray(Uint32Array, setter);
    } else if (type === TYPES.Float32Array) {
      _deserializeTypedArray(Float32Array, setter);
    } else if (type === TYPES.Float64Array) {
      _deserializeTypedArray(Float64Array, setter);
    } else if (type === TYPES.ImageBitmap) {
      length += _alignLength(length, Uint32Array.BYTES_PER_ELEMENT);

      const width = new Uint32Array(b.buffer, b.byteOffset + length, 1)[0];
      length += Uint32Array.BYTES_PER_ELEMENT;

      const height = new Uint32Array(b.buffer, b.byteOffset + length, 1)[0];
      length += Uint32Array.BYTES_PER_ELEMENT;

      const dataLength = width * height * 4;
      const data = new Uint8Array(b.buffer, b.byteOffset + length, dataLength);
      length += dataLength;

      setter(new localImageBitmap(width, height, data));
    } else if (type === TYPES.object) {
      length += _alignLength(length, Uint32Array.BYTES_PER_ELEMENT);

      const numKeys = new Uint32Array(b.buffer, b.byteOffset + length, 1)[0];
      length += Uint32Array.BYTES_PER_ELEMENT;

      const object = {};
      for (let i = 0; i < numKeys; i++) {
        length += _alignLength(length, Uint32Array.BYTES_PER_ELEMENT);

        const keyLength = new Uint32Array(b.buffer, b.byteOffset + length, 1)[0];
        length += Uint32Array.BYTES_PER_ELEMENT;

        const key = new Buffer(b.buffer, b.byteOffset + length, keyLength).toString('utf8');
        length += keyLength;

        _recurse(value => {
          object[key] = value;
        });
      }
      setter(object);
    } else {
      throw new Error('cannot deserialize: ' + JSON.stringify(type));
    }
  }
  _recurse(newResult => {
    result = newResult;
  });
  return result;
};
const getSize = (o, transferList = []) => {
  let length = 0;

  const _serializeTypedArray = (typedArray, type) => {
    length += Uint8Array.BYTES_PER_ELEMENT;

    const linkage = transferList.includes(typedArray.buffer) ? LINKAGE.TRANSFER : LINKAGE.INLINE;
    length += Uint8Array.BYTES_PER_ELEMENT;

    if (linkage === LINKAGE.INLINE) {
      length += _alignLength(length, Uint32Array.BYTES_PER_ELEMENT);

      length += Uint32Array.BYTES_PER_ELEMENT;

      length += _alignLength(length, typedArray.constructor.BYTES_PER_ELEMENT);

      length += typedArray.byteLength;
    } else {
      length += _alignLength(length, Uint32Array.BYTES_PER_ELEMENT);

      length += Uint32Array.BYTES_PER_ELEMENT * 4;

      length += Uint32Array.BYTES_PER_ELEMENT;
      length += Uint32Array.BYTES_PER_ELEMENT;
    }
  };
  const _serialize = o => {
    if (typeof o === 'boolean') {
      length += Uint8Array.BYTES_PER_ELEMENT;

      length += Uint8Array.BYTES_PER_ELEMENT;
    } else if (typeof o === 'number') {
      length += Uint8Array.BYTES_PER_ELEMENT;

      length += _alignLength(length, Float64Array.BYTES_PER_ELEMENT);

      length += Float64Array.BYTES_PER_ELEMENT;
    } else if (typeof o === 'string') {
      length += Uint8Array.BYTES_PER_ELEMENT;

      length += _alignLength(length, Uint32Array.BYTES_PER_ELEMENT);

      length += Uint32Array.BYTES_PER_ELEMENT;

      const stringBuffer = new Buffer(o, 'utf8'); // XXX can be a constant multiplier of string.length
      length += stringBuffer.length;
    } else if (typeof o === 'undefined') {
      length += Uint8Array.BYTES_PER_ELEMENT;
    } else if (typeof o === 'object') {
      if (o === null) {
        length += Uint8Array.BYTES_PER_ELEMENT;
      } else if (o.constructor.name === 'Array') {
        length += Uint8Array.BYTES_PER_ELEMENT;

        length += _alignLength(length, Uint32Array.BYTES_PER_ELEMENT);

        length += Uint32Array.BYTES_PER_ELEMENT;

        for (let i = 0; i < o.length; i++) {
          _serialize(o[i]);
        }
      } else if (o.constructor.name === 'ArrayBuffer') {
        length += Uint8Array.BYTES_PER_ELEMENT;

        const linkage = transferList.includes(o) ? LINKAGE.TRANSFER : LINKAGE.INLINE;
        length += Uint8Array.BYTES_PER_ELEMENT;

        if (linkage === LINKAGE.INLINE) {
          length += _alignLength(length, Uint32Array.BYTES_PER_ELEMENT);

          length += Uint32Array.BYTES_PER_ELEMENT;

          const arrayBufferLength = o.byteLength;
          length += arrayBufferLength;
        } else {
          length += _alignLength(length, Uint32Array.BYTES_PER_ELEMENT);

          length += Uint32Array.BYTES_PER_ELEMENT * 4;
        }
      } else if (o.constructor.name === 'Int8Array') {
        _serializeTypedArray(o, TYPES.Int8Array);
      } else if (o.constructor.name === 'Uint8Array') {
        _serializeTypedArray(o, TYPES.Uint8Array);
      } else if (o.constructor.name === 'Uint8ClampedArray') {
        _serializeTypedArray(o, TYPES.Uint8ClampedArray);
      } else if (o.constructor.name === 'Int16Array') {
        _serializeTypedArray(o, TYPES.Int16Array);
      } else if (o.constructor.name === 'Uint16Array') {
        _serializeTypedArray(o, TYPES.Uint16Array);
      } else if (o.constructor.name === 'Int32Array') {
        _serializeTypedArray(o, TYPES.Int32Array);
      } else if (o.constructor.name === 'Uint32Array') {
        _serializeTypedArray(o, TYPES.Uint32Array);
      } else if (o.constructor.name === 'Float32Array') {
        _serializeTypedArray(o, TYPES.Float32Array);
      } else if (o.constructor.name === 'Float64Array') {
        _serializeTypedArray(o, TYPES.Float64Array);
      } else if (o.constructor.name === 'ImageBitmap') {
        length += Uint8Array.BYTES_PER_ELEMENT;

        length += _alignLength(length, Uint32Array.BYTES_PER_ELEMENT);

        length += Uint32Array.BYTES_PER_ELEMENT;

        length += Uint32Array.BYTES_PER_ELEMENT;

        const dataLength = o.width * o.height * 4;
        length += dataLength;
      } else {
        length += Uint8Array.BYTES_PER_ELEMENT;

        length += _alignLength(length, Uint32Array.BYTES_PER_ELEMENT);

        length += Uint32Array.BYTES_PER_ELEMENT;

        const keys = Object.keys(o);
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];

          length += _alignLength(length, Uint32Array.BYTES_PER_ELEMENT);

          length += Uint32Array.BYTES_PER_ELEMENT;

          const keyBuffer = new Buffer(key, 'utf8'); // XXX can be a constant multiplier of string.length
          length += keyBuffer.length;

          _serialize(o[key]);
        }
      }
    } else {
      throw new Error('cannot serialize: ' + JSON.stringify(o));
    }
  };
  _serialize(o);

  return length;
};
const bind = bindings => {
  if (bindings.ImageBitmap !== undefined) {
    localImageBitmap = bindings.ImageBitmap;
  }
  if (bindings.RawBuffer !== undefined) {
    localRawBuffer = bindings.RawBuffer;
  }
};

module.exports = {
  serialize,
  deserialize,
  getSize,
  bind,
};
