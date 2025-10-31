"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isGeneratedArtifact = exports.isChatMessage = void 0;
const isChatMessage = (data) => {
    return (typeof data === 'object' &&
        typeof data.id === 'string' &&
        typeof data.content === 'string' &&
        ['user', 'assistant', 'system'].includes(data.role));
};
exports.isChatMessage = isChatMessage;
const isGeneratedArtifact = (data) => {
    return (typeof data === 'object' &&
        typeof data.id === 'string' &&
        ['image', 'worksheet', 'presentation', 'document'].includes(data.artifact_type));
};
exports.isGeneratedArtifact = isGeneratedArtifact;
//# sourceMappingURL=database-schemas.js.map