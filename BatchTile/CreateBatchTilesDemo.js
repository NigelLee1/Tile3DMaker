var cesium_1 = require("cesium");
var path = require('path');
var colorTypes_1 = require("../lib/colorTypes");
var calculateFilenameExt_1 = require("../lib/calculateFilenameExt");
var utils = require('../lib/utils');
var DataUriParser = require('datauri/parser');
var dataUriParser = new DataUriParser();
var Material_1 = require("../lib/Material");
var whiteOpaqueMaterial = new Material_1.Material([1.0, 1.0, 1.0, 1.0]);
var whiteTranslucentMaterial = new Material_1.Material([1.0, 1.0, 1.0, 0.5]);
var texturedMaterial = new Material_1.TexturedMaterial('data/wood_red.jpg');
var redMaterial = new Material_1.Material([1.0, 0.0, 0.0, 1.0]);
var scratchTranslation = new cesium_1.Cartesian3();
var scratchRotation = new cesium_1.Quaternion();
var scratchScale = new cesium_1.Cartesian3();
var scratchMatrix = new cesium_1.Matrix4();
var Mesh_1 = require("../lib/Mesh");
var gltfPipeline = require('gltf-pipeline');
var processGltf = gltfPipeline.processGltf;
var gltfToGlb = gltfPipeline.gltfToGlb;
var gltfConversionOptions = { resourceDirectory: path.join(__dirname, '../') };
var bluebird_1 = require("bluebird");
//const { Console } = require("console");
var fsExtra = require('fs-extra');

var sizeOfUint16 = 2;
var sizeOfFloat32 = 4;
var batchTableJsonAndBinary;
var constants_1 = {
  longitude: -1.31968,
  latitude: 0.698874,
  tileWidth: 200.0,
  smallHeight: 20.0
}
bluebird_1.Promise.all([createBatchedWithBatchTable()]).then(function () {
  console.log("success");
}, function (error) {
  console.error('failed');
  console.error(error);
});
function createBatchedWithBatchTable() {
  var tileOptions = {
    createBatchTable: true,
    createBatchTableExtra: true,
    transform: cesium_1.Matrix4.IDENTITY,
    relativeToCenter: true,
    rtcCenterPosition: [1.9, 0.2, 0.3]
  };
  constants_1.longitudeExtent = utils.metersToLongitude(constants_1.tileWidth, constants_1.latitude);
  constants_1.latitudeExtent = utils.metersToLatitude(constants_1.tileWidth);
  constants_1.west = constants_1.longitude - constants_1.longitudeExtent / 2.0;
  constants_1.south = constants_1.latitude - constants_1.latitudeExtent / 2.0;
  constants_1.east = constants_1.longitude + constants_1.longitudeExtent / 2.0;
  constants_1.north = constants_1.latitude + constants_1.latitudeExtent / 2.0;
  constants_1.buildingsTransform = utils.wgs84Transform(constants_1.longitude, constants_1.latitude, 0.0);
  constants_1.outputDirectory = 'output';
  constants_1.buildingTemplate = {
    numberOfBuildings: 10,
    tileWidth: constants_1.tileWidth,
    averageWidth: 8.0,
    averageHeight: 10.0,
    baseColorType: colorTypes_1.BaseColorType.White,
    translucencyType: colorTypes_1.TranslucencyType.Opaque,
    longitude: constants_1.longitude,
    latitude: constants_1.latitude
  };
  constants_1.smallGeometricError = 70.0; // Estimated
  constants_1.smallRegion = [constants_1.west, constants_1.south, constants_1.east, constants_1.north, 0.0,
    constants_1.smallHeight];
  var tilesetOptions = {
    region: [constants_1.west, constants_1.south, constants_1.east, constants_1.north, 0.0, constants_1.smallHeight],
    transform: constants_1.buildingsTransform
  };
  return saveBatchedTileset('BatchedWithBatchTable', tileOptions, tilesetOptions);
}

