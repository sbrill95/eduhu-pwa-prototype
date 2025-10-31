"use strict";
/**
 * InstantDB Service Layer for Teacher Assistant Backend
 * Phase 3 Preparation - Backend Integration with InstantDB
 */
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstantDBService = exports.FileStorageService = exports.ProfileCharacteristicsService = exports.AnalyticsService = exports.ArtifactService = exports.UserService = exports.MessageService = exports.ChatSessionService = exports.db = exports.getInstantDB = exports.isInstantDBAvailable = exports.initializeInstantDB = void 0;
var admin_1 = require("@instantdb/admin");
var instantdb_1 = require("../schemas/instantdb");
var logger_1 = require("../config/logger");
var config_1 = require("../config");
/**
 * InstantDB Admin Client for server-side operations
 * This will be initialized when InstantDB integration is enabled
 */
var instantDB = null;
/**
 * Initialize InstantDB connection
 */
var initializeInstantDB = function () {
    try {
        if (!config_1.config.INSTANTDB_APP_ID || !config_1.config.INSTANTDB_ADMIN_TOKEN) {
            (0, logger_1.logError)('InstantDB credentials not configured', new Error('Missing INSTANTDB_APP_ID or INSTANTDB_ADMIN_TOKEN'));
            return false;
        }
        // BUG-025 FIX: Remove local schema - use cloud schema only
        instantDB = (0, admin_1.init)({
            appId: config_1.config.INSTANTDB_APP_ID,
            adminToken: config_1.config.INSTANTDB_ADMIN_TOKEN,
            // schema: teacherAssistantSchema, // Removed - conflicts with cloud schema
        });
        (0, logger_1.logInfo)('InstantDB initialized successfully', {
            appId: config_1.config.INSTANTDB_APP_ID.substring(0, 8) + '...',
        });
        return true;
    }
    catch (error) {
        (0, logger_1.logError)('Failed to initialize InstantDB', error);
        return false;
    }
};
exports.initializeInstantDB = initializeInstantDB;
/**
 * Check if InstantDB is available and initialized
 */
var isInstantDBAvailable = function () {
    return instantDB !== null;
};
exports.isInstantDBAvailable = isInstantDBAvailable;
/**
 * Get the InstantDB instance (for direct access to db operations)
 */
var getInstantDB = function () {
    if (!instantDB) {
        throw new Error('InstantDB not initialized. Call initializeInstantDB() first.');
    }
    return instantDB;
};
exports.getInstantDB = getInstantDB;
/**
 * Export db directly for convenience
 */
var db = function () { return (0, exports.getInstantDB)(); };
exports.db = db;
/**
 * Chat Session Management Service
 */
