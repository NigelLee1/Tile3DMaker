'use strict';
var path = require('path');
var cesium_1 = require("cesium");
var utils = require('./lib/utils');
var fsExtra = require('fs-extra');
var geometryErrorUtils = require('./GeometryErrorUtils');
const { ECONNRESET } = require('constants');

var exports = {
  //longitude: -1.31968,
  //latitude: 0.698874,
  tileWidth: 443,  // 1000, maxLen 最大的模型的大小
  instancesModelSize: 30, // 1000.0, // h
  maxLenK: 32.0, // 控制显示精细度，越大越精细，但也更卡
 // instancesGeometricError: 443 * 16, // 4000.0, // tileWidth * 4
  //geometricErrorArr: [16000, 8000, 4000, 2000, 1000, 500, 400, 390, 380, 350, 320, 290, 260, 230, 200, 170, 140, 110, 80, 50, 20, 5, 0],
  //geometricErrorArr: [500, 366, 274, 206, 154, 115, 86, 64, 0],
  //geometricErrorArr: [5000, 390, 385, 320, 180, 86, 0],  
  //geometricErrorArr: [5000, 480, 320, 250, 190, 120, 0],
  //geometricErrorArr: [500, 48, 32, 25, 19, 12, 0],
  geometricErrorArr: [500, 58, 26, 22, 19, 10, 0],
  prettyJson: true,
  gzip: false//,
 // instancesUri: 'IdentityPipe.gltf' // 'cuboid.gltf'
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
  var combs = fsExtra.readJsonSync('data/combs.json');
  processData(pipes, combs);
 // pipes.splice(100, pipes.length - 100);
 // pipes[0].w = 100000;
  console.log(pipes.length + combs.length);
  var tileOptions = {
    createBatchTable: true
  };
  saveInstancedTileset('InstancedWithAllTile', tileOptions, {}, pipes, combs);
  console.log('success');
}

function processData(pipes, combs) {
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
    //let h = pipe.w / 1000.0 / 2.0;
    //let h = 0;
    pipe.a.c3 = cesium_1.Cartesian3.fromRadians(pa.longitude, pa.latitude, pipe.a.h);
    pipe.b.c3 = cesium_1.Cartesian3.fromRadians(pb.longitude, pb.latitude, pipe.b.h);
  }
  for (let i = 0; i < combs.length; i++) {
    let comb = combs[i];
    let projection = new cesium_1.WebMercatorProjection();
    let pa = projection.unproject(
      new cesium_1.Cartesian3(
        comb.x,
        comb.y,
        0
      )
    );
    comb.longitude = pa.longitude;
    comb.latitude = pa.latitude;
    comb.c3 = cesium_1.Cartesian3.fromRadians(pa.longitude, pa.latitude, comb.il);
  }
}