function saveBatchedTileset(tilesetName, tileOptions, tilesetOptions) {
  //var tilesetDirectory = path.join(constants_1.outputDirectory, 'Batched', tilesetName);
  var tilesetDirectory = 'D:\\Workplace\\HTML\\Batch3DTileViewer\\3dTile';
  if (fsExtra.pathExistsSync(tilesetDirectory)) {
    fsExtra.rmdirSync(tilesetDirectory, { recursive: true });
  }
  fsExtra.mkdirsSync(tilesetDirectory);
  tileOptions = cesium_1.defaultValue(tileOptions, {});
  tileOptions.buildingOptions = cesium_1.defaultValue(tileOptions.buildingOptions, constants_1.buildingTemplate);
  tileOptions.transform = cesium_1.defaultValue(tileOptions.transform, constants_1.buildingsTransform);
  tileOptions.relativeToCenter = cesium_1.defaultValue(tileOptions.relativeToCenter, true);
  tilesetOptions = cesium_1.defaultValue(tilesetOptions, {});
  var ext = calculateFilenameExt_1.calculateFilenameExt(false, false, '.b3dm');
  tileOptions.use3dTilesNext = false;
  tileOptions.useGlb = false;
  var contentUri = utils.toCamelCase(tilesetName) + ext;
  tilesetOptions.contentUri = contentUri;
  tilesetOptions.geometricError = constants_1.smallGeometricError;
  if (!cesium_1.defined(tilesetOptions.region) &&
    !cesium_1.defined(tilesetOptions.sphere) &&
    !cesium_1.defined(tilesetOptions.box)) {
    tilesetOptions.region = constants_1.smallRegion;
  }
  var tilePath = path.join(tilesetDirectory, contentUri);
  var tilesetPath = path.join(tilesetDirectory, 'tileset.json');
  return createBuildingsTile(tileOptions).then(function (result) {
    //console.log(result);
    //var batchTableJson = result.batchTableJson;
    //tilesetOptions.properties = utils.getProperties(batchTableJson);
    tilesetOptions.versionNumber = '1.0';
    // old .b3dm
    var b3dm = result.b3dm;
    if (tilesetOptions.contentDataUri) {
      var dataUri = dataUriParser.format('.b3dm', b3dm);
      tilesetOptions.contentUri = dataUri;
      return utils.saveJson(tilesetPath, createTilesetJsonSingle(tilesetOptions), constants_1.prettyJson, constants_1.gzip);
    }
    var tilesetJson = createTilesetJsonSingle(tilesetOptions);
    return bluebird_1.Promise.all([
      utils.saveJson(tilesetPath, tilesetJson, constants_1.prettyJson, constants_1.gzip),
      utils.saveBinary(tilePath, b3dm, constants_1.gzip)
    ]);
  });
}

function createRandomBuildings(options) {
  var seed = options.seed;
  var numberOfBuildings = options.numberOfBuildings;
  var tileWidth = options.tileWidth;
  var averageWidth = options.averageWidth;
  var averageHeight = options.averageHeight;
  var baseColorType = options.baseColorType;
  var translucencyType = options.translucencyType;
  var centerLongitude = options.longitude;
  var centerLatitude = options.latitude;
  // Set the random number seed before creating materials
  cesium_1.Math.setRandomNumberSeed(seed);
  var materials = new Array(numberOfBuildings);
  var i;
  for (i = 0; i < numberOfBuildings; ++i) {
    // For CesiumJS testing purposes make the first building red
    var useRedMaterial = (baseColorType === colorTypes_1.BaseColorType.Color) &&
      (translucencyType === colorTypes_1.TranslucencyType.Opaque) &&
      i === 0;
    var randomMaterial = getMaterial(baseColorType, translucencyType, i, numberOfBuildings);
    materials[i] = (useRedMaterial) ? redMaterial : randomMaterial;
  }
  // Set the random number seed before creating buildings so that the generated buildings are the same between runs
  cesium_1.Math.setRandomNumberSeed(seed);
  var buildings = new Array(numberOfBuildings);
  for (i = 0; i < numberOfBuildings; ++i) {
    // Create buildings with the z-axis as up
    var width = Math.max(averageWidth + (cesium_1.Math.nextRandomNumber() - 0.5) * 8.0, 1.0);
    var depth = Math.max(width + (cesium_1.Math.nextRandomNumber() - 0.5) * 4.0, 1.0);
    var height = Math.max(averageHeight + (cesium_1.Math.nextRandomNumber() - 0.5) * 8.0, 1.0);
    var minX = -tileWidth / 2.0 + width / 2.0;
    var maxX = tileWidth / 2.0 - width / 2.0;
    var minY = -tileWidth / 2.0 + depth / 2.0;
    var maxY = tileWidth / 2.0 - depth / 2.0;
    var rangeX = cesium_1.Math.nextRandomNumber() - 0.5;
    var rangeY = cesium_1.Math.nextRandomNumber() - 0.5;
    // For CesiumJS testing purposes, always place one building in the center of the tile and make it red
    if (i === 0) {
      rangeX = 0.0;
      rangeY = 0.0;
    }
    var x = rangeX * tileWidth;
    var y = rangeY * tileWidth;
    x = cesium_1.Math.clamp(x, minX, maxX);
    y = cesium_1.Math.clamp(y, minY, maxY);
    var z = height / 2.0;
    var translation = cesium_1.Cartesian3.fromElements(x, y, z, scratchTranslation);
    var rotation = cesium_1.Quaternion.clone(cesium_1.Quaternion.IDENTITY, scratchRotation);
    var scale = cesium_1.Cartesian3.fromElements(width, depth, height, scratchScale);
    var matrix = cesium_1.Matrix4.fromTranslationQuaternionRotationScale(translation, rotation, scale, new cesium_1.Matrix4());
    var longitudeExtent = utils.metersToLongitude(tileWidth, centerLatitude);
    var latitudeExtent = utils.metersToLatitude(tileWidth, centerLongitude);
    var longitude = centerLongitude + rangeX * longitudeExtent;
    var latitude = centerLatitude + rangeY * latitudeExtent;
    buildings[i] = new Building({
      matrix: matrix,
      material: materials[i],
      longitude: longitude,
      latitude: latitude,
      height: height
    });
  }
  return buildings;
}

