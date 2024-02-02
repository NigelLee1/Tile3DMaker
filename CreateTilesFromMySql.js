var mysql = require('mysql');
var pipes = undefined;
var canals = undefined;
var combs = undefined;
var roundManholes = undefined;
var rectManholes = undefined;
var connection = mysql.createConnection({
  host: '39.108.225.210',
  user: 'root',
  password: 'ak2016',
  database: 'su_qian_dev'
});

connection.connect(); // 连接数据库

connection.query('select OGR_FID, id, st_x(st_startPoint(shape)) as usX, st_y(st_startPoint(shape)) as usY,' +
  'st_x(st_endPoint(shape)) as dsX, st_y(st_endPoint(shape)) as dsY, system_type,' +
  'us_invert_level, ds_invert_level, us_object_id, ds_object_id, us_bury_depth, ds_bury_depth, us_point_invert_level,' +
  'us_invert_level, ds_point_invert_level, ds_invert_level, width, flow_direction, material, bury_method, state,' +
  'road_name, pipe_length from PS_PIPE',
  function (error, results, fields) {
    if (error) throw error;
    //console.log(results);
    let tmpPipes = [];
    for (let i = 0; i < results.length; i++) {
      const item = results[i];
      let systemType = item.system_type;
      let systemTypeCode;
      if (systemType === "雨水")
        systemTypeCode = "YS";
      else if (systemType === "污水")
        systemTypeCode = "WS";
      else if (systemType === "合流")
        systemTypeCode = "HS";
      else
        systemTypeCode = "HS";
      tmpPipes.push({
        a: { x: item.usX, y: item.usY, h: item.us_invert_level},
        b: { x: item.dsX, y: item.dsY, h: item.ds_invert_level},
        id: item.id,
        w: item.width,
        t: systemTypeCode,
        tableName: 'PS_PIPE',
        feature: {
          "type": "Feature", "id": "PS_PIPE." + item.OGR_FID,
          "geometry": { "type": "LineString", "coordinates": [[item.usX, item.usY], [item.dsX, item.dsY]] },
          "geometry_name": "SHAPE",
          "properties": {
            "id": item.id, "system_type": item.system_type, "us_object_id": item.us_object_id,
            "ds_object_id": item.ds_object_id, "us_bury_depth": item.us_bury_depth, "ds_bury_depth": item.ds_bury_depth,
            "us_point_invert_level": item.us_point_invert_level, "us_invert_level": item.us_invert_level,
            "ds_point_invert_level": item.ds_point_invert_level, "ds_invert_level": item.ds_invert_level, "width": item.width,
            "flow_direction": item.flow_direction, "material": item.material, "bury_method": item.bury_method,
            "state": item.state, "road_name": item.road_name,
            "pipe_length": item.pipe_length
          }, "bbox": [Math.min(item.usX, item.dsX), Math.min(item.usY, item.dsY),
            Math.max(item.usX, item.dsX), Math.max(item.usY, item.dsY)]
        }
      });
      //console.log('id:' + results[i].id);
    }
    pipes = tmpPipes;
    createInstancedWithAllTile();
  //console.log('The results is: ', results);
  //console.log(fields);
  });
connection.query('select OGR_FID, id, st_x(st_startPoint(shape)) as usX, st_y(st_startPoint(shape)) as usY,' +
  'st_x(st_endPoint(shape)) as dsX, st_y(st_endPoint(shape)) as dsY, system_type,' +
  'us_invert_level, ds_invert_level, us_object_id, ds_object_id, us_bury_depth, ds_bury_depth, us_point_invert_level,' +
  'us_invert_level, ds_point_invert_level, ds_invert_level, width, height, flow_direction, material, bury_method, state,' +
  'road_name, canal_length from PS_CANAL',
  function (error, results, fields) {
    if (error) throw error;
    //console.log(results);
    let tmpCanals = [];
    for (let i = 0; i < results.length; i++) {
      const item = results[i];
      let systemType = item.system_type;
      let systemTypeCode;
      if (systemType === "雨水")
        systemTypeCode = "YS";
      else if (systemType === "污水")
        systemTypeCode = "WS";
      else if (systemType === "合流")
        systemTypeCode = "HS";
      else
        systemTypeCode = "HS";
      tmpCanals.push({
        a: { x: item.usX, y: item.usY, h: item.us_invert_level },
        b: { x: item.dsX, y: item.dsY, h: item.ds_invert_level },
        id: item.id,
        w: item.width,
        h: item.height,
        t: systemTypeCode,
        tableName: 'PS_CANAL',
        feature: {
          "type": "Feature", "id": "PS_PIPE." + item.OGR_FID,
          "geometry": { "type": "LineString", "coordinates": [[item.usX, item.usY], [item.dsX, item.dsY]] },
          "geometry_name": "SHAPE",
          "properties": {
            "id": item.id, "system_type": item.system_type, "us_object_id": item.us_object_id,
            "ds_object_id": item.ds_object_id, "us_bury_depth": item.us_bury_depth, "ds_bury_depth": item.ds_bury_depth,
            "us_point_invert_level": item.us_point_invert_level, "us_invert_level": item.us_invert_level,
            "ds_point_invert_level": item.ds_point_invert_level, "ds_invert_level": item.ds_invert_level, "width": item.width,
            "flow_direction": item.flow_direction, "material": item.material, "bury_method": item.bury_method,
            "state": item.state, "road_name": item.road_name,
            "canal_length": item.canal_length
          }, "bbox": [Math.min(item.usX, item.dsX), Math.min(item.usY, item.dsY),
          Math.max(item.usX, item.dsX), Math.max(item.usY, item.dsY)]
        }
      });
      //console.log('id:' + results[i].id);
    }
    canals = tmpCanals;
    createInstancedWithAllTile();
    //console.log('The results is: ', results);
    //console.log(fields);
  });
