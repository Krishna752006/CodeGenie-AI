"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.codegenieAPI = void 0;
const axios_1 = __importDefault(require("axios"));
const API_BASE = "http://127.0.0.1:8000"; // Single configuration point
const MAX_TOKENS = {
    REGULAR: 1000,
    LARGE: 4096,
    EXPLAIN: 2048
};
const ERROR_MESSAGES = {
    TOKEN_LIMIT: (max) => `Input exceeds maximum token limit (${max})`,
    API_FAILURE: "AI service unavailable - please try later",
    NETWORK: "Network error - check your connection"
};
// Token estimation helper
function estimateTokens(text) {
    return Math.ceil(text.length / 4);
}
// Central API client
exports.codegenieAPI = {
    generate: (prompt) => __awaiter(void 0, void 0, void 0, function* () {
        const tokens = estimateTokens(prompt);
        if (tokens > MAX_TOKENS.LARGE) {
            throw new Error(ERROR_MESSAGES.TOKEN_LIMIT(MAX_TOKENS.LARGE));
        }
        const endpoint = tokens > MAX_TOKENS.REGULAR ? "/generate-large" : "/generate";
        return apiRequest(endpoint, prompt, tokens > MAX_TOKENS.REGULAR ? MAX_TOKENS.LARGE : MAX_TOKENS.REGULAR);
    }),
    explain: (code) => __awaiter(void 0, void 0, void 0, function* () {
        const tokens = estimateTokens(code);
        if (tokens > MAX_TOKENS.EXPLAIN) {
            throw new Error(ERROR_MESSAGES.TOKEN_LIMIT(MAX_TOKENS.EXPLAIN));
        }
        return apiRequest("/explain", code, MAX_TOKENS.EXPLAIN);
    }),
    improve: (code) => __awaiter(void 0, void 0, void 0, function* () {
        const tokens = estimateTokens(code);
        if (tokens > MAX_TOKENS.LARGE) {
            throw new Error(ERROR_MESSAGES.TOKEN_LIMIT(MAX_TOKENS.LARGE));
        }
        return apiRequest("/improve", code, MAX_TOKENS.LARGE);
    }),
    debug: (code) => __awaiter(void 0, void 0, void 0, function* () {
        const tokens = estimateTokens(code);
        if (tokens > MAX_TOKENS.LARGE) {
            throw new Error(ERROR_MESSAGES.TOKEN_LIMIT(MAX_TOKENS.LARGE));
        }
        return apiRequest("/debug", code, MAX_TOKENS.LARGE);
    })
};
function apiRequest(endpoint, prompt, maxTokens) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.post(`${API_BASE}${endpoint}`, {
                prompt,
                max_tokens: maxTokens
            }, {
                timeout: 240000 // 4 min timeout
            });
            if (!((_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.response) === null || _b === void 0 ? void 0 : _b.trim())) {
                throw new Error("Empty response from server");
            }
            return response.data.response.trim();
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                if (error.code === "ECONNABORTED") {
                    throw new Error("Request timeout - try a smaller input");
                }
                if (((_c = error.response) === null || _c === void 0 ? void 0 : _c.status) === 413) {
                    throw new Error(ERROR_MESSAGES.TOKEN_LIMIT(MAX_TOKENS.LARGE));
                }
                throw new Error(ERROR_MESSAGES.API_FAILURE);
            }
            throw error instanceof Error ? error : new Error(ERROR_MESSAGES.NETWORK);
        }
    });
}
