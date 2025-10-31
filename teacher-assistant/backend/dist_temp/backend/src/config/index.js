"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTest = exports.isProduction = exports.isDevelopment = exports.config = void 0;
var dotenv_1 = require("dotenv");
// Load environment variables from .env file
dotenv_1.default.config();
// Validate required environment variables
var requiredEnvVars = [
    'PORT',
    'NODE_ENV',
    'FRONTEND_URL',
    'API_PREFIX',
    'OPENAI_API_KEY',
];
// Optional environment variables for Phase 3 InstantDB integration
var optionalEnvVars = [
    'INSTANTDB_APP_ID',
    'INSTANTDB_ADMIN_TOKEN',
];
var missingEnvVars = requiredEnvVars.filter(function (envVar) { return !process.env[envVar]; });
if (missingEnvVars.length > 0) {
    throw new Error("Missing required environment variables: ".concat(missingEnvVars.join(', ')));
}
// Export configuration object
exports.config = __assign(__assign({ PORT: process.env.PORT, NODE_ENV: process.env.NODE_ENV, FRONTEND_URL: process.env.FRONTEND_URL, API_PREFIX: process.env.API_PREFIX, OPENAI_API_KEY: process.env.OPENAI_API_KEY }, (process.env.INSTANTDB_APP_ID && { INSTANTDB_APP_ID: process.env.INSTANTDB_APP_ID })), (process.env.INSTANTDB_ADMIN_TOKEN && { INSTANTDB_ADMIN_TOKEN: process.env.INSTANTDB_ADMIN_TOKEN }));
// Environment helpers
exports.isDevelopment = exports.config.NODE_ENV === 'development';
exports.isProduction = exports.config.NODE_ENV === 'production';
exports.isTest = exports.config.NODE_ENV === 'test';