connection.query('select id, st_x(shape) as x, st_y(shape) as y,' +
  'ground_level, invert_level, chamber_size, OGR_FID, system_type, feature, co_x, co_y, ground_level,' +
  'invert_level, cover_material, chamber_shape, well_depth, water_depth, mud_depth, bottom_type, cover_damage,' +
  'cover_idf_correct, chamber_size, road_name, gully_number, mix_connection, mxcn_sop_name, remark from PS_COMB',
  function (error, results, fields) {
    if (error) throw error;
    let tmpCombs = [];
    for (let i = 0; i < results.length; i++) {
      const item = results[i];
      let comb_size = item.chamber_size; // comb_size
      //if (comb_size.Length === 0)
        //comb_size = "750X450";
      let sizes = comb_size.split('X');
      let xl = parseFloat(sizes[0]);
      let yl;
      if (sizes.Length > 1)
        yl = parseFloat(sizes[1]);
      else
        yl = xl;
      if (xl <= 0 || yl <= 0)
        throw new Exception("error");
      tmpCombs.push({
        x: item.x,
        y: item.y,
        id: item.id,
        gl: item.ground_level,
        il: parseFloat(item.invert_level),
        xl: xl,
        yl: yl,
        tableName: 'PS_COMB',
        feature: {
          "type": "Feature", "id": "PS_COMB." + item.OGR_FID,
          "geometry": { "type": "Point", "coordinates": [item.x, item.y] }, "geometry_name": "SHAPE",
          "properties": {
            "id": item.id, "system_type": item.system_type, "feature": item.feature,
            "co_x": item.co_x, "co_y": item.co_y, "ground_level": item.ground_level, "invert_level": item.invert_level,
            "cover_material": item.cover_material, "chamber_shape": item.chamber_shape, "well_depth": item.well_depth,
            "water_depth": item.water_depth, "mud_depth": item.mud_depth, "bottom_type": item.bottom_type,
            "cover_damage": item.cover_damage, "cover_idf_correct": item.cover_idf_correct,
            "chamber_size": item.chamber_size, "road_name": item.road_name, "gully_number": item.gully_number,
            "mix_connection": item.mix_connection, "mxcn_sop_name": item.mxcn_sop_name, "remark": item.remark
          }, "bbox": [item.x, item.y, item.x, item.y]
        }
      });
    }
    combs = tmpCombs;
    createInstancedWithAllTile();
    //console.log('The results is: ', results);
    //console.log(fields);
  });