function saveInstancedTileset(tilesetName, tileOptions, tilesetOptions, pipes, combs) {
  var tilesetDirectory, tilesetPath, use3dTilesNext, useGlb, ext, tilePath, result, tilesetJson, i3dm, batchTableJson, promises, copyPath;
  tilesetDirectory = path.join('output', 'Instanced', tilesetName);
  tilesetDirectory = 'D:\\Workplace\\HTML\\CesiumDemo\\3dTile\\Instanced\\InstancedWithAllTile3';
  if (fsExtra.pathExistsSync(tilesetDirectory)) {
    fsExtra.rmdirSync(tilesetDirectory, { recursive: true });
    fsExtra.mkdirsSync(tilesetDirectory);
  }
  else
    fsExtra.mkdirsSync(tilesetDirectory);
  tilesetPath = path.join(tilesetDirectory, 'tileset.json');
  tileOptions = cesium_1.defaultValue(tileOptions, {});
 // tileOptions.uri = cesium_1.defaultValue(tileOptions.uri, exports.instancesUri);
  tileOptions.tileWidth = exports.tileWidth;
  var instancesTransform = utils.wgs84Transform(exports.longitude, exports.latitude, exports.instancesModelSize / 2.0);
  tileOptions.transform = cesium_1.defaultValue(tileOptions.transform, instancesTransform);
  tileOptions.eastNorthUp = cesium_1.defaultValue(tileOptions.eastNorthUp, true);
  tilesetOptions = cesium_1.defaultValue(tilesetOptions, {});
  ext = '.i3dm';
  tilesetOptions.contentUri = tilesetName + ext;
  tilesetOptions.region = exports.instancesRegion;
 /* var pipes1 = [], index = 0;
  for (var i = 0; i < exports.geometricErrorArr.length; i++) {
    pipes1 = getPipesBetweenSize(pipes, exports.geometricErrorArr[i] / exports.maxLenK, undefined);
    if (pipes1.length > 0) {
      index = i;
      break;
    }
  }*/
  exports.pipeCount = 0;
  exports.levelPipes = {};
  var boundingRegion = getBoundingRegion(pipes);
  var children = [];
  let ysPipes = [], wsPipes = [], hsPipes = [];
  for (let i = 0; i < pipes.length; i++) {
    let pipe = pipes[i];
    if (pipe.t === 'YS')
      ysPipes.push(pipe);
    else if (pipe.t === 'WS')
      wsPipes.push(pipe);
    else
      hsPipes.push(pipe);
  }

  let names = ['ys', 'ws', 'hs', 'comb'];
  let tPipes = [ysPipes, wsPipes, hsPipes, combs];
  let gltfUris = ['IdentityPipeWithYSArrow.gltf', 'IdentityPipeWithWSArrow.gltf', 'IdentityPipeWithHSArrow.gltf', 'Comb.gltf']
  for (let i = 0; i < names.length; i++) {
    if (tPipes[i].length > 0) {
      let node = {
        boundingVolume: {
          region: getBoundingRegion(tPipes[i])
        },
        geometricError: exports.geometricErrorArr[0]
      }
      getChild(tPipes[i], 1, node, tilesetDirectory, names[i], tileOptions, gltfUris[i]);
      children.push(node);
    }
  }
  
  var root = {
    refine: 'ADD',
    boundingVolume: {
      region: boundingRegion,
    },
    geometricError: exports.geometricErrorArr[0],
    /*content: {
      uri: index + ".i3dm"
    }*/
    children: children
  };
  tilesetJson = {
    asset: {
      version: "1.0"
    },
    geometricError: exports.geometricErrorArr[0],
    root: root
  };
//  tilePath = path.join(tilesetDirectory, index + ".i3dm");
  
 // exports.levelPipes[index] = pipes1.length;
 // result = createInstancesTile(tileOptions, pipes1);
 // utils.saveBinary(tilePath, result.i3dm, exports.gzip);
 // getChild(pipes, index + 1, root, tilesetDirectory, index + "", tileOptions);
  utils.saveJson(tilesetPath, tilesetJson, exports.prettyJson, exports.gzip);
  fsExtra.copyFileSync('D:\\Workplace\\HTML\\CesiumDemo\\3dTile\\Instanced\\IdentityPipeWithHSArrow.gltf',
    'D:\\Workplace\\HTML\\CesiumDemo\\3dTile\\Instanced\\InstancedWithAllTile3\\IdentityPipeWithHSArrow.gltf');
  fsExtra.copyFileSync('D:\\Workplace\\HTML\\CesiumDemo\\3dTile\\Instanced\\IdentityPipeWithWSArrow.gltf',
    'D:\\Workplace\\HTML\\CesiumDemo\\3dTile\\Instanced\\InstancedWithAllTile3\\IdentityPipeWithWSArrow.gltf');
  fsExtra.copyFileSync('D:\\Workplace\\HTML\\CesiumDemo\\3dTile\\Instanced\\IdentityPipeWithYSArrow.gltf',
    'D:\\Workplace\\HTML\\CesiumDemo\\3dTile\\Instanced\\InstancedWithAllTile3\\IdentityPipeWithYSArrow.gltf');
  fsExtra.copyFileSync('D:\\Workplace\\HTML\\CesiumDemo\\3dTile\\Instanced\\Comb.gltf',
    'D:\\Workplace\\HTML\\CesiumDemo\\3dTile\\Instanced\\InstancedWithAllTile3\\Comb.gltf');
  console.log(exports.pipeCount);
  for (var key in exports.levelPipes) {
    var len = geometryErrorUtils.getPredictCount(exports.geometricErrorArr[key - 1], boundingRegion[2] - boundingRegion[0],
      boundingRegion[3] - boundingRegion[1], exports.levelPipes[key]);
    console.log(key + ":" + exports.levelPipes[key] + "..........................." + Math.round(len));
  }
}