function Building(options) {
  this.matrix = options.matrix;
  this.material = options.material;
  this.longitude = options.longitude;
  this.latitude = options.latitude;
  this.height = options.height;
}

function createUniformBuildings(options) {
  var numberOfBuildings = options.numberOfBuildings;
  var tileWidth = options.tileWidth;
  var centerLongitude = options.longitude;
  var centerLatitude = options.latitude;
  var buildingsPerAxis = Math.sqrt(numberOfBuildings);
  var buildingWidth = tileWidth / (buildingsPerAxis * 3);
  var buildings = [];
  for (var i = 0; i < buildingsPerAxis; ++i) {
    for (var j = 0; j < buildingsPerAxis; ++j) {
      var x = buildingWidth * 1.5 + i * buildingWidth * 3.0 - tileWidth / 2.0;
      var y = buildingWidth * 1.5 + j * buildingWidth * 3.0 - tileWidth / 2.0;
      var z = buildingWidth / 2.0;
      var rangeX = x / tileWidth - 0.5;
      var rangeY = y / tileWidth - 0.5;
      var translation = cesium_1.Cartesian3.fromElements(x, y, z, scratchTranslation);
      var rotation = cesium_1.Quaternion.clone(cesium_1.Quaternion.IDENTITY, scratchRotation);
      var scale = cesium_1.Cartesian3.fromElements(buildingWidth, buildingWidth, buildingWidth, scratchScale);
      var matrix = cesium_1.Matrix4.fromTranslationQuaternionRotationScale(translation, rotation, scale, new cesium_1.Matrix4());
      var longitudeExtent = utils.metersToLongitude(tileWidth, centerLatitude);
      var latitudeExtent = utils.metersToLatitude(tileWidth, centerLongitude);
      var longitude = centerLongitude + rangeX * longitudeExtent;
      var latitude = centerLatitude + rangeY * latitudeExtent;
      buildings.push(new Building({
        matrix: matrix,
        material: whiteOpaqueMaterial,
        longitude: longitude,
        latitude: latitude,
        height: buildingWidth
      }));
    }
  }
  return buildings;
}

function createBuildings(options) {
  options = cesium_1.defaultValue(options, {});
  options.seed = cesium_1.defaultValue(options.seed, 11);
  options.numberOfBuildings = cesium_1.defaultValue(options.numberOfBuildings, 10);
  options.tileWidth = cesium_1.defaultValue(options.tileWidth, 200.0);
  options.averageWidth = cesium_1.defaultValue(options.averageWidth, 4.0);
  options.averageHeight = cesium_1.defaultValue(options.averageHeight, 5.0);
  options.baseColorType = cesium_1.defaultValue(options.baseColorType, colorTypes_1.BaseColorType.White);
  options.translucencyType = cesium_1.defaultValue(options.translucencyType, colorTypes_1.TranslucencyType.Opaque);
  options.longitude = cesium_1.defaultValue(options.longitude, -1.31968);
  options.latitude = cesium_1.defaultValue(options.latitude, 0.698874);
  if (options.uniform) {
    return createUniformBuildings(options);
  }
  return createRandomBuildings(options);
}

