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
};

const _typeBuffer = typeId => {
  const uint8Array = Uint8Array.from([typeId]);
  return new Buffer(uint8Array.buffer, uint8Array.byteOffset, uint8Array.byteLength);
};
const _getAlignFixOffset = (n, alignment) => {
  const offset = n % alignment;
  if (offset !== 0) {
    return alignment - offset;
  } else {
    return 0;
  }
};
const _alignBuffer = (n, alignment) => {
  const fixOffset = _getAlignFixOffset(n, alignment);
  if (fixOffset !== 0) {
    return Buffer.alloc(fixOffset);
  } else {
    return null;
  }
}
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
const serialize = o => {
  const bs = [];
  let length = 0;
  const _serialize = o => {
    if (typeof o === 'boolean') {
      bs.push(_typeBuffer(TYPES.boolean));
      length += Uint8Array.BYTES_PER_ELEMENT;

      bs.push(_booleanBuffer(o));
      length += Uint8Array.BYTES_PER_ELEMENT;
    } else if (typeof o === 'number') {
      bs.push(_typeBuffer(TYPES.number));
      length += Uint8Array.BYTES_PER_ELEMENT;

      const dataAlignBuffer = _alignBuffer(length, Float64Array.BYTES_PER_ELEMENT);
      if (dataAlignBuffer) {
        bs.push(dataAlignBuffer);
        length += dataAlignBuffer.length;
      }

      bs.push(_numberBuffer(o));
      length += Float64Array.BYTES_PER_ELEMENT;
    } else if (typeof o === 'string') {
      bs.push(_typeBuffer(TYPES.string));
      length += Uint8Array.BYTES_PER_ELEMENT;

      const lengthAlignBuffer = _alignBuffer(length, Uint32Array.BYTES_PER_ELEMENT);
      if (lengthAlignBuffer) {
        bs.push(lengthAlignBuffer);
        length += lengthAlignBuffer.length;
      }

      const stringBuffer = new Buffer(o, 'utf8');
      bs.push(_lengthBuffer(stringBuffer.length));
      length += Uint32Array.BYTES_PER_ELEMENT;

      bs.push(stringBuffer);
      length += stringBuffer.length;
    } else if (typeof o === 'object') {
      if (o === null) {
        bs.push(_typeBuffer(TYPES.null));
        length += Uint8Array.BYTES_PER_ELEMENT;
      } else if (Array.isArray(o)) {
        bs.push(_typeBuffer(TYPES.array));
        length += Uint8Array.BYTES_PER_ELEMENT;

        const lengthAlignBuffer = _alignBuffer(length, Uint32Array.BYTES_PER_ELEMENT);
        if (lengthAlignBuffer) {
          bs.push(lengthAlignBuffer);
          length += lengthAlignBuffer.length;
        }

        bs.push(_lengthBuffer(o.length));
        length += Uint32Array.BYTES_PER_ELEMENT;

        for (let i = 0; i < o.length; i++) {
          _serialize(o[i]);
        }
      } else if (o instanceof ArrayBuffer) {
        bs.push(_typeBuffer(TYPES.ArrayBuffer));
        length += Uint8Array.BYTES_PER_ELEMENT;

        const lengthAlignBuffer = _alignBuffer(length, Uint32Array.BYTES_PER_ELEMENT);
        if (lengthAlignBuffer) {
          bs.push(lengthAlignBuffer);
          length += lengthAlignBuffer.length;
        }

        const arrayBufferBuffer = new Buffer(o, 0, o.byteLength);
        bs.push(_lengthBuffer(arrayBufferBuffer.length));
        length += Uint32Array.BYTES_PER_ELEMENT;

        bs.push(arrayBufferBuffer);
        length += arrayBufferBuffer.length;
      } else if (o instanceof Int8Array) {
        bs.push(_typeBuffer(TYPES.Int8Array));
        length += Uint8Array.BYTES_PER_ELEMENT;

        const buffer = new Buffer(o.buffer, o.byteOffset, o.byteLength);
        bs.push(buffer);
        length += buffer.byteLength;
      } else if (o instanceof Uint8Array) {
        bs.push(_typeBuffer(TYPES.Uint8Array));
        length += Uint8Array.BYTES_PER_ELEMENT;

        const lengthAlignBuffer = _alignBuffer(length, Uint32Array.BYTES_PER_ELEMENT);
        if (lengthAlignBuffer) {
          bs.push(lengthAlignBuffer);
          length += lengthAlignBuffer.length;
        }

        bs.push(_lengthBuffer(o.length));
        length += Uint32Array.BYTES_PER_ELEMENT;

        const buffer = new Buffer(o.buffer, o.byteOffset, o.byteLength);
        bs.push(buffer);
        length += buffer.byteLength;
      } else if (o instanceof Uint8ClampedArray) {
        bs.push(_typeBuffer(TYPES.Uint8ClampedArray));
        length += Uint8Array.BYTES_PER_ELEMENT;

        const lengthAlignBuffer = _alignBuffer(length, Uint32Array.BYTES_PER_ELEMENT);
        if (lengthAlignBuffer) {
          bs.push(lengthAlignBuffer);
          length += lengthAlignBuffer.length;
        }

        bs.push(_lengthBuffer(o.length));
        length += Uint32Array.BYTES_PER_ELEMENT;

        const buffer = new Buffer(o.buffer, o.byteOffset, o.byteLength);
        bs.push(buffer);
        length += buffer.byteLength;
      } else if (o instanceof Int16Array) {
        bs.push(_typeBuffer(TYPES.Int16Array));
        length += Uint8Array.BYTES_PER_ELEMENT;

        const lengthAlignBuffer = _alignBuffer(length, Uint32Array.BYTES_PER_ELEMENT);
        if (lengthAlignBuffer) {
          bs.push(lengthAlignBuffer);
          length += lengthAlignBuffer.length;
        }

        bs.push(_lengthBuffer(o.length));
        length += Uint32Array.BYTES_PER_ELEMENT;

        const dataAlignBuffer = _alignBuffer(length, Int16Array.BYTES_PER_ELEMENT);
        if (dataAlignBuffer) {
          bs.push(dataAlignBuffer);
          length += dataAlignBuffer.length;
        }

        const buffer = new Buffer(o.buffer, o.byteOffset, o.byteLength);
        bs.push(buffer);
        length += buffer.byteLength;
      } else if (o instanceof Uint16Array) {
        bs.push(_typeBuffer(TYPES.Uint16Array));
        length += Uint8Array.BYTES_PER_ELEMENT;

        const lengthAlignBuffer = _alignBuffer(length, Uint32Array.BYTES_PER_ELEMENT);
        if (lengthAlignBuffer) {
          bs.push(lengthAlignBuffer);
          length += lengthAlignBuffer.length;
        }

        bs.push(_lengthBuffer(o.length));
        length += Uint32Array.BYTES_PER_ELEMENT;

        const dataAlignBuffer = _alignBuffer(length, Uint16Array.BYTES_PER_ELEMENT);
        if (dataAlignBuffer) {
          bs.push(dataAlignBuffer);
          length += dataAlignBuffer.length;
        }

        const buffer = new Buffer(o.buffer, o.byteOffset, o.byteLength);
        bs.push(buffer);
        length += buffer.byteLength;
      } else if (o instanceof Int32Array) {
        bs.push(_typeBuffer(TYPES.Int32Array));
        length += Uint8Array.BYTES_PER_ELEMENT;

        const lengthAlignBuffer = _alignBuffer(length, Uint32Array.BYTES_PER_ELEMENT);
        if (lengthAlignBuffer) {
          bs.push(lengthAlignBuffer);
          length += lengthAlignBuffer.length;
        }

        bs.push(_lengthBuffer(o.length));
        length += Uint32Array.BYTES_PER_ELEMENT;

        const dataAlignBuffer = _alignBuffer(length, Int32Array.BYTES_PER_ELEMENT);
        if (dataAlignBuffer) {
          bs.push(dataAlignBuffer);
          length += dataAlignBuffer.length;
        }

        const buffer = new Buffer(o.buffer, o.byteOffset, o.byteLength);
        bs.push(buffer);
        length += buffer.byteLength;
      } else if (o instanceof Uint32Array) {
        bs.push(_typeBuffer(TYPES.Uint32Array));
        length += Uint8Array.BYTES_PER_ELEMENT;

        const lengthAlignBuffer = _alignBuffer(length, Uint32Array.BYTES_PER_ELEMENT);
        if (lengthAlignBuffer) {
          bs.push(lengthAlignBuffer);
          length += lengthAlignBuffer.length;
        }

        bs.push(_lengthBuffer(o.length));
        length += Uint32Array.BYTES_PER_ELEMENT;

        const dataAlignBuffer = _alignBuffer(length, Uint32Array.BYTES_PER_ELEMENT);
        if (dataAlignBuffer) {
          bs.push(dataAlignBuffer);
          length += dataAlignBuffer.length;
        }

        const buffer = new Buffer(o.buffer, o.byteOffset, o.byteLength);
        bs.push(buffer);
        length += buffer.byteLength;
      } else if (o instanceof Float32Array) {
        bs.push(_typeBuffer(TYPES.Float32Array));
        length += Uint8Array.BYTES_PER_ELEMENT;

        const lengthAlignBuffer = _alignBuffer(length, Uint32Array.BYTES_PER_ELEMENT);
        if (lengthAlignBuffer) {
          bs.push(lengthAlignBuffer);
          length += lengthAlignBuffer.length;
        }

        bs.push(_lengthBuffer(o.length));
        length += Uint32Array.BYTES_PER_ELEMENT;

        const dataAlignBuffer = _alignBuffer(length, Float32Array.BYTES_PER_ELEMENT);
        if (dataAlignBuffer) {
          bs.push(dataAlignBuffer);
          length += dataAlignBuffer.length;
        }

        const buffer = new Buffer(o.buffer, o.byteOffset, o.byteLength);
        bs.push(buffer);
        length += buffer.byteLength;
      } else if (o instanceof Float64Array) {
        bs.push(_typeBuffer(TYPES.Float64Array));
        length += Uint8Array.BYTES_PER_ELEMENT;

        const lengthAlignBuffer = _alignBuffer(length, Uint32Array.BYTES_PER_ELEMENT);
        if (lengthAlignBuffer) {
          bs.push(lengthAlignBuffer);
          length += lengthAlignBuffer.length;
        }

        bs.push(_lengthBuffer(o.length));
        length += Uint32Array.BYTES_PER_ELEMENT;

        const dataAlignBuffer = _alignBuffer(length, Float64Array.BYTES_PER_ELEMENT);
        if (dataAlignBuffer) {
          bs.push(dataAlignBuffer);
          length += dataAlignBuffer.length;
        }

        const buffer = new Buffer(o.buffer, o.byteOffset, o.byteLength);
        bs.push(buffer);
        length += buffer.byteLength;
      } else {
        bs.push(_typeBuffer(TYPES.object));
        length += Uint8Array.BYTES_PER_ELEMENT;

        const lengthAlignBuffer = _alignBuffer(length, Uint32Array.BYTES_PER_ELEMENT);
        if (lengthAlignBuffer) {
          bs.push(lengthAlignBuffer);
          length += lengthAlignBuffer.length;
        }

        const keys = Object.keys(o);
        bs.push(_lengthBuffer(keys.length));
        length += Uint32Array.BYTES_PER_ELEMENT;

        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];

          const lengthAlignBuffer = _alignBuffer(length, Uint32Array.BYTES_PER_ELEMENT);
          if (lengthAlignBuffer) {
            bs.push(lengthAlignBuffer);
            length += lengthAlignBuffer.length;
          }

          const keyBuffer = new Buffer(key, 'utf8');
          bs.push(_lengthBuffer(keyBuffer.length));
          length += Uint32Array.BYTES_PER_ELEMENT;

          bs.push(keyBuffer);
          length += keyBuffer.length;

          _serialize(o[key]);
        }
      }
    } else {
      throw new Error('cannot serialize: ' + JSON.stringify(o));
    }
  };
  _serialize(o);
  return bs;
};
const deserialize = bs => {
  const b = (() => {
    if (Buffer.isBuffer(bs) && (bs.byteOffset % Float64Array.BYTES_PER_ELEMENT) === 0) {
      return bs;
    } else {
      const bsArray = Array.isArray(bs) ? bs : [bs];
      let bSize = 0;
      for (let i = 0; i < bsArray.length; i++) {
        bSize += bsArray[i].length;
      }
      const result = Buffer.from(new ArrayBuffer(bSize));
      let length = 0;
      for (let i = 0; i < bsArray.length; i++) {
        const srcBuffer = bsArray[i];
        result.set(srcBuffer, length);
        length += srcBuffer.length;
      }
      return result;
    }
  })();

  let result;
  let length = 0;
  const _recurse = setter => {
    const type = new Uint8Array(b.buffer, b.byteOffset + length, 1)[0];
    length += Uint8Array.BYTES_PER_ELEMENT;

    if (type === TYPES.boolean) {
      setter(new Uint8Array(b.buffer, b.byteOffset + length, 1)[0] !== 0);
      length += Uint8Array.BYTES_PER_ELEMENT;
    } else if (type === TYPES.number) {
      length += _getAlignFixOffset(length, Float64Array.BYTES_PER_ELEMENT);

      setter(new Float64Array(b.buffer, b.byteOffset + length, 1)[0]);
      length += Float64Array.BYTES_PER_ELEMENT;
    } else if (type === TYPES.string) {
      length += _getAlignFixOffset(length, Uint32Array.BYTES_PER_ELEMENT);

      const stringLength = new Uint32Array(b.buffer, b.byteOffset + length, 1)[0];
      length += Uint32Array.BYTES_PER_ELEMENT;

      setter(new Buffer(b.buffer, b.byteOffset + length, stringLength).toString('utf8'));
      length += stringLength;
    } else if (type === TYPES.null) {
      setter(null);
    } else if (type === TYPES.array) {
      length += _getAlignFixOffset(length, Uint32Array.BYTES_PER_ELEMENT);

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
      length += _getAlignFixOffset(length, Uint32Array.BYTES_PER_ELEMENT);

      const arrayBufferLength = new Uint32Array(b.buffer, b.byteOffset + length, 1)[0];
      length += Uint32Array.BYTES_PER_ELEMENT;

      const arrayBuffer = b.buffer.slice(b.byteOffset + length, b.byteOffset + length + arrayBufferLength);
      setter(arrayBuffer);
      length += arrayBuffer.byteLength;
    } else if (type === TYPES.Int8Array) {
      length += _getAlignFixOffset(length, Uint32Array.BYTES_PER_ELEMENT);

      const typedArrayLength = new Uint32Array(b.buffer, b.byteOffset + length, 1)[0];
      length += Uint32Array.BYTES_PER_ELEMENT;

      const typedArray = new Int8Array(b.buffer, b.byteOffset + length, typedArrayLength);
      setter(typedArray);
      length += typedArray.byteLength;
    } else if (type === TYPES.Uint8Array) {
      length += _getAlignFixOffset(length, Uint32Array.BYTES_PER_ELEMENT);

      const typedArrayLength = new Uint32Array(b.buffer, b.byteOffset + length, 1)[0];
      length += Uint32Array.BYTES_PER_ELEMENT;

      const typedArray = new Uint8Array(b.buffer, b.byteOffset + length, typedArrayLength);
      setter(typedArray);
      length += typedArray.byteLength;
    } else if (type === TYPES.Uint8ClampedArray) {
      length += _getAlignFixOffset(length, Uint32Array.BYTES_PER_ELEMENT);

      const typedArrayLength = new Uint32Array(b.buffer, b.byteOffset + length, 1)[0];
      length += Uint32Array.BYTES_PER_ELEMENT;

      const typedArray = new Uint8ClampedArray(b.buffer, b.byteOffset + length, typedArrayLength);
      setter(typedArray);
      length += typedArray.byteLength;
    } else if (type === TYPES.Int16Array) {
      length += _getAlignFixOffset(length, Uint32Array.BYTES_PER_ELEMENT);

      const typedArrayLength = new Uint32Array(b.buffer, b.byteOffset + length, 1)[0];
      length += Uint32Array.BYTES_PER_ELEMENT;

      length += _getAlignFixOffset(length, Int16Array.BYTES_PER_ELEMENT);

      const typedArray = new Int16Array(b.buffer, b.byteOffset + length, typedArrayLength);
      setter(typedArray);
      length += typedArray.byteLength;
    } else if (type === TYPES.Uint16Array) {
      length += _getAlignFixOffset(length, Uint32Array.BYTES_PER_ELEMENT);

      const typedArrayLength = new Uint32Array(b.buffer, b.byteOffset + length, 1)[0];
      length += Uint32Array.BYTES_PER_ELEMENT;

      length += _getAlignFixOffset(length, Uint16Array.BYTES_PER_ELEMENT);

      const typedArray = new Uint16Array(b.buffer, b.byteOffset + length, typedArrayLength);
      setter(typedArray);
      length += typedArray.byteLength;
    } else if (type === TYPES.Int32Array) {
      length += _getAlignFixOffset(length, Uint32Array.BYTES_PER_ELEMENT);

      const typedArrayLength = new Uint32Array(b.buffer, b.byteOffset + length, 1)[0];
      length += Uint32Array.BYTES_PER_ELEMENT;

      length += _getAlignFixOffset(length, Int32Array.BYTES_PER_ELEMENT);

      const typedArray = new Int32Array(b.buffer, b.byteOffset + length, typedArrayLength);
      setter(typedArray);
      length += typedArray.byteLength;
    } else if (type === TYPES.Uint32Array) {
      length += _getAlignFixOffset(length, Uint32Array.BYTES_PER_ELEMENT);

      const typedArrayLength = new Uint32Array(b.buffer, b.byteOffset + length, 1)[0];
      length += Uint32Array.BYTES_PER_ELEMENT;

      length += _getAlignFixOffset(length, Uint32Array.BYTES_PER_ELEMENT);

      const typedArray = new Uint32Array(b.buffer, b.byteOffset + length, typedArrayLength);
      setter(typedArray);
      length += typedArray.byteLength;
    } else if (type === TYPES.Float32Array) {
      length += _getAlignFixOffset(length, Uint32Array.BYTES_PER_ELEMENT);

      const typedArrayLength = new Uint32Array(b.buffer, b.byteOffset + length, 1)[0];
      length += Uint32Array.BYTES_PER_ELEMENT;

      length += _getAlignFixOffset(length, Float32Array.BYTES_PER_ELEMENT);

      const typedArray = new Float32Array(b.buffer, b.byteOffset + length, typedArrayLength);
      setter(typedArray);
      length += typedArray.byteLength;
    } else if (type === TYPES.Float64Array) {
      length += _getAlignFixOffset(length, Uint32Array.BYTES_PER_ELEMENT);

      const typedArrayLength = new Uint32Array(b.buffer, b.byteOffset + length, 1)[0];
      length += Uint32Array.BYTES_PER_ELEMENT;

      length += _getAlignFixOffset(length, Float64Array.BYTES_PER_ELEMENT);

      const typedArray = new Float64Array(b.buffer, b.byteOffset + length, typedArrayLength);
      setter(typedArray);
      length += typedArray.byteLength;
    } else if (type === TYPES.object) {
      length += _getAlignFixOffset(length, Uint32Array.BYTES_PER_ELEMENT);

      const numKeys = new Uint32Array(b.buffer, b.byteOffset + length, 1)[0];
      length += Uint32Array.BYTES_PER_ELEMENT;

      const object = {};
      for (let i = 0; i < numKeys; i++) {
        length += _getAlignFixOffset(length, Uint32Array.BYTES_PER_ELEMENT);

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

module.exports = {
  serialize,
  deserialize,
};
