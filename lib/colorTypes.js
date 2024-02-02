"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranslucencyType = exports.BaseColorType = void 0;
var BaseColorType;
(function (BaseColorType) {
    BaseColorType[BaseColorType["White"] = 0] = "White";
    BaseColorType[BaseColorType["Color"] = 1] = "Color";
    BaseColorType[BaseColorType["Texture"] = 2] = "Texture";
})(BaseColorType = exports.BaseColorType || (exports.BaseColorType = {}));
var TranslucencyType;
(function (TranslucencyType) {
    TranslucencyType[TranslucencyType["Opaque"] = 0] = "Opaque";
    TranslucencyType[TranslucencyType["Translucent"] = 1] = "Translucent";
    TranslucencyType[TranslucencyType["Mix"] = 2] = "Mix";
})(TranslucencyType = exports.TranslucencyType || (exports.TranslucencyType = {}));
//# sourceMappingURL=colorTypes.js.map