function createBuildingsTile(options) {
  var buildings = createBuildings(options.buildingOptions);
  var useBatchIds = cesium_1.defaultValue(options.useBatchIds, true);
  var createBatchTable = cesium_1.defaultValue(options.createBatchTable, true) && useBatchIds;
  var createBatchTableExtra = cesium_1.defaultValue(options.createBatchTableExtra, false) && useBatchIds;
  var createBatchTableBinary = cesium_1.defaultValue(options.createBatchTableBinary, false) && useBatchIds;
  var tileTransform = cesium_1.defaultValue(options.transform, cesium_1.Matrix4.IDENTITY);
  var use3dTilesNext = cesium_1.defaultValue(options.use3dTilesNext, false);
  var useGlb = cesium_1.defaultValue(options.useGlb, false);
  var animated = cesium_1.defaultValue(options.animated, false);
  var relativeToCenter = options.relativeToCenter;
  var rtcCenterPosition = options.rtcCenterPosition;
  var useVertexColors = options.useVertexColors;
  var deprecated1 = options.deprecated1;
  var deprecated2 = options.deprecated2;
  var buildingsLength = buildings.length;
  var batchLength = useBatchIds ? buildingsLength : 0;
  var meshes = new Array(buildingsLength);
  for (var i = 0; i < buildingsLength; ++i) {
    var building = buildings[i];
    var transform = cesium_1.Matrix4.multiply(tileTransform, building.matrix, scratchMatrix);
    var mesh = Mesh_1.Mesh.createCube();
    mesh.transform(transform);
    mesh.material = building.material;
    if (useVertexColors) {
      mesh.transferMaterialToVertexColors();
    }
    meshes[i] = mesh;
  }
  var batchedMesh = Mesh_1.Mesh.batch(meshes);
  var batchTableJson;
  var batchTableBinary;
  if (createBatchTable) {
    batchTableJson = generateBuildingBatchTable(buildings);
    
    //console.log('batchTableJson:' + JSON.stringify(batchTableJson));
    if (createBatchTableExtra) {
      var batchTableExtra = generateBatchTableExtra(buildings);
      batchTableJson = cesium_1.combine(batchTableJson, batchTableExtra);
    }
    if (createBatchTableBinary) {
      batchTableJsonAndBinary = use3dTilesNext
        ? generateBatchTableBinary3dTilesNext(buildings)
        : generateBatchTableBinary(buildings);
      batchTableBinary = batchTableJsonAndBinary.binary;
      batchTableJson = cesium_1.combine(batchTableJson, batchTableJsonAndBinary.json);
    }
  }
  var featureTableJson = {
    BATCH_LENGTH: batchLength
  };
  if (cesium_1.defined(rtcCenterPosition)) {
    featureTableJson.RTC_CENTER = rtcCenterPosition;
  }
  else if (relativeToCenter) {
    featureTableJson.RTC_CENTER = Cartesian3.pack(batchedMesh.center, new Array(3));
  }
  var gltfOptions = {
    mesh: batchedMesh,
    useBatchIds: useBatchIds,
    relativeToCenter: relativeToCenter,
    deprecated: deprecated1 || deprecated2,
    use3dTilesNext: use3dTilesNext,
    featureTableJson: featureTableJson,
    animated: animated
  };
  console.log(gltfOptions);
  var gltf = createGltf(gltfOptions);
  var b3dmOptions = {
    featureTableJson: featureTableJson,
    batchTableJson: batchTableJson,
    batchTableBinary: batchTableBinary,
    batchTableJsonAndBinary: batchTableJsonAndBinary,
    deprecated1: deprecated1,
    deprecated2: deprecated2
  };
  console.log(featureTableJson);
  return gltfToGlb(gltf, gltfConversionOptions).then(function (results) {
    b3dmOptions.glb = results.glb;
    return {
      b3dm: createB3dm(b3dmOptions),
      batchTableJson: batchTableJson
    };
  });
}

function generateBuildingBatchTable(buildings) {
  var buildingsLength = buildings.length;
  var batchTable = {
    id: new Array(buildingsLength),
    Longitude: new Array(buildingsLength),
    Latitude: new Array(buildingsLength),
    Height: new Array(buildingsLength)
  };
  for (var i = 0; i < buildingsLength; ++i) {
    var building = buildings[i];
    batchTable.id[i] = i;
    batchTable.Longitude[i] = building.longitude;
    batchTable.Latitude[i] = building.latitude;
    batchTable.Height[i] = building.height;
  }
  return batchTable;
}

function generateBatchTableExtra(buildings) {
  var buildingsLength = buildings.length;
  var batchTable = {
    info: new Array(buildingsLength),
    rooms: new Array(buildingsLength)
  };
  for (var i = 0; i < buildingsLength; ++i) {
    batchTable.info[i] = {
      name: 'building' + i,
      year: i
    };
    batchTable.rooms[i] = [
      'room' + i + '_a',
      'room' + i + '_b',
      'room' + i + '_c'
    ];
  }
  return batchTable;
}

function getRandomColorMaterial(alpha) {
  var red = CesiumMath.nextRandomNumber();
  var green = CesiumMath.nextRandomNumber();
  var blue = CesiumMath.nextRandomNumber();
  return new Material_1.Material([red, green, blue, alpha]);
}
function getMaterial(baseColorType, translucencyType, buildingIndex, numberOfBuildings) {
  var firstHalf = (buildingIndex < numberOfBuildings / 2);
  if (baseColorType === colorTypes_1.BaseColorType.White) {
    if (translucencyType === colorTypes_1.TranslucencyType.Opaque) {
      return whiteOpaqueMaterial;
    }
    else if (translucencyType === colorTypes_1.TranslucencyType.Translucent) {
      return whiteTranslucentMaterial;
    }
    else if (translucencyType === colorTypes_1.TranslucencyType.Mix) {
      return firstHalf ? whiteOpaqueMaterial : whiteTranslucentMaterial;
    }
  }
  else if (baseColorType === colorTypes_1.BaseColorType.Color) {
    if (translucencyType === colorTypes_1.TranslucencyType.Opaque) {
      return getRandomColorMaterial(1.0);
    }
    else if (translucencyType === colorTypes_1.TranslucencyType.Translucent) {
      return getRandomColorMaterial(0.5);
    }
    else if (translucencyType === colorTypes_1.TranslucencyType.Mix) {
      var alpha = (firstHalf) ? 1.0 : 0.5;
      return getRandomColorMaterial(alpha);
    }
  }
  else if (baseColorType === colorTypes_1.BaseColorType.Texture) {
    return texturedMaterial;
  }
}