connection.query('select id, st_x(shape) as x, st_y(shape) as y, system_type, ' +
  'ground_level, invert_level, chamber_size, \'PS_MANHOLE\' as tableName, OGR_FID, feature, co_x, co_y, ground_level,' +
  'invert_level, cover_material, chamber_shape, well_depth, water_depth, mud_depth, bottom_type, cover_damage, ' +
  'cover_idf_correct, chamber_size, road_name, mix_connection, mxcn_sop_name, remark' +
  ' from PS_MANHOLE where instr(chamber_size, \'X\') = 0 ' +
  'union all select id, st_x(shape) as x, st_y(shape) as y, system_type, ' +
  'ground_level, invert_level, chamber_size, \'PS_SEPTIC_TANK\' as tableName, OGR_FID, feature, co_x, co_y, ground_level, ' +
  'invert_level, cover_material, chamber_shape, well_depth, water_depth, mud_depth, bottom_type, cover_damage,' +
  'cover_idf_correct, chamber_size, road_name, mix_connection, mxcn_sop_name, remark' +
  ' from PS_SEPTIC_TANK where instr(chamber_size, \'X\') = 0',
  function (error, results, fields) {
    if (error) throw error;
    let tmpRoundManholes = [];
    for (let i = 0; i < results.length; i++) {
      const item = results[i];
      let systemType = item.system_type;
      let systemTypeCode;
      if (systemType === "雨水")
        systemTypeCode = "YS";
      else if (systemType === "污水")
        systemTypeCode = "WS";
      else if (systemType === "合流")
        systemTypeCode = "HS";
      else
        systemTypeCode = "HS";
      let chamber_size = item.chamber_size; // comb_size
      //if (comb_size.Length === 0)
        //comb_size = "750X450";
      //let sizes = comb_size.split('X');
      let d = parseFloat(chamber_size);
      if (d <= 0)
        throw new Exception("error");
      let invert_level = parseFloat(item.invert_level);
      if (!isNaN(invert_level))
        tmpRoundManholes.push({
          x: item.x,
          y: item.y,
          id: item.id,
          gl: item.ground_level,
          il: invert_level,
          d: d,
          t: systemTypeCode,
          tableName: item.tableName,
          feature: {
            "type": "Feature", "id": item.tableName + "." + item.OGR_FID,
            "geometry": { "type": "Point", "coordinates": [item.x, item.y] }, "geometry_name": "SHAPE",
            "properties": {
              "id": item.id, "system_type": item.system_type, "feature": item.feature,
              "co_x": item.co_x, "co_y": item.co_y, "ground_level": item.ground_level, "invert_level": item.invert_level,
              "cover_material": item.cover_material, "chamber_shape": item.chamber_shape, "well_depth": item.well_depth,
              "water_depth": item.water_depth, "mud_depth": item.mud_depth, "bottom_type": item.bottom_type,
              "cover_damage": item.cover_damage, "cover_idf_correct": item.cover_idf_correct,
              "chamber_size": item.chamber_size, "road_name": item.road_name, "mix_connection": item.mix_connection,
              "mxcn_sop_name": item.mxcn_sop_name, "remark": item.remark
            }, "bbox": [item.x, item.y, item.x, item.y]
          }
        });
    }
    roundManholes = tmpRoundManholes;
    createInstancedWithAllTile();
    //console.log('The results is: ', results);
    //console.log(fields);
  });
connection.query('select id, st_x(shape) as x, st_y(shape) as y, system_type, ' +
  'ground_level, invert_level, chamber_size, \'PS_MANHOLE\' as tableName, OGR_FID, feature, co_x, co_y, ground_level,' +
  'invert_level, cover_material, chamber_shape, well_depth, water_depth, mud_depth, bottom_type, cover_damage, ' +
  'cover_idf_correct, chamber_size, road_name, mix_connection, mxcn_sop_name, remark' +
  ' from PS_MANHOLE where instr(chamber_size, \'X\') > 0 ' +
  'union all select id, st_x(shape) as x, st_y(shape) as y, system_type, ' +
  'ground_level, invert_level, chamber_size, \'PS_SEPTIC_TANK\' as tableName, OGR_FID, feature, co_x, co_y, ground_level, ' +
  'invert_level, cover_material, chamber_shape, well_depth, water_depth, mud_depth, bottom_type, cover_damage,' +
  'cover_idf_correct, chamber_size, road_name, mix_connection, mxcn_sop_name, remark' +
  ' from PS_SEPTIC_TANK where instr(chamber_size, \'X\') > 0',
  function (error, results, fields) {
    if (error) throw error;
    let tmpRectManholes = [];
    for (let i = 0; i < results.length; i++) {
      const item = results[i];
      let systemType = item.system_type;
      let systemTypeCode;
      if (systemType === "雨水")
        systemTypeCode = "YS";
      else if (systemType === "污水")
        systemTypeCode = "WS";
      else if (systemType === "合流")
        systemTypeCode = "HS";
      else
        systemTypeCode = "HS";
      let comb_size = item.chamber_size; // comb_size
      //if (comb_size.Length === 0)
      //comb_size = "750X450";
      let sizes = comb_size.split('X');
      let xl = parseFloat(sizes[0]);
      let yl;
      if (sizes.Length > 1)
        yl = parseFloat(sizes[1]);
      else
        yl = xl;
      if (xl <= 0 || yl <= 0)
        throw new Exception("error");
      let invert_level = parseFloat(item.invert_level);
      if (!isNaN(invert_level))
        tmpRectManholes.push({
          x: item.x,
          y: item.y,
          id: item.id,
          gl: item.ground_level,
          il: invert_level,
          xl: xl,
          yl: yl,
          t: systemTypeCode,
          tableName: item.tableName,
          feature: {
            "type": "Feature", "id": item.tableName + "." + item.OGR_FID,
            "geometry": { "type": "Point", "coordinates": [item.x, item.y] }, "geometry_name": "SHAPE",
            "properties": {
              "id": item.id, "system_type": item.system_type, "feature": item.feature,
              "co_x": item.co_x, "co_y": item.co_y, "ground_level": item.ground_level, "invert_level": item.invert_level,
              "cover_material": item.cover_material, "chamber_shape": item.chamber_shape, "well_depth": item.well_depth,
              "water_depth": item.water_depth, "mud_depth": item.mud_depth, "bottom_type": item.bottom_type,
              "cover_damage": item.cover_damage, "cover_idf_correct": item.cover_idf_correct,
              "chamber_size": item.chamber_size, "road_name": item.road_name, "mix_connection": item.mix_connection,
              "mxcn_sop_name": item.mxcn_sop_name, "remark": item.remark
            }, "bbox": [item.x, item.y, item.x, item.y]
          }
        });
    }
    rectManholes = tmpRectManholes;
    createInstancedWithAllTile();
    //console.log('The results is: ', results);
    //console.log(fields);
  });