var ChatSessionService = /** @class */ (function () {
    function ChatSessionService() {
    }
    /**
     * Create a new chat session for a user
     */
    ChatSessionService.createSession = function (userId, title, sessionType) {
        return __awaiter(this, void 0, void 0, function () {
            var sessionData, result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(0, exports.isInstantDBAvailable)()) {
                            (0, logger_1.logError)('InstantDB not available for session creation', new Error('InstantDB not initialized'));
                            return [2 /*return*/, null];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        sessionData = instantdb_1.dbHelpers.createChatSession(userId, title, sessionType);
                        return [4 /*yield*/, instantDB.transact([
                                instantDB.tx.chat_sessions[instantDB.id()].update(sessionData)
                            ])];
                    case 2:
                        result = _a.sent();
                        (0, logger_1.logInfo)('Chat session created successfully', { userId: userId, sessionType: sessionType });
                        return [2 /*return*/, result.txId];
                    case 3:
                        error_1 = _a.sent();
                        (0, logger_1.logError)('Failed to create chat session', error_1, { userId: userId });
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get all sessions for a user
     */
    ChatSessionService.getUserSessions = function (userId_1) {
        return __awaiter(this, arguments, void 0, function (userId, includeArchived) {
            var query, result, error_2;
            if (includeArchived === void 0) { includeArchived = false; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(0, exports.isInstantDBAvailable)())
                            return [2 /*return*/, null];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        query = {
                            chat_sessions: {
                                $: {
                                    where: {
                                        'owner.id': userId,
                                        is_archived: includeArchived ? undefined : false
                                    }
                                },
                                owner: {},
                                messages: {
                                    author: {}
                                },
                                generated_artifacts: {}
                            }
                        };
                        return [4 /*yield*/, instantDB.query(query)];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result.chat_sessions || []];
                    case 3:
                        error_2 = _a.sent();
                        (0, logger_1.logError)('Failed to fetch user sessions', error_2, { userId: userId });
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Update session title or metadata
     */
    ChatSessionService.updateSession = function (sessionId, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var updateData, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(0, exports.isInstantDBAvailable)())
                            return [2 /*return*/, false];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        updateData = __assign(__assign({}, updates), { updated_at: Date.now() });
                        return [4 /*yield*/, instantDB.transact([
                                instantDB.tx.chat_sessions[sessionId].update(updateData)
                            ])];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 3:
                        error_3 = _a.sent();
                        (0, logger_1.logError)('Failed to update session', error_3, { sessionId: sessionId });
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Archive a chat session
     */
    ChatSessionService.archiveSession = function (sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.updateSession(sessionId, { is_archived: true })];
            });
        });
    };
    /**
     * Update chat session summary (stored in 'title' field)
     */
    ChatSessionService.updateSummary = function (sessionId, summary) {
        return __awaiter(this, void 0, void 0, function () {
            var error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(0, exports.isInstantDBAvailable)())
                            return [2 /*return*/, false];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, instantDB.transact([
                                instantDB.tx.chat_sessions[sessionId].update({
                                    title: summary,
                                    updated_at: Date.now()
                                })
                            ])];
                    case 2:
                        _a.sent();
                        (0, logger_1.logInfo)('Chat session summary updated', { sessionId: sessionId, summary: summary });
                        return [2 /*return*/, true];
                    case 3:
                        error_4 = _a.sent();
                        (0, logger_1.logError)('Failed to update chat summary', error_4, { sessionId: sessionId });
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Delete a chat session and all its messages
     *
     * NOTE: This method is currently disabled because InstantDB Admin SDK doesn't support
     * bulk deletion with where clauses. To properly implement this, we would need to:
     * 1. Query all messages for the session
     * 2. Delete each message individually
     * 3. Delete the session
     *
     * For now, use the archiveSession method instead to soft-delete sessions.
     */
    ChatSessionService.deleteSession = function (sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!(0, exports.isInstantDBAvailable)())
                    return [2 /*return*/, false];
                try {
                    // TODO: Implement proper deletion logic when InstantDB supports bulk operations
                    // Current workaround: Archive the session instead
                    (0, logger_1.logInfo)('deleteSession called but not fully implemented - archiving instead', { sessionId: sessionId });
                    return [2 /*return*/, this.archiveSession(sessionId)];
                    /* Original implementation - commented out due to InstantDB API limitations
                    // First, fetch all messages for this session
                    const messagesQuery = await instantDB.query({
                      messages: {
                        $: { where: { 'session.id': sessionId } }
                      }
                    });
              
                    // Delete each message individually
                    const messageIds = messagesQuery.messages?.map(m => m.id) || [];
                    if (messageIds.length > 0) {
                      await instantDB.transact(
                        messageIds.map(id => instantDB.tx.messages[id].delete())
                      );
                    }
              
                    // Then delete the session
                    await instantDB.transact([
                      instantDB.tx.chat_sessions[sessionId].delete()
                    ]);
              
                    return true;
                    */
                }
                catch (error) {
                    (0, logger_1.logError)('Failed to delete session', error, { sessionId: sessionId });
                    return [2 /*return*/, false];
                }
                return [2 /*return*/];
            });
        });
    };
    return ChatSessionService;
}());
exports.ChatSessionService = ChatSessionService;
/**
 * Message Management Service
 */