/**
 * Create a glTF from a Mesh.
 *
 * @param {Object} options An object with the following properties:
 * @param {Mesh} options.mesh The mesh.
 * @param {Boolean} [options.useBatchIds=true] Modify the glTF to include the batchId vertex attribute.
 * @param {Boolean} [options.relativeToCenter=false] Set mesh positions relative to center.
 * @param {Boolean} [options.deprecated=false] Save the glTF with the old BATCHID semantic.
 * @param {Boolean} [options.use3dTilesNext=false] Modify the GLTF to name batch ids with a numerical suffix
 * @param {Boolean} [options.animated=false] Whether to include glTF animations.
 * @todo options.use3dTilesNext will be deprecated soon, all 3dtilesnext logic
 *       will go into a dedicated class.
 *
 * @returns {Object} A glTF object
 */
function createGltf(options) {
  var use3dTilesNext = cesium_1.defaultValue(options.use3dTilesNext, false);
  var useBatchIds = cesium_1.defaultValue(options.useBatchIds, true);
  var relativeToCenter = cesium_1.defaultValue(options.relativeToCenter, false);
  console.log('relativeToCenter:' + relativeToCenter);
  var deprecated = cesium_1.defaultValue(options.deprecated, false);
  var animated = cesium_1.defaultValue(options.animated, false);
  var mesh = options.mesh;
  var positions = mesh.positions;
  var normals = mesh.normals;
  var uvs = mesh.uvs;
  var vertexColors = mesh.vertexColors;
  var batchIds = mesh.batchIds;
  var indices = mesh.indices;
  var views = mesh.views;
  // If all the vertex colors are 0 then the mesh does not have vertex colors
  var useVertexColors = !vertexColors.every(function (element) { return element === 0; });
  if (relativeToCenter) {
    mesh.setPositionsRelativeToCenter();
  }
  // Models are z-up, so add a z-up to y-up transform.
  // The glTF spec defines the y-axis as up, so this is the default behavior.
  // In CesiumJS a y-up to z-up transform is applied later so that the glTF and 3D Tiles coordinate systems are consistent
  var rootMatrix = [1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1];
  var i;
  var j;
  var view;
  var material;
  var viewsLength = views.length;
  var useUvs = false;
  for (i = 0; i < viewsLength; ++i) {
    view = views[i];
    material = view.material;
    if (typeof material.baseColor === 'string') {
      useUvs = true;
      break;
    }
  }
  var positionsMinMax = getMinMax(positions, 3);
  var positionsLength = positions.length;
  var positionsBuffer = Buffer.alloc(positionsLength * sizeOfFloat32);
  for (i = 0; i < positionsLength; ++i) {
    positionsBuffer.writeFloatLE(positions[i], i * sizeOfFloat32);
  }
  var normalsMinMax = getMinMax(normals, 3);
  var normalsLength = normals.length;
  var normalsBuffer = Buffer.alloc(normalsLength * sizeOfFloat32);
  for (i = 0; i < normalsLength; ++i) {
    normalsBuffer.writeFloatLE(normals[i], i * sizeOfFloat32);
  }
  var uvsMinMax;
  var uvsBuffer = Buffer.alloc(0);
  if (useUvs) {
    uvsMinMax = getMinMax(uvs, 2);
    var uvsLength = uvs.length;
    uvsBuffer = Buffer.alloc(uvsLength * sizeOfFloat32);
    for (i = 0; i < uvsLength; ++i) {
      uvsBuffer.writeFloatLE(uvs[i], i * sizeOfFloat32);
    }
  }
  var vertexColorsMinMax;
  var vertexColorsBuffer = Buffer.alloc(0);
  if (useVertexColors) {
    vertexColorsMinMax = getMinMax(vertexColors, 4);
    var vertexColorsLength = vertexColors.length;
    vertexColorsBuffer = Buffer.alloc(vertexColorsLength, sizeOfUint8);
    for (i = 0; i < vertexColorsLength; ++i) {
      vertexColorsBuffer.writeUInt8(vertexColors[i], i);
    }
  }
  var batchIdsMinMax;
  var batchIdsBuffer = Buffer.alloc(0);
  var batchIdSemantic;
  batchIdSemantic = deprecated ? 'BATCHID' : '_BATCHID';
  batchIdSemantic = use3dTilesNext ? '_FEATURE_ID_0' : batchIdSemantic;
  var batchIdsLength;
  if (useBatchIds) {
    batchIdsMinMax = getMinMax(batchIds, 1);
    batchIdsLength = batchIds.length;
    batchIdsBuffer = Buffer.alloc(batchIdsLength * sizeOfFloat32);
    for (i = 0; i < batchIdsLength; ++i) {
      batchIdsBuffer.writeFloatLE(batchIds[i], i * sizeOfFloat32);
    }
  }
  var indicesLength = indices.length;
  var indexBuffer = Buffer.alloc(indicesLength * sizeOfUint16);
  for (i = 0; i < indicesLength; ++i) {
    indexBuffer.writeUInt16LE(indices[i], i * sizeOfUint16);
  }
  indexBuffer = utils.getBufferPadded(indexBuffer);
  var translations = [
    [0.0, 0.0, 0.0],
    [1.0, 0.0, 0.0],
    [0.0, 0.0, 0.0]
  ];
  var times = [0.0, 0.5, 1.0];
  var keyframesLength = translations.length;
  var animationBuffer = Buffer.alloc(0);
  var translationsBuffer = Buffer.alloc(0);
  var timesBuffer = Buffer.alloc(0);
  if (animated) {
    translationsBuffer = Buffer.alloc(keyframesLength * 3 * sizeOfFloat32);
    timesBuffer = Buffer.alloc(keyframesLength * sizeOfFloat32);
    for (i = 0; i < keyframesLength; ++i) {
      for (j = 0; j < 3; ++j) {
        var index = i * keyframesLength + j;
        translationsBuffer.writeFloatLE(translations[i][j], index * sizeOfFloat32);
      }
    }
    for (i = 0; i < keyframesLength; ++i) {
      timesBuffer.writeFloatLE(times[i], i * sizeOfFloat32);
    }
    animationBuffer = utils.getBufferPadded(Buffer.concat([translationsBuffer, timesBuffer]));
  }
  var vertexCount = mesh.vertexCount;
  var vertexBuffer = utils.getBufferPadded(Buffer.concat([positionsBuffer, normalsBuffer, uvsBuffer, vertexColorsBuffer, batchIdsBuffer]));
  var buffer = utils.getBufferPadded(Buffer.concat([vertexBuffer, indexBuffer, animationBuffer]));
  var bufferUri = 'data:application/octet-stream;base64,' + buffer.toString('base64');
  var byteLength = buffer.byteLength;
  var indexAccessors = [];
  var materials = [];
  var primitives = [];
  var images;
  var samplers;
  var textures;
  var bufferViewIndex = 0;
  var positionsBufferViewIndex = bufferViewIndex++;
  var normalsBufferViewIndex = bufferViewIndex++;
  var uvsBufferViewIndex = (useUvs) ? bufferViewIndex++ : 0;
  var vertexColorsBufferViewIndex = (useVertexColors) ? bufferViewIndex++ : 0;
  var batchIdsBufferViewIndex = (useBatchIds) ? bufferViewIndex++ : 0;
  var indexBufferViewIndex = bufferViewIndex++;
  var translationsBufferViewIndex = (animated) ? bufferViewIndex++ : 0;
  var timesBufferViewIndex = (animated) ? bufferViewIndex++ : 0;
  var byteOffset = 0;
  var positionsBufferByteOffset = byteOffset;
  byteOffset += positionsBuffer.length;
  var normalsBufferByteOffset = byteOffset;
  byteOffset += normalsBuffer.length;
  var uvsBufferByteOffset = byteOffset;
  byteOffset += (useUvs) ? uvsBuffer.length : 0;
  var vertexColorsBufferByteOffset = byteOffset;
  byteOffset += (useVertexColors) ? vertexColorsBuffer.length : 0;
  var batchIdsBufferByteOffset = byteOffset;
  byteOffset += (useBatchIds) ? batchIdsBuffer.length : 0;
  // Start index buffer at the padded byte offset
  byteOffset = vertexBuffer.length;
  var indexBufferByteOffset = byteOffset;
  byteOffset += indexBuffer.length;
  // Start animation buffer at the padded byte offset
  var translationsByteOffset = vertexBuffer.length + indexBuffer.length;
  byteOffset += translationsBuffer.length;
  var timesByteOffset = byteOffset;
  byteOffset += timesByteOffset;
  for (i = 0; i < viewsLength; ++i) {
    view = views[i];
    material = view.material;
    var indicesMinMax = getMinMax(indices, 1, view.indexOffset, view.indexCount);
    indexAccessors.push({
      bufferView: indexBufferViewIndex,
      byteOffset: sizeOfUint16 * view.indexOffset,
      componentType: 5123,
      count: view.indexCount,
      type: 'SCALAR',
      min: indicesMinMax.min,
      max: indicesMinMax.max
    });
    var baseColor = material.baseColor;
    var baseColorFactor = baseColor;
    var baseColorTexture;
    var transparent = false;
    if (typeof baseColor === 'string') {
      if (!cesium_1.defined(images)) {
        images = [];
        textures = [];
        samplers = [{
          magFilter: 9729,
          minFilter: 9729,
          wrapS: 10497,
          wrapT: 10497 // REPEAT
        }];
      }
      baseColorFactor = [1.0, 1.0, 1.0, 1.0];
      baseColorTexture = baseColor;
      images.push({
        uri: baseColor
      });
      textures.push({
        sampler: 0,
        source: images.length - 1
      });
    }
    else {
      transparent = baseColor[3] < 1.0;
    }
    var doubleSided = transparent;
    var alphaMode = (transparent) ? 'BLEND' : 'OPAQUE';
    material = {
      pbrMetallicRoughness: {
        baseColorFactor: baseColorFactor,
        roughnessFactor: 1.0,
        metallicFactor: 0.0
      },
      alphaMode: alphaMode,
      doubleSided: doubleSided
    };
    if (cesium_1.defined(baseColorTexture)) {
      material.pbrMetallicRoughness.baseColorTexture = {
        index: 0
      };
    }
    materials.push(material);
    var attributes = {
      POSITION: positionsBufferViewIndex,
      NORMAL: normalsBufferViewIndex
    };
    if (useUvs) {
      attributes.TEXCOORD_0 = uvsBufferViewIndex;
    }
    if (useVertexColors) {
      attributes.COLOR_0 = vertexColorsBufferViewIndex;
    }
    if (useBatchIds) {
      attributes[batchIdSemantic] = batchIdsBufferViewIndex;
    }
    primitives.push({
      attributes: attributes,
      indices: indexBufferViewIndex + i,
      material: i,
      mode: 4 // TRIANGLES
    });
  }
  var vertexAccessors = [
    {
      bufferView: positionsBufferViewIndex,
      byteOffset: 0,
      componentType: 5126,
      count: vertexCount,
      type: 'VEC3',
      min: positionsMinMax.min,
      max: positionsMinMax.max
    },
    {
      bufferView: normalsBufferViewIndex,
      byteOffset: 0,
      componentType: 5126,
      count: vertexCount,
      type: 'VEC3',
      min: normalsMinMax.min,
      max: normalsMinMax.max
    }
  ];
  if (useUvs) {
    vertexAccessors.push({
      bufferView: uvsBufferViewIndex,
      byteOffset: 0,
      componentType: 5126,
      count: vertexCount,
      type: 'VEC2',
      min: uvsMinMax.min,
      max: uvsMinMax.max
    });
  }
  if (useVertexColors) {
    vertexAccessors.push({
      bufferView: vertexColorsBufferViewIndex,
      byteOffset: 0,
      componentType: 5121,
      count: vertexCount,
      type: 'VEC4',
      min: vertexColorsMinMax.min,
      max: vertexColorsMinMax.max,
      normalized: true
    });
  }
  if (useBatchIds) {
    vertexAccessors.push({
      bufferView: batchIdsBufferViewIndex,
      byteOffset: 0,
      componentType: 5126,
      count: batchIdsLength,
      type: 'SCALAR',
      min: batchIdsMinMax.min,
      max: batchIdsMinMax.max
    });
  }
  var animationAccessors = [];
  if (animated) {
    animationAccessors.push({
      bufferView: translationsBufferViewIndex,
      byteOffset: 0,
      componentType: 5126,
      count: keyframesLength,
      type: 'VEC3',
    });
    animationAccessors.push({
      bufferView: timesBufferViewIndex,
      byteOffset: 0,
      componentType: 5126,
      count: keyframesLength,
      type: 'SCALAR',
      min: [times[0]],
      max: [times[keyframesLength - 1]]
    });
  }
  var accessors = vertexAccessors.concat(indexAccessors, animationAccessors);
  var bufferViews = [
    {
      buffer: 0,
      byteLength: positionsBuffer.length,
      byteOffset: positionsBufferByteOffset,
      target: 34962 // ARRAY_BUFFER
    },
    {
      buffer: 0,
      byteLength: normalsBuffer.length,
      byteOffset: normalsBufferByteOffset,
      target: 34962 // ARRAY_BUFFER
    }
  ];
  if (useUvs) {
    bufferViews.push({
      buffer: 0,
      byteLength: uvsBuffer.length,
      byteOffset: uvsBufferByteOffset,
      target: 34962 // ARRAY_BUFFER
    });
  }
  if (useVertexColors) {
    bufferViews.push({
      buffer: 0,
      byteLength: vertexColorsBuffer.length,
      byteOffset: vertexColorsBufferByteOffset,
      target: 34962 // ARRAY_BUFFER
    });
  }
  if (useBatchIds) {
    bufferViews.push({
      buffer: 0,
      byteLength: batchIdsBuffer.length,
      byteOffset: batchIdsBufferByteOffset,
      target: 34962 // ARRAY_BUFFER
    });
  }
  bufferViews.push({
    buffer: 0,
    byteLength: indexBuffer.length,
    byteOffset: indexBufferByteOffset,
    target: 34963 // ELEMENT_ARRAY_BUFFER
  });
  if (animated) {
    bufferViews.push({
      buffer: 0,
      byteLength: translationsBuffer.length,
      byteOffset: translationsByteOffset
    });
    bufferViews.push({
      buffer: 0,
      byteLength: timesBuffer.length,
      byteOffset: timesByteOffset
    });
  }
  var hasRTC = use3dTilesNext && cesium_1.defined(options.featureTableJson) && cesium_1.defined(options.featureTableJson.RTC_CENTER);
  console.log('hasRTC:' + hasRTC + ",animated:" + animated);
  var nodes;
  var animationNode;
  if (animated && hasRTC) {
    nodes = [
      {
        matrix: rootMatrix,
        children: [1]
      },
      {
        name: 'RTC_CENTER',
        translation: options.featureTableJson.RTC_CENTER,
        children: [2]
      },
      {
        mesh: 0
      }
    ];
    animationNode = 2;
  }
  else if (animated) {
    nodes = [
      {
        matrix: rootMatrix,
        children: [1]
      },
      {
        mesh: 0
      }
    ];
    animationNode = 1;
  }
  else if (hasRTC) {
    nodes = [
      {
        matrix: rootMatrix,
        children: [1]
      },
      {
        name: 'RTC_CENTER',
        translation: options.featureTableJson.RTC_CENTER,
        mesh: 0
      }
    ];
  }
  else {
    nodes = [
      {
        matrix: rootMatrix,
        mesh: 0
      }
    ];
  }
  var animations;
  if (animated) {
    animations = [
      {
        channels: [
          {
            sampler: 0,
            target: {
              node: animationNode,
              path: 'translation'
            }
          }
        ],
        samplers: [
          {
            input: timesBufferViewIndex,
            interpolation: 'LINEAR',
            output: translationsBufferViewIndex
          }
        ]
      }
    ];
  }
  var gltf = {
    accessors: accessors,
    animations: animations,
    asset: {
      generator: '3d-tiles-samples-generator',
      version: '2.0'
    },
    buffers: [{
      byteLength: byteLength,
      uri: bufferUri
    }],
    bufferViews: bufferViews,
    images: images,
    materials: materials,
    meshes: [
      {
        primitives: primitives
      }
    ],
    nodes: nodes,
    samplers: samplers,
    scene: 0,
    scenes: [{
      nodes: [0]
    }],
    textures: textures
  };
  return gltf;
}

