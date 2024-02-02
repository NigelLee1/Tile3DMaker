'use strict';
var path = require('path');
var cesium_1 = require("cesium");
var utils = require('./lib/utils');
var fsExtra = require('fs-extra');

var exports = {
  //longitude: -1.31968,
  //latitude: 0.698874,
  tileWidth: 443,  // 1000, maxLen 最大的模型的大小
  instancesModelSize: 30, // 1000.0, // h
  maxLenK: 32.0, // 控制显示精细度，越大越精细，但也更卡
  // instancesGeometricError: 443 * 16, // 4000.0, // tileWidth * 4
  //geometricErrorArr: [16000, 8000, 4000, 2000, 1000, 500, 400, 390, 380, 350, 320, 290, 260, 230, 200, 170, 140, 110, 80, 50, 20, 5, 0],
  //geometricErrorArr: [500, 366, 274, 206, 154, 115, 86, 64, 0],
 // geometricErrorArr: [5000, 390, 385, 320, 180, 86, 0],  // 修改得每层的每块区域最多只有1千多个管即可
  prettyJson: true,
  gzip: false,
  instancesUri: 'cuboid.gltf' // 'cuboid.gltf'
};
//var lon = exports.longitude * 180.0 / Math.PI;
//var lat = exports.latitude * 180.0 / Math.PI;
//console.log('lon:' + lon + ',lat:' + lat);
exports.longitude = 113.38078 * Math.PI / 180.0;
exports.latitude = 22.51365 * Math.PI / 180.0;
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

function createInstancedWithAllTile() {
  var tileOptions = {
    createBatchTable: true
  };
  saveInstancedTileset('GeometryErrorTest', tileOptions, {});
  console.log('success');
}

function saveInstancedTileset(tilesetName, tileOptions, tilesetOptions) {
  var tilesetDirectory, tilesetPath, use3dTilesNext, useGlb, ext, tilePath, result, tilesetJson, i3dm, batchTableJson, promises, copyPath;
  tilesetDirectory = path.join('output', 'Instanced', tilesetName);
  tilesetDirectory = 'D:\\Workplace\\HTML\\CesiumDemo\\3dTile\\Instanced\\GeometryErrorTest';
  if (fsExtra.pathExistsSync(tilesetDirectory)) {
    fsExtra.rmdirSync(tilesetDirectory, { recursive: true });
    fsExtra.mkdirsSync(tilesetDirectory);
  }
  else
    fsExtra.mkdirsSync(tilesetDirectory);
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
  tilesetOptions.region = exports.instancesRegion;
  var geometryErrorMax = 1200;
  var boundingRegion = getBoundingRegion(geometryErrorMax - 1);
  var root = {
    refine: 'REPLACE',
    boundingVolume: {
      region: boundingRegion,
    },
    geometricError: geometryErrorMax - 1,
    content: {
      uri: (geometryErrorMax - 1) + ".i3dm"
    }
  };
  tilesetJson = {
    asset: {
      version: "1.0"
    },
    geometricError: geometryErrorMax,
    root: root
  };
  result = createInstancesTile(tileOptions, geometryErrorMax - 1);
  tilePath = path.join(tilesetDirectory, (geometryErrorMax - 1) + ".i3dm");
  utils.saveBinary(tilePath, result.i3dm, exports.gzip);
  getChild(geometryErrorMax - 2, root, tilesetDirectory, tileOptions);
  utils.saveJson(tilesetPath, tilesetJson, exports.prettyJson, exports.gzip);
  fsExtra.copyFileSync('D:\\Workplace\\HTML\\CesiumDemo\\3dTile\\Instanced\\cuboid.gltf',
    tilesetDirectory + '\\cuboid.gltf');
/*  var pipes1 = [], index = 0;
  for (var i = 0; i < exports.geometricErrorArr.length; i++) {
    pipes1 = getPipesBetweenSize(pipes, exports.geometricErrorArr[i] / exports.maxLenK, undefined);
    if (pipes1.length > 0) {
      index = i;
      break;
    }
  }
  var boundingRegion = getBoundingRegion(pipes);
  var root = {
    refine: 'ADD',
    boundingVolume: {
      region: boundingRegion,
    },
    geometricError: exports.geometricErrorArr[index],
    content: {
      uri: index + ".i3dm"
    }
  };
  tilesetJson = {
    asset: {
      version: "1.0"
    },
    geometricError: exports.geometricErrorArr[index - 1],
    root: root
  };
  tilePath = path.join(tilesetDirectory, index + ".i3dm");
  exports.pipeCount = pipes1.length;
  exports.levelPipes = {};
  exports.levelPipes[index] = pipes1.length;
  result = createInstancesTile(tileOptions, pipes1);
  utils.saveBinary(tilePath, result.i3dm, exports.gzip);
  getChild(pipes, index + 1, root, tilesetDirectory, index + "", tileOptions);
  utils.saveJson(tilesetPath, tilesetJson, exports.prettyJson, exports.gzip);
  fsExtra.copyFileSync('D:\\Workplace\\HTML\\CesiumDemo\\3dTile\\Instanced\\IdentityPipe.gltf',
    'D:\\Workplace\\HTML\\CesiumDemo\\3dTile\\Instanced\\InstancedWithAllTile3\\IdentityPipe.gltf');
  console.log(exports.pipeCount);
  for (var key in exports.levelPipes) {
    console.log(key + ":" + exports.levelPipes[key]);
  }*/
}