function getChild(pipes, index, root, tilesetDirectory, name, tileOptions, gltfUri) {
  var fourPipes = splitFourPipes(pipes);
  var children = [];
  for (let j = 0; j < fourPipes.length; j++) {
    if (fourPipes[j].length > 0) {
      var pipes0 = fourPipes[j];
      var boundingRegion = getBoundingRegion(pipes0);
      var geometryError = exports.geometricErrorArr[index];
      //if (pipes0.length < 10) {
       // geometryError = 0;
      //}
      var child = {
        boundingVolume: {
          region: boundingRegion
        },
        geometricError: geometryError
      }
      var tmpPipes = getPipesBetweenSize(pipes0, geometryError / exports.maxLenK, undefined);
      //var len = geometryErrorUtils.getPredictCount(exports.geometricErrorArr[index], boundingRegion[2] - boundingRegion[0],
      //  boundingRegion[3] - boundingRegion[1], tmpPipes.length);
      if (exports.levelPipes[index] === undefined) {
        exports.levelPipes[index] = tmpPipes.length;
      }
      else {
        exports.levelPipes[index] += tmpPipes.length;
      }

      var myPipes = getPipesBetweenSize(pipes0, geometryError / exports.maxLenK, exports.geometricErrorArr[index - 1] / exports.maxLenK);
      if (myPipes.length > 0) {
        child.content = {
          uri: name + "_" + j + ".i3dm"
        };
        var tilePath = path.join(tilesetDirectory, name + "_" + j + ".i3dm");
        exports.pipeCount += myPipes.length;
        
        
        let result = createInstancesTile(tileOptions, myPipes, gltfUri);
        utils.saveBinary(tilePath, result.i3dm, exports.gzip);
      }
      
      if (index + 1 < exports.geometricErrorArr.length && geometryError !== 0)
        getChild(pipes0, index + 1, child, tilesetDirectory, name + "_" + j, tileOptions, gltfUri);
      children.push(child);
    }
  }
  if (children.length > 0) 
    root.children = children;
}