connection.end(); // 关闭连接
// Cesium3DTileset.js 
// that._root = that.loadTileset(resource, tilesetJson); 939行
// 没有3D图可以调试一下那行
'use strict';
var path = require('path');
var cesium_1 = require("cesium");
var utils = require('./lib/utils');
var fsExtra = require('fs-extra');
var geometryErrorUtils = require('./GeometryErrorUtils');
//const { connect } = require('tls');

var exports = {
  tileWidth: 443,  // 1000, maxLen 最大的模型的大小
  instancesModelSize: 30, // 1000.0, // h
  maxLenK: 32.0, // 控制显示精细度，越大越精细，但也更卡
  //geometricErrorArr: [500, 58, 26, 22, 19, 10, 0],
  geometricErrorArr: [500, 80, 40, 28, 19, 12, 0],
  prettyJson: true,
  gzip: false//,
};
exports.longitude = 113.38078 * Math.PI / 180.0;
exports.latitude = 22.51365 * Math.PI / 180.0;
exports.instancesHeight = exports.instancesModelSize + 10.0;
exports.longitudeExtent = utils.metersToLongitude(exports.tileWidth, exports.latitude);
exports.latitudeExtent = utils.metersToLatitude(exports.tileWidth);
exports.west = exports.longitude - exports.longitudeExtent / 2.0;
exports.south = exports.latitude - exports.latitudeExtent / 2.0;
exports.east = exports.longitude + exports.longitudeExtent / 2.0;
exports.north = exports.latitude + exports.latitudeExtent / 2.0;
exports.gap = 0.00001 * Math.PI / 180.0;
exports.instancesRegion = [113.301237 * Math.PI / 180.0, 22.3784168 * Math.PI / 180.0, 113.501175 * Math.PI / 180.0, 22.588129 * Math.PI / 180.0, 0.0, 18];
var typeSize_1 = {
  FLOAT32_SIZE_BYTES: 4,
  UINT32_SIZE_BYTES: 4,
  UINT16_SIZE_BYTES: 2,
  UINT8_SIZE_BYTES: 1
};

function createInstancedWithAllTile() {
  if (pipes === undefined || canals === undefined || combs === undefined || roundManholes === undefined || rectManholes === undefined)
    return;

  processData(pipes, canals, combs, roundManholes, rectManholes);
  console.log(pipes.length + canals.length + combs.length + roundManholes.length + rectManholes.length);
  var tileOptions = {
    createBatchTable: true
  };
  saveInstancedTileset('InstancedWithAllTile', tileOptions, {}, pipes, canals, combs, roundManholes, rectManholes);
  console.log('success');
}

