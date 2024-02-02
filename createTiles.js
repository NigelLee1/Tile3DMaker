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
  maxLenK: 16.0,
 // instancesGeometricError: 443 * 16, // 4000.0, // tileWidth * 4
  //geometricErrorArr: [500, 380, 350, 320, 290, 260, 230, 200, 170, 140, 110, 80, 50, 20, 5, 0],
  geometricErrorArr: [500, 366, 274, 206, 154, 115, 86, 64, 0 ],//48, 36, 27, 20, 15, 11, 8, 6, 4, 3, 2, 0],
 // geometricErrorArr: [380, 200, 100, 0],
  prettyJson: true,
  gzip: false,
  instancesUri: 'IdentityPipe.gltf' // 'cuboid.gltf'
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
  var pipes = fsExtra.readJsonSync('data/pipes.json');
  processData(pipes);
  //console.log(pipes[0]);
  var tileOptions = {
    createBatchTable: true
  };
  saveInstancedTileset('InstancedWithAllTile', tileOptions, {}, pipes);
  console.log('success');
}

function processData(pipes) {
  for (var i = pipes.length - 1; i >= 0; --i) {
    var pipe = pipes[i];
    if (pipe.w === 0 || (pipe.a.x === pipe.b.x && pipe.a.y === pipe.b.y)) {
      pipes.splice(i, 1);
      continue;
    }
    var projection = new cesium_1.WebMercatorProjection();
    var pa = projection.unproject(
      new cesium_1.Cartesian3(
        pipe.a.x,
        pipe.a.y,
        0
      )
    );
    pipe.a.longitude = pa.longitude;
    pipe.a.latitude = pa.latitude;
    var pb = projection.unproject(
      new cesium_1.Cartesian3(
        pipe.b.x,
        pipe.b.y,
        0
      )
    );
    pipe.b.longitude = pb.longitude;
    pipe.b.latitude = pb.latitude;

    pipe.a.c3 = cesium_1.Cartesian3.fromRadians(pa.longitude, pa.latitude);
    pipe.b.c3 = cesium_1.Cartesian3.fromRadians(pb.longitude, pb.latitude);
  }
}

function saveInstancedTileset(tilesetName, tileOptions, tilesetOptions, pipes) {
  var tilesetDirectory, tilesetPath, use3dTilesNext, useGlb, ext, tilePath, result, tilesetJson, i3dm, batchTableJson, promises, copyPath;
  tilesetDirectory = path.join('output', 'Instanced', tilesetName);
  tilesetDirectory = 'D:\\Workplace\\HTML\\CesiumDemo\\3dTile\\Instanced\\InstancedWithAllTile2';
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
  //tilePath = path.join(tilesetDirectory, tilesetOptions.contentUri);
 // tilesetOptions.geometricError = exports.instancesGeometricError;
  tilesetOptions.region = exports.instancesRegion;
  console.log(pipes.length);
  exports.pipeCount = 0;
  createChild(pipes, 0, tilesetDirectory, "tileset", tileOptions);
  //result = createInstancesTile(tileOptions, pipes);
  //tilesetJson = createTilesetJsonSingle(tileOptions, tilesetOptions, pipes);
  /*var pipes1 = [], index = 0;
  for (var i = 0; i < exports.geometricErrorArr.length; i++) {
    pipes1 = getPipesBetweenSize(pipes, exports.geometricErrorArr[i] / exports.maxLenK, undefined);
    if (pipes1.length > 0) {
      index = i;
      break;
    }
  }
  
  var boundingRegion = getBoundingRegion(pipes);
  var geometricError;
  if (index + 1 < exports.geometricErrorArr.length)
    geometricError = exports.geometricErrorArr[index + 1];
  else
    geometricError = 0;
  var root = {
    refine: 'ADD',
    boundingVolume: {
      region: boundingRegion,
    },
    geometricError: geometricError,
    content: {
      uri: index + ".i3dm"
    }
  };
  tilesetJson = {
    asset: {
      version: "1.0"
    },
    geometricError: exports.geometricErrorArr[index],
    root: root
  };
  tilePath = path.join(tilesetDirectory, index + ".i3dm");
  exports.pipeCount = pipes1.length;
  result = createInstancesTile(tileOptions, pipes1);
  utils.saveBinary(tilePath, result.i3dm, exports.gzip);

  var fourPipes = splitFourPipes(pipes);
  var children = [];
  for (let j = 0; j < fourPipes.length; j++) {
    if (fourPipes[j].length > 0) {
      let pipes0 = fourPipes[j];
      let ge = 0;
      if (index + 1 < exports.geometricErrorArr.length)
        ge = exports.geometricErrorArr[index + 1];
      var child = {
        boundingVolume: {
          region: getBoundingRegion(pipes0)
        },
        geometricError: ge,
        content: {
          uri: index + "_" + j + ".json"
        }
      }
      children.push(child);
    }
  }
  if (children.length > 0)
    root.children = children;
  utils.saveJson(tilesetPath, tilesetJson, exports.prettyJson, exports.gzip);
  for (let j = 0; j < fourPipes.length; j++) {
    if (fourPipes[j].length > 0) {
      let pipes0 = fourPipes[j];
      createChild(pipes0, index + 1, tilesetDirectory, index + "_" + j, tileOptions);
    }
  }*/
  fsExtra.copyFileSync('D:\\Workplace\\HTML\\CesiumDemo\\3dTile\\Instanced\\IdentityPipe.gltf',
    'D:\\Workplace\\HTML\\CesiumDemo\\3dTile\\Instanced\\InstancedWithAllTile2\\IdentityPipe.gltf');
  console.log(exports.pipeCount);
}