function getBoundingRegion(geometryError) {
  var xmin = exports.longitude - 0.01 * Math.PI / 180.0;
  var ymin = exports.latitude - 0.01 * Math.PI / 180.0;
  var xmax = exports.longitude + 0.01 * Math.PI / 180.0;
  var ymax = exports.latitude + 0.01 * Math.PI / 180.0;
  return [xmin, ymin, xmax, ymax, 0, 100];
}

function getChild(geometryError, root, tilesetDirectory, tileOptions) {
  var children = [];
  var child = {
    boundingVolume: {
      region: getBoundingRegion(geometryError)
    },
    geometricError: geometryError
  }
    
  child.content = {
    uri: geometryError + ".i3dm"
  };
  var tilePath = path.join(tilesetDirectory, geometryError + ".i3dm");
  let result = createInstancesTile(tileOptions, geometryError);
  utils.saveBinary(tilePath, result.i3dm, exports.gzip);
      

  if (geometryError > 0)
    getChild(geometryError - 1, child, tilesetDirectory, tileOptions);
  children.push(child);
  root.children = children;
}

function splitFourPipes(pipes) {
  var boundingRegion = getBoundingRegion(pipes);
  var centerX = (boundingRegion[0] + boundingRegion[2]) / 2.0;
  var centerY = (boundingRegion[1] + boundingRegion[3]) / 2.0;
  var leftDownPipes = [], leftUpPipes = [], rightDownPipes = [], rightUpPipes = [];
  for (var i = 0; i < pipes.length; i++) {
    var pipe = pipes[i];
    var cx = (pipe.a.longitude + pipe.b.longitude) / 2.0;
    var cy = (pipe.a.latitude + pipe.b.latitude) / 2.0;
    if (cx < centerX && cy < centerY)
      leftDownPipes.push(pipe);
    else if (cx < centerX)
      leftUpPipes.push(pipe);
    else if (cy < centerY)
      rightDownPipes.push(pipe);
    else
      rightUpPipes.push(pipe);
  }
  return [leftDownPipes, leftUpPipes, rightDownPipes, rightUpPipes];
}

function getPipesBetweenSize(pipes, smallSize, biggerSize) // > smallSize <= biggerSize
{
  var list = [];
  for (var i = 0; i < pipes.length; i++) {
    var pipe = pipes[i];
    var size = getPipeSize(pipe);
    if ((smallSize === 0 || size > smallSize) && (biggerSize === undefined || size <= biggerSize))
      list.push(pipe);
  }
  return list;
}

function getPipeSize(pipe) {
  var cx = Math.abs(pipe.b.x - pipe.a.x);
  var cy = Math.abs(pipe.b.y - pipe.a.y);
  var h = pipe.w * 10.0 / 1000.0;
  var minxy = cx + cy;
  if (minxy < h)
    return minxy;
  else
    return h;
}

