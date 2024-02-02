var levels = [];
levels.push({ geometryError: 0, w: 0.00003074357941401651, h: 0.000014291428273582873 });
levels.push({ geometryError: 1, w: 0.00004867616595793933, h: 0.0000226275135554177 });
levels.push({ geometryError: 3, w: 0.0000798756855799887, h: 0.00003713075574446334 });
levels.push({ geometryError: 4, w: 0.00009652843555385537, h: 0.00004487182945378532 });
levels.push({ geometryError: 6, w: 0.00011781244678465974, h: 0.000054765721267668876 });
levels.push({ geometryError: 7, w: 0.00014501575726733051, h: 0.0000674111463873639 });
levels.push({ geometryError: 10, w: 0.00017978471850232935, h: 0.00008357335939090937 });
levels.push({ geometryError: 12, w: 0.00022422367826369083, h: 0.00010423047993329826 });
levels.push({ geometryError: 16, w: 0.0002810223988758409, h: 0.00013063268936963635 });
levels.push({ geometryError: 20, w: 0.0003536190278605744, h: 0.0001643779554523772 });
levels.push({ geometryError: 27, w: 0.00045191594734683704, h: 0.00021006881327728655 });
levels.push({ geometryError: 35, w: 0.0005775564207903816, h: 0.00026846839925326327 });
levels.push({ geometryError: 45, w: 0.0007381487640505391, h: 0.00034311211185417134 });
levels.push({ geometryError: 57, w: 0.0009434207091802982, h: 0.0004385197144955999 });
levels.push({ geometryError: 74, w: 0.0012058098606937406, h: 0.000560469224435256 });
levels.push({ geometryError: 95, w: 0.0015412209612706285, h: 0.0007163480084382834 });
levels.push({ geometryError: 122, w: 0.0019699938590149735, h: 0.0009156012732417507 });
levels.push({ geometryError: 156, w: 0.002518145766097879, h: 0.0011703070385346015 });
levels.push({ geometryError: 200, w: 0.0032189649596430225, h: 0.001495913044297692 });
levels.push({ geometryError: 256, w: 0.004115053125555823, h: 0.0019121792707871843 });
levels.push({ geometryError: 328, w: 0.0052609524556943565, h: 0.0024443886366211087 });
levels.push({ geometryError: 420, w: 0.00672652383889405, h: 0.003124899020441052 });
levels.push({ geometryError: 537, w: 0.00860130669407111, h: 0.003995140939869746 });
levels.push({ geometryError: 687, w: 0.01100015169131674, h: 0.005108186942872905 });
levels.push({ geometryError: 879, w: 0.014070519203146725, h: 0.006532063596279281 });
levels.push({ geometryError: 1123, w: 0.01800199543969505, h: 0.008354041137724477 });

function getPredictCount(geometryError, w, h, count) {
  
  let w0 = undefined, h0 = undefined;
  for (let i = 0; i < levels.length; i++) {
    let item = levels[i];
    if (item.geometryError === geometryError) {
      w0 = item.w;
      h0 = item.w;
    }
    else if (i < levels.length - 1 && geometryError > item.geometryError && geometryError < levels[i + 1].geometryError) {
      let ga = geometryError - item.geometryError;
      let gb = levels[i + 1].geometryError - geometryError;
      w0 = item.w + (levels[i + 1].w - item.w) * ga / (ga + gb);
      h0 = item.h + (levels[i + 1].h - item.h) * ga / (ga + gb);
    }
  }
  if (w0 === undefined) {
    if (geometryError > 1123) {
      w0 = levels[levels.length - 1].w;
      h0 = levels[levels.length - 1].h;
    }
    else
      throw 'getPredictCount error,geometryError:' + geometryError;
  }
  let result = count * (w0 / w) * (h0 / h);
  if (result === 1425754.5094901787)
    result = result * 1;
  return result;
}
exports.getPredictCount = getPredictCount;