var cesium_1 = require("cesium");
var fsExtra = require('fs-extra');

function metersToLongitude(meters, latitude) {
  return (meters * 0.000000156785) / Math.cos(latitude);
}
exports.metersToLongitude = metersToLongitude;

function metersToLatitude(meters) {
  return meters * 0.000000157891;
}
exports.metersToLatitude = metersToLatitude;

function saveJson(path, json, prettyJson, gzip) {
  prettyJson = cesium_1.defaultValue(prettyJson, true);
  var options = {};
  if (prettyJson) {
    options.spaces = 2;
  }
  gzip = cesium_1.defaultValue(gzip, false);
  if (gzip) {
    return saveBinary(path, Buffer.from(JSON.stringify(json)), gzip);
  }
  return fsExtra.outputJson(path, json, options);
}
exports.saveJson = saveJson;

function saveBinary(path, contents, gzip) {
  gzip = cesium_1.defaultValue(gzip, false);
  if (gzip) {
    contents = zlib.gzipSync(contents);
  }
  return fsExtra.outputFile(path, contents);
}
exports.saveBinary = saveBinary;

function getBoundingVolume(region, box, sphere) {
  if (region != null) {
    return { region: region };
  }
  if (box != null) {
    return { box: box };
  }
  return { sphere: sphere };
}
exports.getBoundingVolume = getBoundingVolume;

/**
 * Get the minimum and maximum values for each property in the batch table.
 * Ignore properties in the batch table binary for now. Also ignore non-number values.
 *
 * @param {Object|Object[]} batchTable The batch table(s).
 * @returns {Object} An object with the minimum and maximum values for each property in the batch table.
 */
function getProperties(batchTable) {
  if (!cesium_1.defined(batchTable)) {
    return undefined;
  }
  var properties = {};
  var batchTables = Array.isArray(batchTable) ? batchTable : [batchTable];
  var batchTablesLength = batchTables.length;
  for (var i = 0; i < batchTablesLength; ++i) {
    batchTable = batchTables[i];
    for (var name in batchTable) {
      if (batchTable.hasOwnProperty(name)) {
        var values = batchTable[name];
        if (Array.isArray(values)) {
          if (typeof values[0] === 'number') {
            if (!cesium_1.defined(properties[name])) {
              properties[name] = {
                minimum: Number.POSITIVE_INFINITY,
                maximum: Number.NEGATIVE_INFINITY
              };
            }
            var min = properties[name].minimum;
            var max = properties[name].maximum;
            var length = values.length;
            for (var j = 0; j < length; ++j) {
              var value = values[j];
              min = Math.min(value, min);
              max = Math.max(value, max);
            }
            properties[name].minimum = min;
            properties[name].maximum = max;
          }
        }
      }
    }
  }
  if (Object.keys(properties).length === 0) {
    return undefined;
  }
  return properties;
}
exports.getProperties = getProperties;

function getGltfUriBuffer(uri) {
  uri = uri.replace(/\\/g, '/');
  return Buffer.from(uri);
}
exports.getGltfUriBuffer = getGltfUriBuffer;

/**
 * Pad the buffer to the next 8-byte boundary to ensure proper alignment for the section that follows.
 *
 * @param {Buffer} buffer The buffer.
 * @param {Number} [byteOffset=0] The byte offset on which the buffer starts.
 * @returns {Buffer} The padded buffer.
 */
function getBufferPadded(buffer, byteOffset) {
  if (!cesium_1.defined(buffer)) {
    return Buffer.alloc(0);
  }
  byteOffset = cesium_1.defaultValue(byteOffset, 0);
  var boundary = 8;
  var byteLength = buffer.length;
  var remainder = (byteOffset + byteLength) % boundary;
  var padding = (remainder === 0) ? 0 : boundary - remainder;
  var emptyBuffer = Buffer.alloc(padding);
  return Buffer.concat([buffer, emptyBuffer]);
}
exports.getBufferPadded = getBufferPadded;

/**
 * Convert the JSON object to a padded buffer.
 *
 * Pad the JSON with extra whitespace to fit the next 8-byte boundary. This ensures proper alignment
 * for the section that follows (for example, batch table binary or feature table binary).
 *
 * @param {Object} [json] The JSON object.
 * @param {Number} [byteOffset=0] The byte offset on which the buffer starts.
 * @returns {Buffer} The padded JSON buffer.
 */
function getJsonBufferPadded(json, byteOffset) {
  if (!cesium_1.defined(json)) {
    return Buffer.alloc(0);
  }
  byteOffset = cesium_1.defaultValue(byteOffset, 0);
  var string = JSON.stringify(json);
  var boundary = 8;
  var byteLength = Buffer.byteLength(string);
  var remainder = (byteOffset + byteLength) % boundary;
  var padding = (remainder === 0) ? 0 : boundary - remainder;
  var whitespace = '';
  for (var i = 0; i < padding; ++i) {
    whitespace += ' ';
  }
  string += whitespace;
  return Buffer.from(string);
}
exports.getJsonBufferPadded = getJsonBufferPadded;

function wgs84Transform(longitude, latitude, height) {
  return cesium_1.Transforms.headingPitchRollToFixedFrame(cesium_1.Cartesian3.fromRadians(longitude, latitude, height), new cesium_1.HeadingPitchRoll());
}
exports.wgs84Transform = wgs84Transform;

function toCamelCase(s) {
  return s[0].toLowerCase() + s.slice(1);
}
exports.toCamelCase = toCamelCase;