function getMinMax(array, components, start, length) {
  start = cesium_1.defaultValue(start, 0);
  length = cesium_1.defaultValue(length, array.length);
  var min = new Array(components).fill(Number.POSITIVE_INFINITY);
  var max = new Array(components).fill(Number.NEGATIVE_INFINITY);
  var count = length / components;
  for (var i = 0; i < count; ++i) {
    for (var j = 0; j < components; ++j) {
      var index = start + i * components + j;
      var value = array[index];
      min[j] = Math.min(min[j], value);
      max[j] = Math.max(max[j], value);
    }
  }
  return {
    min: min,
    max: max
  };
}

function createB3dm(options) {
  var glb = options.glb;
  var defaultFeatureTable = {
    BATCH_LENGTH: 0
  };
  var featureTableJson = cesium_1.defaultValue(options.featureTableJson, defaultFeatureTable);
  var headerByteLength = 28;
  var featureTableJsonBuffer = utils.getJsonBufferPadded(featureTableJson, headerByteLength);
  var featureTableBinary = utils.getBufferPadded(options.featureTableBinary);
  var batchTableJsonBuffer = utils.getJsonBufferPadded(options.batchTableJson);
  var batchTableBinary = utils.getBufferPadded(options.batchTableBinary);
  return createB3dmCurrent(glb, featureTableJsonBuffer, featureTableBinary, batchTableJsonBuffer, batchTableBinary);
}
function createB3dmCurrent(glb, featureTableJson, featureTableBinary, batchTableJson, batchTableBinary) {
  var version = 1;
  var headerByteLength = 28;
  var featureTableJsonByteLength = featureTableJson.length;
  var featureTableBinaryByteLength = featureTableBinary.length;
  var batchTableJsonByteLength = batchTableJson.length;
  var batchTableBinaryByteLength = batchTableBinary.length;
  var gltfByteLength = glb.length;
  var byteLength = headerByteLength + featureTableJsonByteLength + featureTableBinaryByteLength + batchTableJsonByteLength + batchTableBinaryByteLength + gltfByteLength;
  var header = Buffer.alloc(headerByteLength);
  header.write('b3dm', 0);
  header.writeUInt32LE(version, 4);
  header.writeUInt32LE(byteLength, 8);
  header.writeUInt32LE(featureTableJsonByteLength, 12);
  header.writeUInt32LE(featureTableBinaryByteLength, 16);
  header.writeUInt32LE(batchTableJsonByteLength, 20);
  header.writeUInt32LE(batchTableBinaryByteLength, 24);
  return Buffer.concat([header, featureTableJson, featureTableBinary, batchTableJson, batchTableBinary, glb]);
}

