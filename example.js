const smiggles = require('.');

const buffer = smiggles.serialize(['lol', 2, [true, false], null, {fail: 'whale', trail: {ail: 'kale'}}, Uint8ClampedArray.from([7]), null, Uint16Array.from([8]), Float32Array.from([1,2,3,4])]);
// const buffer = smiggles.serialize(Float32Array.from([1,2,3,4]));
console.log(buffer);

const result = smiggles.deserialize(buffer);
console.log(result);
// process.stdout.write(JSON.stringify(result, null, 2));
// process.stdout.write('\n');
