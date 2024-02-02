"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeshView = void 0;
var MeshView = /** @class */ (function () {
    /**
     * A subsection of the mesh with its own material.
     *
     * @param {Material} material The material.
     * @param {Number} indexOffset The start index into the mesh's indices
     * array.
     * @param {Number} indexCount The number of indices.
     *
     * @constructor
     * @private
     */
    function MeshView(material, indexOffset, indexCount) {
        this.material = material;
        this.indexOffset = indexOffset;
        this.indexCount = indexCount;
    }
    return MeshView;
}());
exports.MeshView = MeshView;
//# sourceMappingURL=meshView.js.map