function createTilesetJsonSingle(options) {
  var transform = options.transform != null ? options.transform : cesium_1.Matrix4.IDENTITY;
  var transformArray = !cesium_1.Matrix4.equals(transform, cesium_1.Matrix4.IDENTITY)
    ? cesium_1.Matrix4.pack(transform, new Array(16))
    : undefined;
  var boundingVolume = utils.getBoundingVolume(options.region, options.box, options.sphere);
  /*var _a;
  var extensions = options.extensions != null ? options.extensions : null;
  var extensionsRequired = (_a = options === null || options === void 0 ? void 0 : options.extensions) === null || _a === void 0 ? void 0 : _a.extensionsRequired;
  var version = options.versionNumber != null
    ? options.versionNumber
    : defaultTilesetVersion;
  return __assign(__assign(__assign({
    asset: {
      version: version
    }, properties: options.properties
  }, (extensions != null ? { extensions: extensions } : {})), (extensionsRequired != null
    ? { extensionsRequired: extensionsRequired }
    : {})), {
      geometricError: options.geometricError, root: {
        transform: transformArray,
        expire: options.expire,
        refine: 'ADD',
        boundingVolume: boundingVolume,
        geometricError: 0.0,
        content: {
          uri: options.contentUri
        }
      }
  });*/
  return {
    asset: {
      version: "1.0"
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