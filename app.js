'use strict';
var path = require('path');
var cesium_1 = require("cesium");
var utils = require('./lib/utils');
var fsExtra = require('fs-extra');

var exports = {
  //longitude: -1.31968,
  //latitude: 0.698874,
  tileWidth: 1000.0,  // 1000, maxLen 最大的模型的大小
  instancesModelSize: 1000, // 1000.0, // h
  //maxLenK: 8,
  instancesGeometricError: 1000.0 * 16, // 4000.0, // tileWidth * 4
  //geometricErrorArr: [2000, 1000, 500, 250, 125, 62, 31, 15, 7, 3, 1],
  prettyJson: true,
  gzip: false,
  instancesUri: 'cuboid.gltf' // 'cuboid.gltf' Cesium20210113Pipes87458.gltf
};
//var lon = exports.longitude * 180.0 / Math.PI;
//var lat = exports.latitude * 180.0 / Math.PI;
//console.log('lon:' + lon + ',lat:' + lat);
exports.longitude = 113.401201 * Math.PI / 180.0;
exports.latitude = 22.4833128 * Math.PI / 180.0;
exports.instancesHeight = exports.instancesModelSize + 10.0;
exports.longitudeExtent = utils.metersToLongitude(exports.tileWidth, exports.latitude);
exports.latitudeExtent = utils.metersToLatitude(exports.tileWidth);
exports.west = exports.longitude - exports.longitudeExtent / 2.0;
exports.south = exports.latitude - exports.latitudeExtent / 2.0;
exports.east = exports.longitude + exports.longitudeExtent / 2.0;
exports.north = exports.latitude + exports.latitudeExtent / 2.0;
//exports.instancesRegion = [exports.west, exports.south, exports.east, exports.north, 0.0, exports.instancesHeight];
exports.instancesRegion = [113.301237 * Math.PI / 180.0, 22.3784168 * Math.PI / 180.0, 113.501175 * Math.PI / 180.0, 22.588129 * Math.PI / 180.0, 0.0, 18];
var typeSize_1 = {
  FLOAT32_SIZE_BYTES: 4,
  UINT32_SIZE_BYTES: 4,
  UINT16_SIZE_BYTES: 2,
  UINT8_SIZE_BYTES: 1
};
var defaultTilesetVersion = '1.0';

function createInstancedWithoutBatchTable() {
  //var pipes = fsExtra.readJsonSync('data/pipes.json');
  //console.log(pipes[0]);
  var tileOptions = {
    createBatchTable: true
  };
  return saveInstancedTileset('InstancedWithoutBatchTable', tileOptions, {});
}

function saveInstancedTileset(tilesetName, tileOptions, tilesetOptions) {
  var tilesetDirectory, tilesetPath, use3dTilesNext, useGlb, ext, tilePath, result, tilesetJson, i3dm, batchTableJson, promises, copyPath;
  tilesetDirectory = path.join('output', 'Instanced', tilesetName);
  tilesetPath = path.join(tilesetDirectory, 'tileset.json');
  tileOptions = cesium_1.defaultValue(tileOptions, {});
  tileOptions.uri = cesium_1.defaultValue(tileOptions.uri, exports.instancesUri);
  tileOptions.tileWidth = exports.tileWidth;
  var instancesTransform = utils.wgs84Transform(exports.longitude, exports.latitude, exports.instancesModelSize / 2.0);
  tileOptions.transform = cesium_1.defaultValue(tileOptions.transform, instancesTransform);
  tileOptions.eastNorthUp = cesium_1.defaultValue(tileOptions.eastNorthUp, true);
  tilesetOptions = cesium_1.defaultValue(tilesetOptions, {});
  ext = '.i3dm';
  tilesetOptions.contentUri = tilesetName + ext;
  tilePath = path.join(tilesetDirectory, tilesetOptions.contentUri);
  tilesetOptions.geometricError = exports.instancesGeometricError;
  tilesetOptions.region = exports.instancesRegion;
  result = createInstancesTile(tileOptions);
  tilesetJson = createTilesetJsonSingle(tilesetOptions);
  i3dm = result.i3dm;
  batchTableJson = result.batchTableJson;
  tilesetOptions.properties = utils.getProperties(batchTableJson);
  utils.saveJson(tilesetPath, tilesetJson, exports.prettyJson, exports.gzip);
  utils.saveBinary(tilePath, i3dm, exports.gzip);
}