function processData(pipes, canals, combs, roundManholes, rectManholes) {
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
    pipe.a.c3 = cesium_1.Cartesian3.fromRadians(pa.longitude, pa.latitude, pipe.a.h);
    pipe.b.c3 = cesium_1.Cartesian3.fromRadians(pb.longitude, pb.latitude, pipe.b.h);
  }
  for (var i = canals.length - 1; i >= 0; --i) {
    var canal = canals[i];
    if (canal.w === 0 || canal.h === 0 || (canal.a.x === canal.b.x && canal.a.y === canal.b.y)) {
      canals.splice(i, 1);
      continue;
    }
    var projection = new cesium_1.WebMercatorProjection();
    var pa = projection.unproject(
      new cesium_1.Cartesian3(
        canal.a.x,
        canal.a.y,
        0
      )
    );
    canal.a.longitude = pa.longitude;
    canal.a.latitude = pa.latitude;
    var pb = projection.unproject(
      new cesium_1.Cartesian3(
        canal.b.x,
        canal.b.y,
        0
      )
    );
    canal.b.longitude = pb.longitude;
    canal.b.latitude = pb.latitude;
    canal.a.c3 = cesium_1.Cartesian3.fromRadians(pa.longitude, pa.latitude, canal.a.h);
    canal.b.c3 = cesium_1.Cartesian3.fromRadians(pb.longitude, pb.latitude, canal.b.h);
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
   // console.log(comb);
    comb.c3 = cesium_1.Cartesian3.fromRadians(comb.longitude, comb.latitude, comb.il);
  }
  for (let i = 0; i < roundManholes.length; i++) {
    let manhole = roundManholes[i];
    let projection = new cesium_1.WebMercatorProjection();
    let pa = projection.unproject(
      new cesium_1.Cartesian3(
        manhole.x,
        manhole.y,
        0
      )
    );
    manhole.longitude = pa.longitude;
    manhole.latitude = pa.latitude;
    // console.log(comb);
    manhole.c3 = cesium_1.Cartesian3.fromRadians(manhole.longitude, manhole.latitude, manhole.il);
  }
  for (let i = 0; i < rectManholes.length; i++) {
    let manhole = rectManholes[i];
    let projection = new cesium_1.WebMercatorProjection();
    let pa = projection.unproject(
      new cesium_1.Cartesian3(
        manhole.x,
        manhole.y,
        0
      )
    );
    manhole.longitude = pa.longitude;
    manhole.latitude = pa.latitude;
    // console.log(comb);
    manhole.c3 = cesium_1.Cartesian3.fromRadians(manhole.longitude, manhole.latitude, manhole.il);
  }
}

