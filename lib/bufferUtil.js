"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bufferToFloat32Array = exports.bufferToUint16Array = void 0;
var typeSize_1 = require("./typeSize");
function bufferToUint16Array(buffer, byteOffset, length) {
    var uint16Array = new Uint16Array(length);
    for (var i = 0; i < length; ++i) {
        uint16Array[i] = buffer.readUInt16LE(byteOffset + i * typeSize_1.UINT16_SIZE_BYTES);
    }
    return uint16Array;
}
exports.bufferToUint16Array = bufferToUint16Array;
function bufferToFloat32Array(buffer, byteOffset, length) {
    var float32Array = new Float32Array(length);
    for (var i = 0; i < length; ++i) {
        float32Array[i] = buffer.readFloatLE(byteOffset + i * typeSize_1.FLOAT32_SIZE_BYTES);
    }
    return float32Array;
}
exports.bufferToFloat32Array = bufferToFloat32Array;
//# sourceMappingURL=bufferUtil.js.map