function createInstancesTile(options) {
  var tileWidth, transform, instancesLength, uri, embed, modelSize, createBatchTable, createBatchTableBinary, relativeToCenter, quantizePositions, eastNorthUp, orientations, octEncodeOrientations, uniformScales, nonUniformScales, batchIds, featureTableJson, attributes, center, halfWidth, i, attribute, byteOffset, attributesLength, byteAlignment, featureTableBinary, batchTableJson, batchTableBinary, batchTable, glb, i3dm;
  cesium_1.Math.setRandomNumberSeed(0);
  tileWidth = cesium_1.defaultValue(options.tileWidth, 200.0);
  transform = cesium_1.defaultValue(options.transform, cesium_1.Matrix4.IDENTITY);
  instancesLength = cesium_1.defaultValue(options.instancesLength, 1);
  uri = options.uri;
  embed = cesium_1.defaultValue(options.embed, true);
  modelSize = cesium_1.defaultValue(options.modelSize, 1000.0);
  createBatchTable = cesium_1.defaultValue(options.createBatchTable, true);
  createBatchTableBinary = cesium_1.defaultValue(options.createBatchTableBinary, true);
  relativeToCenter = cesium_1.defaultValue(options.relativeToCenter, false);
  quantizePositions = cesium_1.defaultValue(options.quantizePositions, false);
  eastNorthUp = cesium_1.defaultValue(options.eastNorthUp, false);
  orientations = cesium_1.defaultValue(options.orientations, false);
  octEncodeOrientations = cesium_1.defaultValue(options.octEncodeOrientations, false);
  uniformScales = cesium_1.defaultValue(options.uniformScales, false);
  nonUniformScales = cesium_1.defaultValue(options.nonUniformScales, false);
  batchIds = cesium_1.defaultValue(options.batchIds, false);
  featureTableJson = {};
  featureTableJson.INSTANCES_LENGTH = instancesLength;
  attributes = [];
  center = cesium_1.Matrix4.multiplyByPoint(transform, new cesium_1.Cartesian3(), new cesium_1.Cartesian3());
  attributes.push(getPositions(instancesLength, tileWidth, modelSize, transform));
  if (orientations) {
    if (octEncodeOrientations) {
      attributes = attributes.concat(getOrientationsOctEncoded(instancesLength));
    }
    else {
      attributes = attributes.concat(getOrientations(instancesLength));
    }
  }
  else if (eastNorthUp) {
    featureTableJson.EAST_NORTH_UP = true;
  }
  if (uniformScales) {
    attributes.push(getUniformScales(instancesLength));
  }
  else if (nonUniformScales) {
    attributes.push(getNonUniformScales(instancesLength));
  }
  byteOffset = 0;
  attributesLength = attributes.length;
  for (i = 0; i < attributesLength; ++i) {
    attribute = attributes[i];
    byteAlignment = attribute.byteAlignment;
    byteOffset = Math.ceil(byteOffset / byteAlignment) * byteAlignment; // Round up to the required alignment
    attribute.byteOffset = byteOffset;
    byteOffset += attribute.buffer.length;
  }
  featureTableBinary = Buffer.alloc(byteOffset);
  for (i = 0; i < attributesLength; ++i) {
    attribute = attributes[i];
    featureTableJson[attribute.propertyName] = {
      byteOffset: attribute.byteOffset,
      componentType: attribute.componentType // Only defined for batchIds
    };
    attribute.buffer.copy(featureTableBinary, attribute.byteOffset);
  }

  if (createBatchTable) {
    if (createBatchTableBinary) {
      batchTable = generateBatchTableBinary(instancesLength);
      batchTableJson = batchTable.json;
      batchTableBinary = batchTable.binary;
    }
    else {
      batchTableJson = generateInstancesBatchTable(instancesLength, modelSize);
    }
  }

  i3dm = createI3dm({
    featureTableJson: featureTableJson,
    featureTableBinary: featureTableBinary,
    batchTableJson: batchTableJson,
    batchTableBinary: batchTableBinary,
    glb: glb,
    uri: uri
  });
  return {
    i3dm: i3dm,
    batchTableJson: batchTableJson
  }
}
function getPosition(i, instancesLength, tileWidth, modelSize, transform) {
  var width = Math.round(Math.sqrt(instancesLength));
  var x = i % width;
  var y = Math.floor(i / width);
  var z = 0.0;
  if (width !== 1) {
    x = x / (width - 1) - 0.5;
    y = y / (width - 1) - 0.5;
  }
  x *= tileWidth - modelSize * 2.0;
  y *= tileWidth - modelSize * 2.0;
  //console.log("x:" + x + ",y:" + y + ",z:" + z);
  var position = new cesium_1.Cartesian3(x, y, z);
  //console.log(transform);
  //console.log("position.x:" + position.x + ",position.y:" + position.y + ",position.z:" + position.z);
  cesium_1.Matrix4.multiplyByPoint(transform, position, position);
  //console.log(transform);
  //console.log("position2.x:" + position.x + ",position2.y:" + position.y + ",position2.z:" + position.z);
  return position;
}

