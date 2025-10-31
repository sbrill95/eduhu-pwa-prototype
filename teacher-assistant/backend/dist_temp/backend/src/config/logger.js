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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logHttp = exports.logDebug = exports.logWarn = exports.logInfo = exports.logError = exports.logStream = exports.logger = void 0;
var winston_1 = require("winston");
var index_1 = require("./index");
// Define custom log levels
var customLevels = {
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        debug: 4,
    },
    colors: {
        error: 'red',
        warn: 'yellow',
        info: 'green',
        http: 'magenta',
        debug: 'white',
    },
};
// Add colors to winston
winston_1.default.addColors(customLevels.colors);
// Define log format for different environments
var developmentFormat = winston_1.format.combine(winston_1.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.format.errors({ stack: true }), winston_1.format.colorize({ all: true }), winston_1.format.printf(function (_a) {
    var timestamp = _a.timestamp, level = _a.level, message = _a.message, stack = _a.stack, meta = __rest(_a, ["timestamp", "level", "message", "stack"]);
    var metaString = Object.keys(meta).length
        ? JSON.stringify(meta, null, 2)
        : '';
    var stackString = stack ? "\n".concat(stack) : '';
    return "".concat(timestamp, " [").concat(level, "]: ").concat(message).concat(metaString).concat(stackString);
}));
var productionFormat = winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.errors({ stack: true }), winston_1.format.json());
// Define transports based on environment
var getTransports = function () {
    var commonTransports = [
        // Console transport
        new winston_1.transports.Console({
            level: index_1.config.NODE_ENV === 'production' ? 'info' : 'debug',
            format: index_1.config.NODE_ENV === 'production' ? productionFormat : developmentFormat,
        }),
    ];
    // File transports for production
    if (index_1.config.NODE_ENV === 'production') {
        commonTransports.push(
        // Error log file
        new winston_1.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: productionFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }), 
        // Combined log file
        new winston_1.transports.File({
            filename: 'logs/combined.log',
            format: productionFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }));
    }
    return commonTransports;
};
// Create logger instance
exports.logger = winston_1.default.createLogger({
    level: index_1.config.NODE_ENV === 'production' ? 'info' : 'debug',
    levels: customLevels.levels,
    format: index_1.config.NODE_ENV === 'production' ? productionFormat : developmentFormat,
    transports: getTransports(),
    // Handle uncaught exceptions
    exceptionHandlers: [
        new winston_1.transports.Console({
            format: index_1.config.NODE_ENV === 'production' ? productionFormat : developmentFormat,
        }),
    ],
    // Handle unhandled promise rejections
    rejectionHandlers: [
        new winston_1.transports.Console({
            format: index_1.config.NODE_ENV === 'production' ? productionFormat : developmentFormat,
        }),
    ],
    // Exit process on handled exceptions
    exitOnError: false,
});
// Create a stream for morgan HTTP logging middleware
exports.logStream = {
    write: function (message) {
        exports.logger.http(message.trim());
    },
};
// Helper functions for structured logging
var logError = function (message, error, meta) {
    exports.logger.error(message, __assign({ error: error === null || error === void 0 ? void 0 : error.message, stack: error === null || error === void 0 ? void 0 : error.stack }, meta));
};
exports.logError = logError;
var logInfo = function (message, meta) {
    exports.logger.info(message, meta);
};
exports.logInfo = logInfo;
var logWarn = function (message, meta) {
    exports.logger.warn(message, meta);
};
exports.logWarn = logWarn;
var logDebug = function (message, meta) {
    exports.logger.debug(message, meta);
};
exports.logDebug = logDebug;
var logHttp = function (message, meta) {
    exports.logger.http(message, meta);
};
exports.logHttp = logHttp;
// Log system startup
if (index_1.config.NODE_ENV !== 'test') {
    exports.logger.info('Logger initialized', {
        level: exports.logger.level,
        environment: index_1.config.NODE_ENV,
        transports: exports.logger.transports.map(function (t) { return t.constructor.name; }),
    });
}
exports.default = exports.logger;
