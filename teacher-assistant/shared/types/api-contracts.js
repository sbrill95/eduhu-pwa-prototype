"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isChatMessageRequest = exports.isImageGenerationRequest = void 0;
const isImageGenerationRequest = (data) => {
    return (typeof data === 'object' &&
        typeof data.description === 'string' &&
        data.description.length >= 10 &&
        ['realistic', 'cartoon', 'illustrative', 'abstract'].includes(data.imageStyle));
};
exports.isImageGenerationRequest = isImageGenerationRequest;
const isChatMessageRequest = (data) => {
    return (typeof data === 'object' &&
        Array.isArray(data.messages) &&
        typeof data.userId === 'string');
};
exports.isChatMessageRequest = isChatMessageRequest;
//# sourceMappingURL=api-contracts.js.map