function getPositions(instancesLength, tileWidth, modelSize, transform) {
  var buffer = Buffer.alloc(instancesLength * 3 * typeSize_1.FLOAT32_SIZE_BYTES);
  for (var i = 0; i < instancesLength; ++i) {
    var position = getPosition(i, instancesLength, tileWidth, modelSize, transform);
    //console.log(position);
    buffer.writeFloatLE(position.x, i * 3 * typeSize_1.FLOAT32_SIZE_BYTES);
    buffer.writeFloatLE(position.y, (i * 3 + 1) * typeSize_1.FLOAT32_SIZE_BYTES);
    buffer.writeFloatLE(position.z, (i * 3 + 2) * typeSize_1.FLOAT32_SIZE_BYTES); 
  }
  return {
    buffer: buffer,
    propertyName: 'POSITION',
    byteAlignment: typeSize_1.FLOAT32_SIZE_BYTES
  };
}

function createI3dm(options) {
  var version = 1;
  var headerByteLength = 32;
  var featureTableJson = utils.getJsonBufferPadded(options.featureTableJson, headerByteLength);
  var featureTableBinary = utils.getBufferPadded(options.featureTableBinary);
  var batchTableJson = utils.getJsonBufferPadded(options.batchTableJson);
  var batchTableBinary = utils.getBufferPadded(options.batchTableBinary);
  var gltfFormat = cesium_1.defined(options.glb) ? 1 : 0;
  var gltfBuffer = cesium_1.defined(options.glb) ? options.glb : utils.getGltfUriBuffer(options.uri);
  var featureTableJsonByteLength = featureTableJson.length;
  var featureTableBinaryByteLength = featureTableBinary.length;
  var batchTableJsonByteLength = batchTableJson.length;
  var batchTableBinaryByteLength = batchTableBinary.length;
  var gltfByteLength = gltfBuffer.length;
  var byteLength = headerByteLength + featureTableJsonByteLength + featureTableBinaryByteLength + batchTableJsonByteLength + batchTableBinaryByteLength + gltfByteLength;
  var header = Buffer.alloc(headerByteLength);
  header.write('i3dm', 0);
  header.writeUInt32LE(version, 4);
  header.writeUInt32LE(byteLength, 8);
  header.writeUInt32LE(featureTableJsonByteLength, 12);
  header.writeUInt32LE(featureTableBinaryByteLength, 16);
  header.writeUInt32LE(batchTableJsonByteLength, 20);
  header.writeUInt32LE(batchTableBinaryByteLength, 24);
  header.writeUInt32LE(gltfFormat, 28);
  return Buffer.concat([header, featureTableJson, featureTableBinary, batchTableJson, batchTableBinary, gltfBuffer]);
}

function createTilesetJsonSingle(options) {
  var _a;
  var transform = options.transform != null ? options.transform : cesium_1.Matrix4.IDENTITY;
  //console.log(transform);
  var transformArray = !cesium_1.Matrix4.equals(transform, cesium_1.Matrix4.IDENTITY)
    ? cesium_1.Matrix4.pack(transform, new Array(16))
    : undefined;
  //console.log('region:' + options.region);
  //console.log(options.region);
  //console.log('box:' + options.box);
  //console.log(options.box);
  //console.log('sphere:');
  //console.log(options.sphere);
  var boundingVolume = utils.getBoundingVolume(options.region, options.box, options.sphere);
  //console.log('boundingVolume');
  //console.log(boundingVolume);
  var extensions = options.extensions != null ? options.extensions : null;
  var extensionsRequired = (_a = options === null || options === void 0 ? void 0 : options.extensions) === null || _a === void 0 ? void 0 : _a.extensionsRequired;
  var version = options.versionNumber !== null && options.versionNumber !== undefined
    ? options.versionNumber
    : defaultTilesetVersion;
  return {
    asset: {
      version: version
    }, 
    geometricError: options.geometricError,
    root: {
      transform: transformArray,
      expire: options.expire,
      refine: 'ADD',
      boundingVolume: boundingVolume,
      geometricError: 0.0,
      content: {
        uri: options.contentUri
      }
    }
  };
}

function generateInstancesBatchTable(instancesLength, modelSize) {
  return {
    Height: new Array(instancesLength).fill(modelSize)
  };
}

function generateBatchTableBinary(instancesLength) {
  var idBuffer = Buffer.alloc(instancesLength * typeSize_1.UINT32_SIZE_BYTES);
  for (var i = 0; i < instancesLength; ++i) {
    idBuffer.writeUInt32LE(i + 88, i * typeSize_1.UINT32_SIZE_BYTES);
  }
  var batchTableJson = {
    id: { byteOffset: 0, componentType: 'UNSIGNED_INT', type: 'SCALAR' }
  };
  return { json: batchTableJson, binary: idBuffer };
}

createInstancedWithoutBatchTable();
console.log('Hello world');