function saveInstancedTileset(tilesetName, tileOptions, tilesetOptions, pipes, canals, combs, roundManholes, rectManholes) {
  var tilesetDirectory, tilesetPath, use3dTilesNext, useGlb, ext, tilePath, result, tilesetJson, i3dm, batchTableJson, promises, copyPath;
  //var tileDir = 'InstancedWithAllTile3';
  var tileDir = 'test';
  tilesetDirectory = 'D:\\Workplace\\Projects\\suqian\\ng-suqian\\src\\assets\\3dTile\\Instanced\\' + tileDir;
  if (fsExtra.pathExistsSync(tilesetDirectory)) {
    fsExtra.rmdirSync(tilesetDirectory, { recursive: true });
    fsExtra.mkdirsSync(tilesetDirectory);
  }
  else
    fsExtra.mkdirsSync(tilesetDirectory);
  tilesetPath = path.join(tilesetDirectory, 'tileset.json');
  tileOptions = cesium_1.defaultValue(tileOptions, {});
  tileOptions.tileWidth = exports.tileWidth;
  var instancesTransform = utils.wgs84Transform(exports.longitude, exports.latitude, exports.instancesModelSize / 2.0);
  tileOptions.transform = cesium_1.defaultValue(tileOptions.transform, instancesTransform);
  tileOptions.eastNorthUp = cesium_1.defaultValue(tileOptions.eastNorthUp, true);
  tilesetOptions = cesium_1.defaultValue(tilesetOptions, {});
  ext = '.i3dm';
  tilesetOptions.contentUri = tilesetName + ext;
  tilesetOptions.region = exports.instancesRegion;
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
  let ysCanals = [], wsCanals = [], hsCanals = [];
  for (let i = 0; i < canals.length; i++) {
    let canal = canals[i];
    if (canal.t === 'YS')
      ysCanals.push(canal);
    else if (canal.t === 'WS')
      wsCanals.push(canal);
    else
      hsCanals.push(canal);
  }
  let ysRoundManholes = [], wsRoundManholes = [], hsRoundManholes = [];
  for (let i = 0; i < roundManholes.length; i++) {
    let manhole = roundManholes[i];
    if (manhole.t === 'YS')
      ysRoundManholes.push(manhole);
    else if (manhole.t === 'WS')
      wsRoundManholes.push(manhole);
    else
      hsRoundManholes.push(manhole);
  }

  let ysRectManholes = [], wsRectManholes = [], hsRectManholes = [];
  for (let i = 0; i < rectManholes.length; i++) {
    let manhole = rectManholes[i];
    if (manhole.t === 'YS')
      //ysRectManholes.push(manhole);
      ysCanals.push(manhole);
    else if (manhole.t === 'WS')
      //wsRectManholes.push(manhole);
      wsCanals.push(manhole);
    else
      //hsRectManholes.push(manhole);
      hsCanals.push(manhole);
  }

  /*let names = ['ysPipe', 'wsPipe', 'hsPipe', 'ysCanal', 'wsCanal', 'hsCanal', 'comb', 'ysRoundManhole', 'wsRoundManhole', 'hsRoundManhole'
    , 'ysRectManhole', 'wsRectManhole', 'hsRectManhole'];
  let tPipes = [ysPipes, wsPipes, hsPipes, ysCanals, wsCanals, hsCanals, combs, ysRoundManholes, wsRoundManholes, hsRoundManholes
    , ysRectManholes, wsRectManholes, hsRectManholes];
  let gltfUris = ['IdentityPipeWithYSArrow.gltf', 'IdentityPipeWithWSArrow.gltf', 'IdentityPipeWithHSArrow.gltf',
    'YSCuboid.gltf', 'WSCuboid.gltf', 'HSCuboid.gltf',
    'Comb.gltf', 'YSRoundManhole.gltf', 'WSRoundManhole.gltf', 'HSRoundManhole.gltf', 'YSCuboid.gltf', 'WSCuboid.gltf', 'HSCuboid.gltf'];*/
  let names = ['ysPipe', 'wsPipe', 'hsPipe', 'ysCanal', 'wsCanal', 'hsCanal', 'comb', 'ysRoundManhole', 'wsRoundManhole', 'hsRoundManhole'];
  let tPipes = [ysPipes, wsPipes, hsPipes, ysCanals, wsCanals, hsCanals, combs, ysRoundManholes, wsRoundManholes, hsRoundManholes];
  let gltfUris = ['IdentityPipeWithYSArrow.gltf', 'IdentityPipeWithWSArrow.gltf', 'IdentityPipeWithHSArrow.gltf',
    'YSCuboid.gltf', 'WSCuboid.gltf', 'HSCuboid.gltf',
    'Comb.gltf', 'YSRoundManhole.gltf', 'WSRoundManhole.gltf', 'HSRoundManhole.gltf'];
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
    children: children
  };
  tilesetJson = {
    asset: {
      version: "1.0"
    },
    geometricError: exports.geometricErrorArr[0],
    root: root
  };
  utils.saveJson(tilesetPath, tilesetJson, exports.prettyJson, exports.gzip);
  fsExtra.copyFileSync('D:\\Workplace\\Projects\\suqian\\ng-suqian\\src\\assets\\3dTile\\Instanced\\IdentityPipeWithHSArrow.gltf',
    'D:\\Workplace\\Projects\\suqian\\ng-suqian\\src\\assets\\3dTile\\Instanced\\' + tileDir + '\\IdentityPipeWithHSArrow.gltf');
  fsExtra.copyFileSync('D:\\Workplace\\Projects\\suqian\\ng-suqian\\src\\assets\\3dTile\\Instanced\\IdentityPipeWithWSArrow.gltf',
    'D:\\Workplace\\Projects\\suqian\\ng-suqian\\src\\assets\\3dTile\\Instanced\\' + tileDir + '\\IdentityPipeWithWSArrow.gltf');
  fsExtra.copyFileSync('D:\\Workplace\\Projects\\suqian\\ng-suqian\\src\\assets\\3dTile\\Instanced\\IdentityPipeWithYSArrow.gltf',
    'D:\\Workplace\\Projects\\suqian\\ng-suqian\\src\\assets\\3dTile\\Instanced\\' + tileDir + '\\IdentityPipeWithYSArrow.gltf');
  fsExtra.copyFileSync('D:\\Workplace\\Projects\\suqian\\ng-suqian\\src\\assets\\3dTile\\Instanced\\Comb.gltf',
    'D:\\Workplace\\Projects\\suqian\\ng-suqian\\src\\assets\\3dTile\\Instanced\\' + tileDir + '\\Comb.gltf');
  fsExtra.copyFileSync('D:\\Workplace\\Projects\\suqian\\ng-suqian\\src\\assets\\3dTile\\Instanced\\YSRoundManhole.gltf',
    'D:\\Workplace\\Projects\\suqian\\ng-suqian\\src\\assets\\3dTile\\Instanced\\' + tileDir + '\\YSRoundManhole.gltf');
  fsExtra.copyFileSync('D:\\Workplace\\Projects\\suqian\\ng-suqian\\src\\assets\\3dTile\\Instanced\\WSRoundManhole.gltf',
    'D:\\Workplace\\Projects\\suqian\\ng-suqian\\src\\assets\\3dTile\\Instanced\\' + tileDir + '\\WSRoundManhole.gltf');
  fsExtra.copyFileSync('D:\\Workplace\\Projects\\suqian\\ng-suqian\\src\\assets\\3dTile\\Instanced\\HSRoundManhole.gltf',
    'D:\\Workplace\\Projects\\suqian\\ng-suqian\\src\\assets\\3dTile\\Instanced\\' + tileDir + '\\HSRoundManhole.gltf');
  fsExtra.copyFileSync('D:\\Workplace\\Projects\\suqian\\ng-suqian\\src\\assets\\3dTile\\Instanced\\YSCuboid.gltf',
    'D:\\Workplace\\Projects\\suqian\\ng-suqian\\src\\assets\\3dTile\\Instanced\\' + tileDir + '\\YSCuboid.gltf');
  fsExtra.copyFileSync('D:\\Workplace\\Projects\\suqian\\ng-suqian\\src\\assets\\3dTile\\Instanced\\WSCuboid.gltf',
    'D:\\Workplace\\Projects\\suqian\\ng-suqian\\src\\assets\\3dTile\\Instanced\\' + tileDir + '\\WSCuboid.gltf');
  fsExtra.copyFileSync('D:\\Workplace\\Projects\\suqian\\ng-suqian\\src\\assets\\3dTile\\Instanced\\HSCuboid.gltf',
    'D:\\Workplace\\Projects\\suqian\\ng-suqian\\src\\assets\\3dTile\\Instanced\\' + tileDir + '\\HSCuboid.gltf');
  console.log(exports.pipeCount);
  for (var key in exports.levelPipes) {
    var len = geometryErrorUtils.getPredictCount(exports.geometricErrorArr[key - 1], boundingRegion[2] - boundingRegion[0],
      boundingRegion[3] - boundingRegion[1], exports.levelPipes[key]);
    console.log(key + ":" + exports.levelPipes[key] + "..........................." + Math.round(len));
  }
}