function createChild(pipes, index, tilesetDirectory, name, tileOptions) {
  let ge = 0;
  if (index + 1 < exports.geometricErrorArr.length)
    ge = exports.geometricErrorArr[index + 1];
  var root = {
    refine: 'ADD',
    boundingVolume: {
      region: getBoundingRegion(pipes),
    },
    geometricError: ge
  };
  var tilesetJson = {
    asset: {
      version: "1.0"
    },
    geometricError: exports.geometricErrorArr[index],
    root: root
  };
  var biggerSize = undefined;
  if (index > 0)
    biggerSize = exports.geometricErrorArr[index] / exports.maxLenK;
  var myPipes = getPipesBetweenSize(pipes, exports.geometricErrorArr[index + 1] / exports.maxLenK, biggerSize);
  if (myPipes.length > 0) {
    root.content = {
      uri: name + ".i3dm"
    };
    var tilePath = path.join(tilesetDirectory, name + ".i3dm");
    exports.pipeCount += myPipes.length;
    let result = createInstancesTile(tileOptions, myPipes);
    utils.saveBinary(tilePath, result.i3dm, exports.gzip);
  }

  var fourPipes = splitFourPipes(pipes);
  var children = [];
  if (index + 2 < exports.geometricErrorArr.length) {
    for (let j = 0; j < fourPipes.length; j++) {
      if (fourPipes[j].length > 0) {
        let pipes0 = fourPipes[j];
        //if (myPipes.length > 0) {
        var child = {
          boundingVolume: {
            region: getBoundingRegion(pipes0)
          },
          geometricError: ge,
          content: {
            uri: name + "_" + j + ".json"
          }
        }
        children.push(child);
      }
    }
    if (children.length > 0)
      root.children = children;
  }

  let tilesetPath = path.join(tilesetDirectory, name + '.json');
  utils.saveJson(tilesetPath, tilesetJson, exports.prettyJson, exports.gzip);
  if (index + 2 < exports.geometricErrorArr.length) {
    for (let j = 0; j < fourPipes.length; j++) {
      if (fourPipes[j].length > 0) {
        let pipes0 = fourPipes[j];
        createChild(pipes0, index + 1, tilesetDirectory, name + "_" + j, tileOptions);
      }
    }
  }
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

function getBoundingRegion(pipes) {
  var xmin = 1000, ymin = 1000, xmax = -1000, ymax = -1000, maxW = -1000;
  for (var i = 0; i < pipes.length; i++) {
    var pipe = pipes[i];
    if (pipe.a.longitude < xmin)
      xmin = pipe.a.longitude;
    if (pipe.b.longitude < xmin)
      xmin = pipe.b.longitude;
    if (pipe.a.latitude < ymin)
      ymin = pipe.a.latitude;
    if (pipe.b.latitude < ymin)
      ymin = pipe.b.latitude;
    if (pipe.a.longitude > xmax)
      xmax = pipe.a.longitude;
    if (pipe.b.longitude > xmax)
      xmax = pipe.b.longitude;
    if (pipe.a.latitude > ymax)
      ymax = pipe.a.latitude;
    if (pipe.b.latitude > ymax)
      ymax = pipe.b.latitude;
    if (pipe.w > maxW)
      maxW = pipe.w;
  }
  var h = maxW * 10.0 / 1000.0;
  return [xmin, ymin, xmax, ymax, 0, h];
}

function createTilesetJsonSingle(tileOptions, tilesetOptions, pipes) {
  var transform = tilesetOptions.transform != null ? tilesetOptions.transform : cesium_1.Matrix4.IDENTITY;
  var transformArray = !cesium_1.Matrix4.equals(transform, cesium_1.Matrix4.IDENTITY)
    ? cesium_1.Matrix4.pack(transform, new Array(16)) : undefined;
  var boundingVolume = utils.getBoundingVolume(tilesetOptions.region, tilesetOptions.box, tilesetOptions.sphere);
  var version = tilesetOptions.versionNumber !== null && tilesetOptions.versionNumber !== undefined
    ? tilesetOptions.versionNumber : defaultTilesetVersion;

  //exports.geometricErrorArr[0] 
  //pipes0 = getPipesBetweenSize(pipes, exports.geometricErrorArr[1], undefined)
  return {
    asset: {
      version: version
    },
    geometricError: exports.geometricErrorArr[0],
    root: {
      //transform: transformArray,
     // expire: tilesetOptions.expire,
      refine: 'ADD',
      boundingVolume: boundingVolume,
      geometricError: 0.0,
      content: {
        uri: tilesetOptions.contentUri
      }
    }
  };
}

function getPipesBetweenSize(pipes, smallSize, biggerSize) // > smallSize <= biggerSize
{
  //console.log("smallSize:" + smallSize + ",biggerSize:" + biggerSize);
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

function createInstancesTile(options, pipes) {
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
  featureTableJson.INSTANCES_LENGTH = pipes.length;
  attributes = [];
  center = cesium_1.Matrix4.multiplyByPoint(transform, new cesium_1.Cartesian3(), new cesium_1.Cartesian3());
  attributes.push(getPositions(pipes, transform));
  attributes = attributes.concat(getOrientations(pipes));
  attributes.push(getNonUniformScales(pipes));
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

  batchTableJson = generateInstancesBatchTable(pipes);

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

function getPosition(pipe, transform) {
  /*var width = Math.round(Math.sqrt(instancesLength));
  var x = i % width;
  var y = Math.floor(i / width);
  var z = 0.0;
  if (width !== 1) {
    x = x / (width - 1) - 0.5;
    y = y / (width - 1) - 0.5;
  }
  x *= tileWidth - modelSize * 2.0;
  y *= tileWidth - modelSize * 2.0;*/
  //console.log("x:" + x + ",y:" + y + ",z:" + z);
  /*var position2 = new cesium_1.Cartesian3(0, 0, 0);
  //console.log(transform);
  //console.log("position.x:" + position.x + ",position.y:" + position.y + ",position.z:" + position.z);
  cesium_1.Matrix4.multiplyByPoint(transform, position2, position2);
  console.log(position2);*/
  //console.log(transform);
  //console.log("position2.x:" + position.x + ",position2.y:" + position.y + ",position2.z:" + position.z);
  var projection = new cesium_1.WebMercatorProjection();
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
  return position;
}

function getPositions(pipes, transform) {
  /*var tmpTransform = utils.wgs84Transform(exports.longitude, exports.latitude, exports.instancesModelSize / 2.0);
  var position = new cesium_1.Cartesian3(1, 0, 0);
  cesium_1.Matrix4.multiplyByPoint(tmpTransform, position, position);
  console.log(position);*/
  //var p = cesium_1.Cartesian3.fromDegrees(113.38078 + 0.00001, 22.51365);
  //console.log(p);
  /*var projection = new cesium_1.WebMercatorProjection();
  var p = projection.unproject(
    new cesium_1.Cartesian3(
      pipes[0].a.x,
      pipes[0].a.y,
      0
    )
  );
  console.log(p.longitude * 180 / Math.PI);
  console.log(p.latitude * 180 / Math.PI);*/
  var buffer = Buffer.alloc(pipes.length * 3 * typeSize_1.FLOAT32_SIZE_BYTES);
  for (var i = 0; i < pipes.length; ++i) {
    var position = getPosition(pipes[i], transform);
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

function getOrientations(pipes) {
  var normalsUpBuffer = Buffer.alloc(pipes.length * 3 * typeSize_1.FLOAT32_SIZE_BYTES);
  var normalsRightBuffer = Buffer.alloc(pipes.length * 3 * typeSize_1.FLOAT32_SIZE_BYTES);
  for (var i = 0; i < pipes.length; ++i) {
    var normalUp = getNormalUp(pipes[i]);
    normalsUpBuffer.writeFloatLE(normalUp.x, i * 3 * typeSize_1.FLOAT32_SIZE_BYTES);
    normalsUpBuffer.writeFloatLE(normalUp.y, (i * 3 + 1) * typeSize_1.FLOAT32_SIZE_BYTES);
    normalsUpBuffer.writeFloatLE(normalUp.z, (i * 3 + 2) * typeSize_1.FLOAT32_SIZE_BYTES);
    var normalRight = getNormalRight(pipes[i]);
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

function getNormalUp(pipe) {
  //var x = pipe.b.x - pipe.a.x;
  //var y = pipe.b.y - pipe.a.y;
  var projection = new cesium_1.WebMercatorProjection();
  var p = projection.unproject(
    new cesium_1.Cartesian3(
      pipe.a.x,
      pipe.a.y,
      0
    )
  );
  var pos = cesium_1.Cartesian3.fromRadians(p.longitude, p.latitude);
  var fixedFrame = cesium_1.Transforms.eastNorthUpToFixedFrame(pos, cesium_1.Ellipsoid.WGS84);
  var x = fixedFrame[8];
  var y = fixedFrame[9];
  var z = fixedFrame[10];
  var normal = new cesium_1.Cartesian3(x, y, z);
  cesium_1.Cartesian3.normalize(normal, normal);
  return normal;
}

function getNormalRight(pipe) {
  //var x = pipe.b.x - pipe.a.x;
  //var y = pipe.b.y - pipe.a.y;
  var projection = new cesium_1.WebMercatorProjection();
  var p = projection.unproject(
    new cesium_1.Cartesian3(
      pipe.a.x,
      pipe.a.y,
      0
    )
  );
  var pos = cesium_1.Cartesian3.fromRadians(p.longitude, p.latitude);
  var fixedFrame = cesium_1.Transforms.eastNorthUpToFixedFrame(pos, cesium_1.Ellipsoid.WGS84);
  var rotatee = new cesium_1.Cartesian3(fixedFrame[0], fixedFrame[1], fixedFrame[2]); //east/right
  var rotater = new cesium_1.Cartesian3(fixedFrame[8], fixedFrame[9], fixedFrame[10]); //up
  var angle = calcAngle(pipe);
  var result = rotateVector(rotatee, rotater, angle);
  var x = result.x;
  var y = result.y;
  var z = result.z;
  var normal = new cesium_1.Cartesian3(x, y, z);
  cesium_1.Cartesian3.normalize(normal, normal);
  return normal;
}

function calcAngle(pipe) {
  return Math.atan2(pipe.b.y - pipe.a.y, pipe.b.x - pipe.a.x);
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

function getNonUniformScales(pipes) {
  var buffer = Buffer.alloc(pipes.length * 3 * typeSize_1.FLOAT32_SIZE_BYTES);
  for (var i = 0; i < pipes.length; ++i) {
    var pipe = pipes[i];
    var scale = getScale(pipe);
    buffer.writeFloatLE(scale.x, i * 3 * typeSize_1.FLOAT32_SIZE_BYTES);
    buffer.writeFloatLE(scale.y, (i * 3 + 1) * typeSize_1.FLOAT32_SIZE_BYTES);
    buffer.writeFloatLE(scale.z, (i * 3 + 2) * typeSize_1.FLOAT32_SIZE_BYTES);
  }
  return {
    buffer: buffer,
    propertyName: 'SCALE_NON_UNIFORM',
    byteAlignment: typeSize_1.FLOAT32_SIZE_BYTES
  };
}


function getScale(pipe) {
  var projection = new cesium_1.WebMercatorProjection();
  var pa = projection.unproject(
    new cesium_1.Cartesian3(
      pipe.a.x,
      pipe.a.y,
      0
    )
  );
  var positionA = cesium_1.Cartesian3.fromRadians(pa.longitude, pa.latitude);
  var pb = projection.unproject(
    new cesium_1.Cartesian3(
      pipe.b.x,
      pipe.b.y,
      0
    )
  );
  var positionB = cesium_1.Cartesian3.fromRadians(pb.longitude, pb.latitude);
  var scaleX = cesium_1.Cartesian3.distance(positionA, positionB);
  var scaleY = pipe.w / 1000.0 / 2.0;
  var scaleZ = scaleY;

  return { x: scaleX, y: scaleY, z: scaleZ };
}

function generateInstancesBatchTable(pipes) {
  var list = [];
  for (var i = 0; i < pipes.length; i++)
    //list.push(pipes[i].id);
    list.push(pipes[i].id);
  //console.log(list.length);
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