function splitFourPipes(pipes) {
  var boundingRegion = getBoundingRegion(pipes);
  var centerX = (boundingRegion[0] + boundingRegion[2]) / 2.0;
  var centerY = (boundingRegion[1] + boundingRegion[3]) / 2.0;
  var leftDownPipes = [], leftUpPipes = [], rightDownPipes = [], rightUpPipes = [];
  for (var i = 0; i < pipes.length; i++) {
    var pipe = pipes[i];
    var cx, cy;
    if (pipe.a !== undefined) {
      cx = (pipe.a.longitude + pipe.b.longitude) / 2.0;
      cy = (pipe.a.latitude + pipe.b.latitude) / 2.0;
    }
    else {
      cx = pipe.x;
      cy = pipe.y;
    }
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
  if (pipes[0].a !== undefined) {
    let xmin = 1000, ymin = 1000, xmax = -1000, ymax = -1000, zmin = 1000, zmax = -1000;
    for (let i = 0; i < pipes.length; i++) {
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
      if (pipe.a.h < zmin)
        zmin = pipe.a.h;
      if (pipe.b.h < zmin)
        zmin = pipe.b.h;
      if (pipe.a.h + pipe.w / 1000.0 > zmax)
        zmax = pipe.a.h + pipe.w / 1000.0;
      if (pipe.b.h + pipe.w / 1000.0 > zmax)
        zmax = pipe.b.h + pipe.w / 1000.0;
    }
    return [xmin, ymin, xmax, ymax, zmin, zmax];
  }
  else {
    let xmin = 1000, ymin = 1000, xmax = -1000, ymax = -1000, zmin = 1000, zmax = -1000;
    for (let i = 0; i < pipes.length; i++) {
      let comb = pipes[i];
      if (comb.longitude < xmin)
        xmin = comb.longitude;
      if (comb.latitude < ymin)
        ymin = comb.latitude;
      if (comb.longitude > xmax)
        xmax = comb.longitude;
      if (comb.latitude > ymax)
        ymax = comb.latitude;
      if (comb.il < zmin)
        zmin = comb.il;
      if (comb.gl > zmax)
        zmax = comb.gl;
    }
    return [xmin, ymin, xmax, ymax, zmin, zmax];
  }
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
  if (pipe.a !== undefined) {
    //var cx = Math.abs(pipe.b.x - pipe.a.x);
   // var cy = Math.abs(pipe.b.y - pipe.a.y);
    var h = pipe.w / 1000.0;
   // var minxy = cx + cy;
   // if (minxy < h)
     // return minxy;
    //else
      return h;
  }
  else {
    if (pipe.xl > pipe.yl)
      return pipe.xl / 1000.0;
    else
      return pipe.yl/ 1000.0;
  }
}

function createInstancesTile(options, pipes, gltfUri) {
  var tileWidth, transform, instancesLength, uri, embed, modelSize, createBatchTable, createBatchTableBinary, relativeToCenter, quantizePositions, eastNorthUp, orientations, octEncodeOrientations, uniformScales, nonUniformScales, batchIds, featureTableJson, attributes, center, halfWidth, i, attribute, byteOffset, attributesLength, byteAlignment, featureTableBinary, batchTableJson, batchTableBinary, batchTable, glb, i3dm;
  cesium_1.Math.setRandomNumberSeed(0);
  tileWidth = cesium_1.defaultValue(options.tileWidth, 200.0);
  transform = cesium_1.defaultValue(options.transform, cesium_1.Matrix4.IDENTITY);
  instancesLength = cesium_1.defaultValue(options.instancesLength, 1);
  uri = gltfUri;
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
 // pipes = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }
   // , { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }
  //  , { x: 0, y: 3 }, { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 }];
  featureTableJson.INSTANCES_LENGTH = pipes.length;
  attributes = [];
  //center = cesium_1.Matrix4.multiplyByPoint(transform, new cesium_1.Cartesian3(), new cesium_1.Cartesian3());
  center = getCenter(pipes);
  featureTableJson.RTC_CENTER = [center.x, center.y, center.z];
  attributes.push(getPositions(pipes, transform, center));
  attributes = attributes.concat(getOrientations(pipes));
  attributes.push(getNonUniformScales(pipes));
 // featureTableJson.EAST_NORTH_UP = true;
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

function getCenter(pipes) {
  if (pipes[0].a !== undefined) {
    let sumX = 0, sumY = 0, sumZ = 0;
    for (let i = 0; i < pipes.length; i++) {
      let pipe = pipes[i];
      sumX += pipe.a.c3.x;
      sumY += pipe.a.c3.y;
      sumZ += pipe.a.c3.z;
      sumX += pipe.b.c3.x;
      sumY += pipe.b.c3.y;
      sumZ += pipe.b.c3.z;
    }
    return new cesium_1.Cartesian3(sumX / (pipes.length * 2), sumY / (pipes.length * 2), sumZ / (pipes.length * 2));
  }
  else {
    let sumX = 0, sumY = 0, sumZ = 0;
    for (let i = 0; i < pipes.length; i++) {
      let comb = pipes[i];
      sumX += comb.c3.x;
      sumY += comb.c3.y;
      sumZ += comb.c3.z;
    }
    return new cesium_1.Cartesian3(sumX / pipes.length, sumY / pipes.length, sumZ / pipes.length);
  }
}

function getPosition(pipe, transform) {
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
 // var h = 1000 / 1000.0 / 2.0;
  //var h = pipe.w / 1000.0 / 2.0;
  //var position = cesium_1.Cartesian3.fromRadians((pipe.a.longitude + pipe.b.longitude) / 2.0, (pipe.a.latitude + pipe.b.latitude) / 2.0, 0);
 // var position = cesium_1.Cartesian3.fromRadians(pipe.a.longitude, pipe.a.latitude, 0);
  //let position = pipe.a.c3;
  //var positions = [position.x, position.y, position.z];
  
  /*position.x = -2338741.3782883184;// -2338740.224476347;
  position.y = 5411154.768278739; // 5411155.266964717;
  position.z = 2427060.894330053; // 2427060.8943300536;*/
 /* positions = cesium_1.PolygonPipeline.scaleToGeodeticHeight([position.x, position.y, position.z], 0, cesium_1.Ellipsoid.WGS84, true);
  position.x = positions[0];
  position.y = positions[1];
  position.z = positions[2];*/
  //let transform2 = utils.wgs84Transform(113.37434793370977 * Math.PI / 180.0, 22.513691540341167 * Math.PI / 180.0, 0);
  //var position = new cesium_1.Cartesian3(pipe.x, pipe.y, 0);
  //cesium_1.Matrix4.multiplyByPoint(transform2, position, position);
  if (pipe.a !== undefined)
    return pipe.a.c3.clone();
  else
    return pipe.c3.clone();
}

function getPositions(pipes, transform, center) {
  var buffer = Buffer.alloc(pipes.length * 3 * typeSize_1.FLOAT32_SIZE_BYTES);
  for (var i = 0; i < pipes.length; ++i) {
    var position = getPosition(pipes[i], transform);
    position = cesium_1.Cartesian3.subtract(position, center, position);
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
  /*var projection = new cesium_1.WebMercatorProjection();
  var p = projection.unproject(
    new cesium_1.Cartesian3(
      pipe.a.x,
      pipe.a.y,
      0
    )
  );
  var pos = cesium_1.Cartesian3.fromRadians(p.longitude, p.latitude);*/
  if (pipe.a === undefined) {
    let fixedFrame = cesium_1.Transforms.eastNorthUpToFixedFrame(pipe.c3, cesium_1.Ellipsoid.WGS84);
    return new cesium_1.Cartesian3(fixedFrame[8], fixedFrame[9], fixedFrame[10]);
  }
  var pos = pipe.a.c3;
  //var pos = cesium_1.Cartesian3.fromRadians((pipe.a.longitude + pipe.b.longitude) / 2.0, (pipe.a.latitude + pipe.b.latitude) / 2.0, 0);
  //var pos = cesium_1.Cartesian3.fromRadians(pipe.a.longitude, pipe.a.latitude, 0);
  let fixedFrame = cesium_1.Transforms.eastNorthUpToFixedFrame(pos, cesium_1.Ellipsoid.WGS84);
  var up = new cesium_1.Cartesian3(fixedFrame[8], fixedFrame[9], fixedFrame[10]);
  var north = new cesium_1.Cartesian3(fixedFrame[4], fixedFrame[5], fixedFrame[6]);
  var angle = calcAngle(pipe);
  //angle = 0;
  var north2 = rotateVector(north, up, angle);
  var dis = cesium_1.Cartesian3.distance(pipe.a.c3, pipe.b.c3);
  let angle2 = Math.asin((pipe.a.h - pipe.b.h) / dis);
 // angle2 = Math.PI/ 4;
  var result = rotateVector(up, north2, angle2);
  var x = result.x;
  var y = result.y;
  var z = result.z;
  /*var x = fixedFrame[8];
  var y = fixedFrame[9];
  var z = fixedFrame[10];*/
  var normal = new cesium_1.Cartesian3(x, y, z);
   cesium_1.Cartesian3.normalize(normal, normal);
  return normal;
}

function getNormalRight(pipe) {
  /*var projection = new cesium_1.WebMercatorProjection();
  var p = projection.unproject(
    new cesium_1.Cartesian3(
      pipe.a.x,
      pipe.a.y,
      0
    )
  );
  var pos = cesium_1.Cartesian3.fromRadians(p.longitude, p.latitude);*/
  if (pipe.a === undefined) {
    let fixedFrame = cesium_1.Transforms.eastNorthUpToFixedFrame(pipe.c3, cesium_1.Ellipsoid.WGS84);
    return new cesium_1.Cartesian3(fixedFrame[0], fixedFrame[1], fixedFrame[2]);
  }
  var pos = pipe.a.c3;
  //var pos = cesium_1.Cartesian3.fromRadians((pipe.a.longitude + pipe.b.longitude)/ 2.0, (pipe.a.latitude + pipe.b.latitude)/2.0, 1);
  var fixedFrame = cesium_1.Transforms.eastNorthUpToFixedFrame(pos, cesium_1.Ellipsoid.WGS84);
  var east = new cesium_1.Cartesian3(fixedFrame[0], fixedFrame[1], fixedFrame[2]); //east/right
  var north = new cesium_1.Cartesian3(fixedFrame[4], fixedFrame[5], fixedFrame[6]);
  var up = new cesium_1.Cartesian3(fixedFrame[8], fixedFrame[9], fixedFrame[10]); //up
  var angle = calcAngle(pipe);
  //angle = 0;
  //var angle = 0;
 // var result = rotatee;
  var east2 = rotateVector(east, up, angle);
  var north2 = rotateVector(north, up, angle);
  var dis = cesium_1.Cartesian3.distance(pipe.a.c3, pipe.b.c3);
  let angle2 = Math.asin((pipe.a.h - pipe.b.h) / dis);
 // var angle2 = Math.PI/4;
  var result = rotateVector(east2, north2, angle2);
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
  /*var projection = new cesium_1.WebMercatorProjection();
  var pa = projection.unproject(
    new cesium_1.Cartesian3(
      pipe.a.x,
      pipe.a.y,
      0
    )
  );
  var positionA = cesium_1.Cartesian3.fromRadians(pa.longitude, pa.latitude);*/

 // if (pipe.id === 'HS01189')
   // console.log(pipe);
  if (pipe.a === undefined) {
   // return { x: 1, y: 1, z: 5 };
    if (pipe.xl >= pipe.yl)
      return { x: pipe.xl / 1000.0, y: pipe.gl - pipe.il, z: pipe.yl / 1000.0 };
    else
      return { x: pipe.yl / 1000.0, y: pipe.gl - pipe.il, z: pipe.xl / 1000.0 };
  }
  var positionA = pipe.a.c3;
  /*var pb = projection.unproject(
    new cesium_1.Cartesian3(
      pipe.b.x,
      pipe.b.y,
      0
    )
  );
  var positionB = cesium_1.Cartesian3.fromRadians(pb.longitude, pb.latitude);*/
  var positionB = pipe.b.c3;
  var scaleX = cesium_1.Cartesian3.distance(positionA, positionB); // / 794.0;
 // console.log("scaleX:" + scaleX);
  var scaleY = pipe.w / 1000.0 / 2.0; // / (64.0 / Math.PI);
  var scaleZ = scaleY;

  return { x: scaleX, y: scaleY, z: scaleZ };
 // return { x: 1, y: 1, z: 1 };
}

function generateInstancesBatchTable(pipes) {
  var list = [];
  for (var i = 0; i < pipes.length; i++)
    list.push(pipes[i].id);
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