var MessageService = /** @class */ (function () {
    function MessageService() {
    }
    /**
     * Add a new message to a chat session
     */
    MessageService.createMessage = function (sessionId_1, userId_1, content_1) {
        return __awaiter(this, arguments, void 0, function (sessionId, userId, content, role, metadata) {
            var sessionQuery, messageIndex, messageData, result, error_5;
            var _a, _b, _c;
            if (role === void 0) { role = 'user'; }
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        if (!(0, exports.isInstantDBAvailable)())
                            return [2 /*return*/, null];
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, instantDB.query({
                                chat_sessions: {
                                    $: { where: { id: sessionId } },
                                    messages: {}
                                }
                            })];
                    case 2:
                        sessionQuery = _d.sent();
                        messageIndex = ((_c = (_b = (_a = sessionQuery.chat_sessions) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.messages) === null || _c === void 0 ? void 0 : _c.length) || 0;
                        messageData = __assign(__assign({}, instantdb_1.dbHelpers.createMessage(sessionId, userId, content, role, messageIndex)), metadata);
                        return [4 /*yield*/, instantDB.transact([
                                instantDB.tx.messages[instantDB.id()].update(messageData),
                                // Update session timestamp
                                instantDB.tx.chat_sessions[sessionId].update(instantdb_1.dbHelpers.updateSessionTimestamp(sessionId))
                            ])];
                    case 3:
                        result = _d.sent();
                        return [2 /*return*/, result.txId];
                    case 4:
                        error_5 = _d.sent();
                        (0, logger_1.logError)('Failed to create message', error_5, { sessionId: sessionId, userId: userId, role: role });
                        return [2 /*return*/, null];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get all messages for a session
     */
    MessageService.getSessionMessages = function (sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(0, exports.isInstantDBAvailable)())
                            return [2 /*return*/, null];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, instantDB.query({
                                messages: {
                                    $: {
                                        where: { 'session.id': sessionId },
                                        order: { by: 'message_index', direction: 'asc' }
                                    },
                                    author: {},
                                    session: {},
                                    feedback_received: {}
                                }
                            })];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result.messages || []];
                    case 3:
                        error_6 = _a.sent();
                        (0, logger_1.logError)('Failed to fetch session messages', error_6, { sessionId: sessionId });
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Update a message (for editing)
     */
    MessageService.updateMessage = function (messageId, content) {
        return __awaiter(this, void 0, void 0, function () {
            var error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(0, exports.isInstantDBAvailable)())
                            return [2 /*return*/, false];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, instantDB.transact([
                                instantDB.tx.messages[messageId].update({
                                    content: content,
                                    is_edited: true,
                                    edited_at: Date.now()
                                })
                            ])];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 3:
                        error_7 = _a.sent();
                        (0, logger_1.logError)('Failed to update message', error_7, { messageId: messageId });
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Delete a message
     */
    MessageService.deleteMessage = function (messageId) {
        return __awaiter(this, void 0, void 0, function () {
            var error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(0, exports.isInstantDBAvailable)())
                            return [2 /*return*/, false];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, instantDB.transact([
                                instantDB.tx.messages[messageId].delete()
                            ])];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 3:
                        error_8 = _a.sent();
                        (0, logger_1.logError)('Failed to delete message', error_8, { messageId: messageId });
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return MessageService;
}());
exports.MessageService = MessageService;
/**
 * User Management Service
 */
var UserService = /** @class */ (function () {
    function UserService() {
    }
    /**
     * Create or update a user profile
     */
    UserService.upsertUser = function (userData) {
        return __awaiter(this, void 0, void 0, function () {
            var userRecord, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(0, exports.isInstantDBAvailable)())
                            return [2 /*return*/, false];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        userRecord = __assign(__assign({}, userData), { last_active: Date.now(), created_at: userData.created_at || Date.now(), is_active: userData.is_active !== undefined ? userData.is_active : true // Provide default value
                         });
                        return [4 /*yield*/, instantDB.transact([
                                instantDB.tx.users[userData.id || instantDB.id()].update(userRecord)
                            ])];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 3:
                        error_9 = _a.sent();
                        (0, logger_1.logError)('Failed to upsert user', error_9, { userId: userData.id });
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get user by ID
     */
    UserService.getUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_10;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(0, exports.isInstantDBAvailable)())
                            return [2 /*return*/, null];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, instantDB.query({
                                users: {
                                    $: { where: { id: userId } },
                                    chat_sessions: {
                                        messages: {}
                                    },
                                    created_artifacts: {},
                                    created_templates: {}
                                }
                            })];
                    case 2:
                        result = _b.sent();
                        return [2 /*return*/, ((_a = result.users) === null || _a === void 0 ? void 0 : _a[0]) || null];
                    case 3:
                        error_10 = _b.sent();
                        (0, logger_1.logError)('Failed to fetch user', error_10, { userId: userId });
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Update user's last active timestamp
     */
    UserService.updateLastActive = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var error_11;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(0, exports.isInstantDBAvailable)())
                            return [2 /*return*/, false];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, instantDB.transact([
                                instantDB.tx.users[userId].update({ last_active: Date.now() })
                            ])];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 3:
                        error_11 = _a.sent();
                        (0, logger_1.logError)('Failed to update user last active', error_11, { userId: userId });
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return UserService;
}());
exports.UserService = UserService;
/**
 * Artifact Management Service
 */
var ArtifactService = /** @class */ (function () {
    function ArtifactService() {
    }
    /**
     * Create an educational artifact from a chat session
     */
    ArtifactService.createArtifact = function (sessionId, userId, title, type, content, metadata) {
        return __awaiter(this, void 0, void 0, function () {
            var artifactData, result, error_12;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(0, exports.isInstantDBAvailable)())
                            return [2 /*return*/, null];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        artifactData = __assign(__assign(__assign({}, instantdb_1.dbHelpers.createArtifact(sessionId, userId, title, type, content)), metadata), { tags: (metadata === null || metadata === void 0 ? void 0 : metadata.tags) ? JSON.stringify(metadata.tags) : undefined });
                        return [4 /*yield*/, instantDB.transact([
                                instantDB.tx.artifacts[instantDB.id()].update(artifactData)
                            ])];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result.txId];
                    case 3:
                        error_12 = _a.sent();
                        (0, logger_1.logError)('Failed to create artifact', error_12, { sessionId: sessionId, userId: userId, type: type });
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get user's artifacts
     */
    ArtifactService.getUserArtifacts = function (userId, type) {
        return __awaiter(this, void 0, void 0, function () {
            var whereClause, result, error_13;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(0, exports.isInstantDBAvailable)())
                            return [2 /*return*/, null];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        whereClause = { 'creator.id': userId };
                        if (type)
                            whereClause.type = type;
                        return [4 /*yield*/, instantDB.query({
                                artifacts: {
                                    $: {
                                        where: whereClause,
                                        order: { by: 'created_at', direction: 'desc' }
                                    },
                                    creator: {},
                                    source_session: {},
                                    feedback_received: {}
                                }
                            })];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result.artifacts || []];
                    case 3:
                        error_13 = _a.sent();
                        (0, logger_1.logError)('Failed to fetch user artifacts', error_13, { userId: userId });
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Toggle artifact favorite status
     */
    ArtifactService.toggleFavorite = function (artifactId) {
        return __awaiter(this, void 0, void 0, function () {
            var result, current, error_14;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(0, exports.isInstantDBAvailable)())
                            return [2 /*return*/, false];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, instantDB.query({
                                artifacts: {
                                    $: { where: { id: artifactId } }
                                }
                            })];
                    case 2:
                        result = _b.sent();
                        current = (_a = result.artifacts) === null || _a === void 0 ? void 0 : _a[0];
                        if (!current)
                            return [2 /*return*/, false];
                        return [4 /*yield*/, instantDB.transact([
                                instantDB.tx.artifacts[artifactId].update({
                                    is_favorite: !current.is_favorite,
                                    updated_at: Date.now()
                                })
                            ])];
                    case 3:
                        _b.sent();
                        return [2 /*return*/, true];
                    case 4:
                        error_14 = _b.sent();
                        (0, logger_1.logError)('Failed to toggle artifact favorite', error_14, { artifactId: artifactId });
                        return [2 /*return*/, false];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    return ArtifactService;
}());
exports.ArtifactService = ArtifactService;
/**
 * Analytics and Reporting Service
 */
var AnalyticsService = /** @class */ (function () {
    function AnalyticsService() {
    }
    /**
     * Get user usage statistics
     */
    AnalyticsService.getUserStats = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var result, user, error_15;
            var _a, _b, _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        if (!(0, exports.isInstantDBAvailable)())
                            return [2 /*return*/, null];
                        _f.label = 1;
                    case 1:
                        _f.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, instantDB.query({
                                users: {
                                    $: { where: { id: userId } },
                                    chat_sessions: {},
                                    authored_messages: {},
                                    created_artifacts: {},
                                    feedback_provided: {}
                                }
                            })];
                    case 2:
                        result = _f.sent();
                        user = (_a = result.users) === null || _a === void 0 ? void 0 : _a[0];
                        if (!user)
                            return [2 /*return*/, null];
                        return [2 /*return*/, {
                                total_sessions: ((_b = user.chat_sessions) === null || _b === void 0 ? void 0 : _b.length) || 0,
                                total_messages: ((_c = user.authored_messages) === null || _c === void 0 ? void 0 : _c.length) || 0,
                                total_artifacts: ((_d = user.created_artifacts) === null || _d === void 0 ? void 0 : _d.length) || 0,
                                feedback_count: ((_e = user.feedback_provided) === null || _e === void 0 ? void 0 : _e.length) || 0,
                                account_age_days: Math.floor((Date.now() - user.created_at) / (1000 * 60 * 60 * 24)),
                                last_active_days_ago: Math.floor((Date.now() - user.last_active) / (1000 * 60 * 60 * 24))
                            }];
                    case 3:
                        error_15 = _f.sent();
                        (0, logger_1.logError)('Failed to fetch user stats', error_15, { userId: userId });
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return AnalyticsService;
}());
exports.AnalyticsService = AnalyticsService;
/**
 * Profile Characteristics Service
 */
var ProfileCharacteristicsService = /** @class */ (function () {
    function ProfileCharacteristicsService() {
    }
    /**
     * Get characteristics for a user
     */
    ProfileCharacteristicsService.getCharacteristics = function (userId_1) {
        return __awaiter(this, arguments, void 0, function (userId, minCount) {
            var db_1, result, characteristics, error_16;
            if (minCount === void 0) { minCount = 0; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(0, exports.isInstantDBAvailable)())
                            return [2 /*return*/, []];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        db_1 = (0, exports.getInstantDB)();
                        return [4 /*yield*/, db_1.query({
                                profile_characteristics: {
                                    $: {
                                        where: { user_id: userId },
                                        order: { by: 'count', direction: 'desc' }
                                    }
                                }
                            })];
                    case 2:
                        result = _a.sent();
                        characteristics = result.profile_characteristics || [];
                        // Filter by minimum count if specified
                        if (minCount > 0) {
                            return [2 /*return*/, characteristics.filter(function (char) { return char.count >= minCount; })];
                        }
                        return [2 /*return*/, characteristics];
                    case 3:
                        error_16 = _a.sent();
                        (0, logger_1.logError)('Failed to fetch profile characteristics', error_16, { userId: userId });
                        return [2 /*return*/, []];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Add a manual characteristic (user input)
     */
    ProfileCharacteristicsService.addManualCharacteristic = function (userId, characteristic) {
        return __awaiter(this, void 0, void 0, function () {
            var db_2, charId, now, error_17;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(0, exports.isInstantDBAvailable)())
                            return [2 /*return*/, false];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        db_2 = (0, exports.getInstantDB)();
                        charId = db_2.id();
                        now = Date.now();
                        return [4 /*yield*/, db_2.transact([
                                db_2.tx.profile_characteristics[charId].update({
                                    user_id: userId,
                                    characteristic: characteristic,
                                    category: 'uncategorized',
                                    count: 1,
                                    manually_added: true,
                                    first_seen: now,
                                    last_seen: now,
                                    created_at: now,
                                    updated_at: now,
                                })
                            ])];
                    case 2:
                        _a.sent();
                        (0, logger_1.logInfo)('Manual characteristic added', { userId: userId, characteristic: characteristic });
                        return [2 /*return*/, true];
                    case 3:
                        error_17 = _a.sent();
                        (0, logger_1.logError)('Failed to add manual characteristic', error_17, { userId: userId, characteristic: characteristic });
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Increment characteristic count
     */
    ProfileCharacteristicsService.incrementCharacteristic = function (userId_1, characteristic_1) {
        return __awaiter(this, arguments, void 0, function (userId, characteristic, category) {
            var db_3, result, existing, now, charId, error_18;
            var _a;
            if (category === void 0) { category = 'uncategorized'; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(0, exports.isInstantDBAvailable)())
                            return [2 /*return*/, false];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 7, , 8]);
                        db_3 = (0, exports.getInstantDB)();
                        return [4 /*yield*/, db_3.query({
                                profile_characteristics: {
                                    $: {
                                        where: {
                                            user_id: userId,
                                            characteristic: characteristic
                                        }
                                    }
                                }
                            })];
                    case 2:
                        result = _b.sent();
                        existing = (_a = result.profile_characteristics) === null || _a === void 0 ? void 0 : _a[0];
                        now = Date.now();
                        if (!existing) return [3 /*break*/, 4];
                        // Increment existing characteristic
                        return [4 /*yield*/, db_3.transact([
                                db_3.tx.profile_characteristics[existing.id].update({
                                    count: existing.count + 1,
                                    last_seen: now,
                                    updated_at: now,
                                })
                            ])];
                    case 3:
                        // Increment existing characteristic
                        _b.sent();
                        return [3 /*break*/, 6];
                    case 4:
                        charId = db_3.id();
                        return [4 /*yield*/, db_3.transact([
                                db_3.tx.profile_characteristics[charId].update({
                                    user_id: userId,
                                    characteristic: characteristic,
                                    category: category,
                                    count: 1,
                                    manually_added: false,
                                    first_seen: now,
                                    last_seen: now,
                                    created_at: now,
                                    updated_at: now,
                                })
                            ])];
                    case 5:
                        _b.sent();
                        _b.label = 6;
                    case 6: return [2 /*return*/, true];
                    case 7:
                        error_18 = _b.sent();
                        (0, logger_1.logError)('Failed to increment characteristic', error_18, { userId: userId, characteristic: characteristic });
                        return [2 /*return*/, false];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    return ProfileCharacteristicsService;
}());
exports.ProfileCharacteristicsService = ProfileCharacteristicsService;
/**
 * File Storage Service
 * For uploading images and files to InstantDB permanent storage
 */
var FileStorageService = /** @class */ (function () {
    function FileStorageService() {
    }
    /**
     * Upload an image from a URL to InstantDB storage
     * Converts temporary DALL-E URLs to permanent storage URLs
     *
     * @param imageUrl - Temporary DALL-E image URL
     * @param filename - Filename for storage (e.g., 'image-123.png')
     * @returns Permanent InstantDB storage URL
     */
    FileStorageService.uploadImageFromUrl = function (imageUrl, filename) {
        return __awaiter(this, void 0, void 0, function () {
            var response, arrayBuffer, buffer, db_4, blob, file, uploadResult, error_19;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(0, exports.isInstantDBAvailable)()) {
                            throw new Error('InstantDB not available for file upload');
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        (0, logger_1.logInfo)('[FileStorage] Downloading image from URL', { imageUrl: imageUrl.substring(0, 60) + '...' });
                        return [4 /*yield*/, fetch(imageUrl)];
                    case 2:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Failed to download image: ".concat(response.statusText));
                        }
                        return [4 /*yield*/, response.arrayBuffer()];
                    case 3:
                        arrayBuffer = _a.sent();
                        buffer = Buffer.from(arrayBuffer);
                        (0, logger_1.logInfo)('[FileStorage] Image downloaded', { size: buffer.length });
                        db_4 = (0, exports.getInstantDB)();
                        blob = new Blob([buffer], { type: 'image/png' });
                        file = new File([blob], filename, { type: 'image/png' });
                        (0, logger_1.logInfo)('[FileStorage] Uploading to InstantDB storage', { filename: filename });
                        return [4 /*yield*/, db_4.storage.upload(filename, file)];
                    case 4:
                        uploadResult = _a.sent();
                        (0, logger_1.logInfo)('[FileStorage] Upload successful', {
                            filename: filename,
                            url: uploadResult.url.substring(0, 60) + '...'
                        });
                        return [2 /*return*/, uploadResult.url];
                    case 5:
                        error_19 = _a.sent();
                        (0, logger_1.logError)('[FileStorage] Upload failed', error_19);
                        // Fallback: Return original URL if upload fails
                        (0, logger_1.logInfo)('[FileStorage] Fallback to original URL');
                        return [2 /*return*/, imageUrl];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    return FileStorageService;
}());
exports.FileStorageService = FileStorageService;
/**
 * Export all services and utilities
 */
exports.InstantDBService = {
    initialize: exports.initializeInstantDB,
    isAvailable: exports.isInstantDBAvailable,
    ChatSession: ChatSessionService,
    Message: MessageService,
    User: UserService,
    Artifact: ArtifactService,
    Analytics: AnalyticsService,
    ProfileCharacteristics: ProfileCharacteristicsService,
    FileStorage: FileStorageService,
};