function createInstancesTile(options, geometryError) {
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
  featureTableJson.INSTANCES_LENGTH = 1;
  attributes = [];
  center = cesium_1.Matrix4.multiplyByPoint(transform, new cesium_1.Cartesian3(), new cesium_1.Cartesian3());
  attributes.push(getPositions(geometryError, transform));
  attributes = attributes.concat(getOrientations(geometryError));
  attributes.push(getNonUniformScales(geometryError));
  //featureTableJson.EAST_NORTH_UP = true;
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

  batchTableJson = generateInstancesBatchTable(geometryError);

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

function getPosition(geometryError, transform) {
  /*var projection = new cesium_1.WebMercatorProjection();
  var p = projection.unproject(
    new cesium_1.Cartesian3(
      pipe.a.x,
      pipe.a.y,
      0
    )
  );
  var h = pipe.w * 10.0 / 1000.0 / 2.0;
  var position = cesium_1.Cartesian3.fromRadians(p.longitude, p.latitude, h);
  //console.log(position);
  return position;*/
  return cesium_1.Cartesian3.fromRadians(exports.longitude, exports.latitude, 1);
}

function getPositions(geometryError, transform) {
  var buffer = Buffer.alloc(1 * 3 * typeSize_1.FLOAT32_SIZE_BYTES);
  for (var i = 0; i < 1; ++i) {
    var position = getPosition(geometryError, transform);
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

function getOrientations(geometryError) {
  var normalsUpBuffer = Buffer.alloc(1 * 3 * typeSize_1.FLOAT32_SIZE_BYTES);
  var normalsRightBuffer = Buffer.alloc(1 * 3 * typeSize_1.FLOAT32_SIZE_BYTES);
  for (var i = 0; i < 1; ++i) {
    var normalUp = getNormalUp(geometryError);
    normalsUpBuffer.writeFloatLE(normalUp.x, i * 3 * typeSize_1.FLOAT32_SIZE_BYTES);
    normalsUpBuffer.writeFloatLE(normalUp.y, (i * 3 + 1) * typeSize_1.FLOAT32_SIZE_BYTES);
    normalsUpBuffer.writeFloatLE(normalUp.z, (i * 3 + 2) * typeSize_1.FLOAT32_SIZE_BYTES);
    var normalRight = getNormalRight(geometryError);
    normalsRightBuffer.writeFloatLE(normalRight.x, i * 3 * typeSize_1.FLOAT32_SIZE_BYTES);
    normalsRightBuffer.writeFloatLE(normalRight.y, (i * 3 + 1) * typeSize_1.FLOAT32_SIZE_BYTES);
    normalsRightBuffer.writeFloatLE(normalRight.z, (i * 3 + 2) * typeSize_1.FLOAT32_SIZE_BYTES);
  }
  return [
    {
      buffer: normalsUpBuffer,
      propertyName: 'NORMAL_UP',
      byteAlignment: typeSize_1.FLOAT32_SIZE_BYTES
    },
    {
      buffer: normalsRightBuffer,
      propertyName: 'NORMAL_RIGHT',
      byteAlignment: typeSize_1.FLOAT32_SIZE_BYTES
    }
  ];
}

function getNormalUp(geometryError) {
  /*var projection = new cesium_1.WebMercatorProjection();
  var p = projection.unproject(
    new cesium_1.Cartesian3(
      pipe.a.x,
      pipe.a.y,
      0
    )
  );
  var pos = cesium_1.Cartesian3.fromRadians(p.longitude, p.latitude);*/
  var pos = cesium_1.Cartesian3.fromRadians(exports.longitude, exports.latitude, 1);;
  var fixedFrame = cesium_1.Transforms.eastNorthUpToFixedFrame(pos, cesium_1.Ellipsoid.WGS84);
  var x = fixedFrame[8];
  var y = fixedFrame[9];
  var z = fixedFrame[10];
  var normal = new cesium_1.Cartesian3(x, y, z);
  cesium_1.Cartesian3.normalize(normal, normal);
  return normal;
}

function getNormalRight(geometryError) {
  /*var projection = new cesium_1.WebMercatorProjection();
  var p = projection.unproject(
    new cesium_1.Cartesian3(
      pipe.a.x,
      pipe.a.y,
      0
    )
  );
  var pos = cesium_1.Cartesian3.fromRadians(p.longitude, p.latitude);*/
  var pos = cesium_1.Cartesian3.fromRadians(exports.longitude, exports.latitude, 1);;
  var fixedFrame = cesium_1.Transforms.eastNorthUpToFixedFrame(pos, cesium_1.Ellipsoid.WGS84);
  var rotatee = new cesium_1.Cartesian3(fixedFrame[0], fixedFrame[1], fixedFrame[2]); //east/right
  var rotater = new cesium_1.Cartesian3(fixedFrame[8], fixedFrame[9], fixedFrame[10]); //up
  var angle = 0;
  var result = rotateVector(rotatee, rotater, angle);
  var x = result.x;
  var y = result.y;
  var z = result.z;
  var normal = new cesium_1.Cartesian3(x, y, z);
  cesium_1.Cartesian3.normalize(normal, normal);
  return normal;
}

function rotateVector(rotatee, rotater, angleRad) {
  var CC3 = cesium_1.Cartesian3;
  var dotS = CC3.dot(rotatee, rotater);
  var base = CC3.multiplyByScalar(rotater, dotS, new CC3());
  var vpa = CC3.subtract(rotatee, base, new CC3());
  var cx = CC3.multiplyByScalar(vpa, Math.cos(angleRad), new CC3());
  var vppa = CC3.cross(rotater, vpa, new CC3());
  var cy = CC3.multiplyByScalar(vppa, Math.sin(angleRad), new CC3());
  var temp = CC3.add(base, cx, new CC3());
  var rotated = CC3.add(temp, cy, new CC3());
  return rotated;
}

function getNonUniformScales(geometryError) {
  var buffer = Buffer.alloc(1 * 3 * typeSize_1.FLOAT32_SIZE_BYTES);
  var r = 100;
  for (var i = 0; i < 1; ++i) {
    buffer.writeFloatLE(r, i * 3 * typeSize_1.FLOAT32_SIZE_BYTES);
    buffer.writeFloatLE(r, (i * 3 + 1) * typeSize_1.FLOAT32_SIZE_BYTES);
    buffer.writeFloatLE(r, (i * 3 + 2) * typeSize_1.FLOAT32_SIZE_BYTES);
  }
  return {
    buffer: buffer,
    propertyName: 'SCALE_NON_UNIFORM',
    byteAlignment: typeSize_1.FLOAT32_SIZE_BYTES
  };
}

function generateInstancesBatchTable(geometryError) {
  var list = [];
  for (var i = 0; i < 1; i++)
    list.push(geometryError);
  return {
    id: list
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

createInstancedWithAllTile();