function getChild(pipes, index, root, tilesetDirectory, name, tileOptions, gltfUri) {
 // if (gltfUri === 'YSRoundManhole.gltf')
   // console.log('debug');
  var fourPipes = splitFourPipes(pipes);
  var children = [];
  for (let j = 0; j < fourPipes.length; j++) {
    if (fourPipes[j].length > 0) {
      var pipes0 = fourPipes[j];
      var boundingRegion = getBoundingRegion(pipes0);
      var geometryError = exports.geometricErrorArr[index];
      var child = {
        boundingVolume: {
          region: boundingRegion
        },
        geometricError: geometryError
      }
      var tmpPipes = getPipesBetweenSize(pipes0, geometryError / exports.maxLenK, undefined);
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
      cx = pipe.longitude;
      cy = pipe.latitude;
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
  let xmin = 1000, ymin = 1000, xmax = -1000, ymax = -1000, zmin = 1000, zmax = -1000;
  for (let i = 0; i < pipes.length; i++) {
    if (pipes[i].a !== undefined) {
      var pipe = pipes[i];
      try {
        if (pipe.a.longitude < xmin)
          xmin = pipe.a.longitude;
      }
      catch (err) {
        console.error(pipe);
      }
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
      if (pipe.h) {
        if (pipe.a.h + pipe.h / 1000.0 > zmax)
          zmax = pipe.a.h + pipe.h / 1000.0;
        if (pipe.b.h + pipe.h / 1000.0 > zmax)
          zmax = pipe.b.h + pipe.h / 1000.0;
      }
      else {
        if (pipe.a.h + pipe.w / 1000.0 > zmax)
          zmax = pipe.a.h + pipe.w / 1000.0;
        if (pipe.b.h + pipe.w / 1000.0 > zmax)
          zmax = pipe.b.h + pipe.w / 1000.0;
      }
    }
    else {
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
  }
  return [xmin - exports.gap, ymin - exports.gap, xmax + exports.gap, ymax + exports.gap, zmin, zmax];
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
    var h = pipe.w / 1000.0;
    return h;
  }
  else {
    if (pipe.d === undefined) {
      if (pipe.xl > pipe.yl)
        return pipe.xl / 1000.0;
      else
        return pipe.yl / 1000.0;
    }
    else 
      return pipe.d / 1000.0;
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
  featureTableJson.INSTANCES_LENGTH = pipes.length;
  attributes = [];
  center = getCenter(pipes);
  featureTableJson.RTC_CENTER = [center.x, center.y, center.z];
  attributes.push(getPositions(pipes, transform, center));
  attributes = attributes.concat(getOrientations(pipes));
  attributes.push(getNonUniformScales(pipes));
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
  let sumX = 0, sumY = 0, sumZ = 0;
  for (let i = 0; i < pipes.length; i++) {
    if (pipes[i].a !== undefined) {
      let pipe = pipes[i];
      sumX += (pipe.a.c3.x + pipe.b.c3.x) / 2.0;
      sumY += (pipe.a.c3.y + pipe.b.c3.y) / 2.0;
      sumZ += (pipe.a.c3.z + pipe.b.c3.z) / 2.0;
    }
    else {
      let comb = pipes[i];
      sumX += comb.c3.x;
      sumY += comb.c3.y;
      sumZ += comb.c3.z;
    }
  }
  return new cesium_1.Cartesian3(sumX / pipes.length, sumY / pipes.length, sumZ / pipes.length);
}

function getPosition(pipe, transform) {
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
  if (pipe.a === undefined) {
    try {
      let fixedFrame = cesium_1.Transforms.eastNorthUpToFixedFrame(pipe.c3, cesium_1.Ellipsoid.WGS84);
      return new cesium_1.Cartesian3(fixedFrame[8], fixedFrame[9], fixedFrame[10]);
    }
    catch (e) {
      console.log(pipe);
      console.log(pipe.c3);
    }
  }
  var pos = pipe.a.c3;
  let fixedFrame = cesium_1.Transforms.eastNorthUpToFixedFrame(pos, cesium_1.Ellipsoid.WGS84);
  var up = new cesium_1.Cartesian3(fixedFrame[8], fixedFrame[9], fixedFrame[10]);
  var north = new cesium_1.Cartesian3(fixedFrame[4], fixedFrame[5], fixedFrame[6]);
  var angle = calcAngle(pipe);
  var north2 = rotateVector(north, up, angle);
  var dis = cesium_1.Cartesian3.distance(pipe.a.c3, pipe.b.c3);
  // console.log('ah:' + pipe.a.h + ',bh:' + pipe.b.h + ',dis:' + dis);
  let angle2 = Math.asin((pipe.a.h - pipe.b.h) / dis);
  // console.log('up:' + up + ',north2:' + north2 + ',angle2:' + angle2);
  var result = rotateVector(up, north2, angle2);
  var x = result.x;
  var y = result.y;
  var z = result.z;
  // console.log('result:' + result);
  var normal = new cesium_1.Cartesian3(x, y, z);
  // console.log(normal);
  cesium_1.Cartesian3.normalize(normal, normal);
  return normal;
}

function getNormalRight(pipe) {
  if (pipe.a === undefined) {
    let fixedFrame = cesium_1.Transforms.eastNorthUpToFixedFrame(pipe.c3, cesium_1.Ellipsoid.WGS84);
    return new cesium_1.Cartesian3(fixedFrame[0], fixedFrame[1], fixedFrame[2]);
  }
  var pos = pipe.a.c3;
  var fixedFrame = cesium_1.Transforms.eastNorthUpToFixedFrame(pos, cesium_1.Ellipsoid.WGS84);
  var east = new cesium_1.Cartesian3(fixedFrame[0], fixedFrame[1], fixedFrame[2]); //east/right
  var north = new cesium_1.Cartesian3(fixedFrame[4], fixedFrame[5], fixedFrame[6]);
  var up = new cesium_1.Cartesian3(fixedFrame[8], fixedFrame[9], fixedFrame[10]); //up
  var angle = calcAngle(pipe);
  var east2 = rotateVector(east, up, angle);
  var north2 = rotateVector(north, up, angle);
  var dis = cesium_1.Cartesian3.distance(pipe.a.c3, pipe.b.c3);
  let angle2 = Math.asin((pipe.a.h - pipe.b.h) / dis);
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
  if (pipe.a === undefined) {
    if (pipe.d === undefined) {
      if (pipe.xl >= pipe.yl)
        return { x: pipe.xl / 1000.0, y: pipe.gl - pipe.il, z: pipe.yl / 1000.0 };
      else
        return { x: pipe.yl / 1000.0, y: pipe.gl - pipe.il, z: pipe.xl / 1000.0 };
    }
    else
      return { x: pipe.d / 1000.0, y: pipe.gl - pipe.il, z: pipe.d / 1000.0 };
  }
  var positionA = pipe.a.c3;
  var positionB = pipe.b.c3;
  var scaleX = cesium_1.Cartesian3.distance(positionA, positionB); // / 794.0;
  var scaleZ = pipe.w / 1000.0 / 2.0; // / (64.0 / Math.PI);
  var scaleY = scaleZ;
  if (pipe.h)
    scaleY = pipe.h / 1000.0 / 2.0;

  return { x: scaleX, y: scaleY, z: scaleZ };
  // return { x: 1, y: 1, z: 1 };
}

function generateInstancesBatchTable(pipes) {
  var idList = [];
  var tableNameList = [];
  var featureList = [];
  var centerTop = [];
  for (var i = 0; i < pipes.length; i++) {
    var pipe = pipes[i];
    idList.push(pipe.id);
    tableNameList.push(pipe.tableName);
    featureList.push(pipe.feature);
    if (pipe.a) {
      var h = pipe.w;
      if (pipe.h)
        h = pipe.h
      centerTop.push([(pipe.a.x + pipe.b.x) / 2.0, (pipe.a.y + pipe.b.y) / 2.0, (pipe.a.h + pipe.b.h) / 2.0 + h / 1000.0]);
    }
    else
      centerTop.push([pipe.x, pipe.y, pipe.gl])
  }
  return {
    id: idList,
    tableName: tableNameList,
    feature: featureList,
    centerTop: centerTop
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