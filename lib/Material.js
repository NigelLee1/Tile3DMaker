"use strict";
/**
 * A material that is applied to a mesh.
 *
 * @param {Object} [options] An object with the following properties:
 * @param {Array|String} [options.baseColor] The base color or base color texture path.
 *
 * @constructor
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TexturedMaterial = exports.Material = void 0;
var Material = /** @class */ (function () {
    // TODO: Original code combined rgbas with jpg uris, should refactor
    //       this too.
    function Material(baseColor) {
        if (baseColor === void 0) { baseColor = [0.5, 0.5, 0.5, 1.0]; }
        this.baseColor = baseColor;
    }
    /**
     * Creates a Material from a glTF material. This utility is designed only for simple glTFs like those in the data folder.
     *
     * @param {Object} material The glTF material.
     * @returns {Material} The material.
     */
    Material.fromGltf = function (material) {
        return new Material(material.pbrMetallicRoughness.baseColorFactor);
    };
    return Material;
}());
exports.Material = Material;
var TexturedMaterial = /** @class */ (function () {
    function TexturedMaterial(baseColor) {
        this.baseColor = baseColor;
    }
    return TexturedMaterial;
}());
exports.TexturedMaterial = TexturedMaterial;
//# sourceMappingURL=Material.js.map