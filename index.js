let id = 0;
const TYPES = {
  boolean: id++,
  number: id++,
  string: id++,
  object: id++,
  null: id++,
  array: id++,
  object: id++,
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
const _alignBuffer = (n, alignment) => {
  const offset = n % alignment;
  if (offset !== 0) {
    const fixOffset = alignment - offset;
    const uint8Array = new Uint8Array(fixOffset);
    return new Buffer(uint8Array.buffer, uint8Array.byteOffset, uint8Array.byteLength);
  } else {
    return null;
  }
}
const _lengthBuffer = length => {
  const uint32Array = Uint32Array.from([length]);
  return new Buffer(uint32Array.buffer, uint32Array.byteOffset, uint32Array.byteLength);
};
const _booleanBuffer = b => {
  const uint8Array = Uint8Array.from([+n]);
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

      const alignBuffer = _alignBuffer(length, Float64Array.BYTES_PER_ELEMENT);
      if (alignBuffer) {
        bs.push(alignBuffer);
        length += alignBuffer.length;
      }

      bs.push(_numberBuffer(o));
      length += Float64Array.BYTES_PER_ELEMENT;
    } else if (typeof o === 'string') {
      bs.push(_typeBuffer(TYPES.string));
      length += Uint8Array.BYTES_PER_ELEMENT;

      const stringBuffer = new Buffer(o, 'utf8');
      bs.push(stringBuffer);
      length += stringBuffer.length;
    } else if (typeof o === 'object') {
      if (o === null) {
        bs.push(_typeBuffer(TYPES.null));
        length += Uint8Array.BYTES_PER_ELEMENT;
      } else if (Array.isArray(o)) {
        bs.push(_typeBuffer(TYPES.array));
        length += Uint8Array.BYTES_PER_ELEMENT;

        bs.push(_lengthBuffer(o.length));
        length += Uint32Array.BYTES_PER_ELEMENT;

        for (let i = 0; i < o.length; i++) {
          _serialize(o[i]);
        }
      } else if (o instanceof Int8Array) {
        bs.push(_typeBuffer(TYPES.Int8Array));
        length += Uint8Array.BYTES_PER_ELEMENT;

        const buffer = new Buffer(o.buffer, o.byteOffset, o.byteLength);
        bs.push(buffer);
        length += buffer.byteLength;
      } else if (o instanceof Uint8Array) {
        bs.push(_typeBuffer(TYPES.Uint8Array));
        length += Uint8Array.BYTES_PER_ELEMENT;

        const buffer = new Buffer(o.buffer, o.byteOffset, o.byteLength);
        bs.push(buffer);
        length += buffer.byteLength;
      } else if (o instanceof Uint8ClampedArray) {
        bs.push(_typeBuffer(TYPES.Uint8ClampedArray));
        length += Uint8Array.BYTES_PER_ELEMENT;

        const buffer = new Buffer(o.buffer, o.byteOffset, o.byteLength);
        bs.push(buffer);
        length += buffer.byteLength;
      } else if (o instanceof Int16Array) {
        bs.push(_typeBuffer(TYPES.Int16Array));
        length += Uint8Array.BYTES_PER_ELEMENT;

        const alignBuffer = _alignBuffer(length, Int16Array.BYTES_PER_ELEMENT);
        if (alignBuffer) {
          bs.push(alignBuffer);
          length += alignBuffer.length;
        }

        const buffer = new Buffer(o.buffer, o.byteOffset, o.byteLength);
        bs.push(buffer);
        length += buffer.byteLength;
      } else if (o instanceof Uint16Array) {
        bs.push(_typeBuffer(TYPES.Uint16Array));
        length += Uint8Array.BYTES_PER_ELEMENT;

        const alignBuffer = _alignBuffer(length, Uint16Array.BYTES_PER_ELEMENT);
        if (alignBuffer) {
          bs.push(alignBuffer);
          length += alignBuffer.length;
        }

        const buffer = new Buffer(o.buffer, o.byteOffset, o.byteLength);
        bs.push(buffer);
        length += buffer.byteLength;
      } else if (o instanceof Int32Array) {
        bs.push(_typeBuffer(TYPES.Int32Array));
        length += Uint8Array.BYTES_PER_ELEMENT;

        const alignBuffer = _alignBuffer(length, Int32Array.BYTES_PER_ELEMENT);
        if (alignBuffer) {
          bs.push(alignBuffer);
          length += alignBuffer.length;
        }

        const buffer = new Buffer(o.buffer, o.byteOffset, o.byteLength);
        bs.push(buffer);
        length += buffer.byteLength;
      } else if (o instanceof Uint32Array) {
        bs.push(_typeBuffer(TYPES.Uint32Array));
        length += Uint8Array.BYTES_PER_ELEMENT;

        const alignBuffer = _alignBuffer(length, Uint32Array.BYTES_PER_ELEMENT);
        if (alignBuffer) {
          bs.push(alignBuffer);
          length += alignBuffer.length;
        }

        const buffer = new Buffer(o.buffer, o.byteOffset, o.byteLength);
        bs.push(buffer);
        length += buffer.byteLength;
      } else if (o instanceof Float32Array) {
        bs.push(_typeBuffer(TYPES.Float32Array));
        length += Uint8Array.BYTES_PER_ELEMENT;

        const alignBuffer = _alignBuffer(length, Float32Array.BYTES_PER_ELEMENT);
        if (alignBuffer) {
          bs.push(alignBuffer);
          length += alignBuffer.length;
        }

        const buffer = new Buffer(o.buffer, o.byteOffset, o.byteLength);
        bs.push(buffer);
        length += buffer.byteLength;
      } else if (o instanceof Float64Array) {
        bs.push(_typeBuffer(TYPES.Float64Array));
        length += Uint8Array.BYTES_PER_ELEMENT;

        const alignBuffer = _alignBuffer(length, Float64Array.BYTES_PER_ELEMENT);
        if (alignBuffer) {
          bs.push(alignBuffer);
          length += alignBuffer.length;
        }

        const buffer = new Buffer(o.buffer, o.byteOffset, o.byteLength);
        bs.push(buffer);
        length += buffer.byteLength;
      } else {
        bs.push(_typeBuffer(TYPES.object));
        length += Uint8Array.BYTES_PER_ELEMENT;

        const keys = Object.keys(o);
        bs.push(_lengthBuffer(keys.length));
        length += Uint32Array.BYTES_PER_ELEMENT;

        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];

          const stringBuffer = new Buffer(key, 'utf8');
          bs.push(stringBuffer);
          length += stringBuffer.length;

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
const deserialize = b => {
  if (Array.isArray(b)) {
    b = Buffer.concat(b);
  }
};
