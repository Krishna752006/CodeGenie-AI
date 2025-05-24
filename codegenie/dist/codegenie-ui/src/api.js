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
exports.fetchAICompletion = void 0;
const axios_1 = __importDefault(require("axios"));
function fetchAICompletion(prompt, isOnline, max_tokens = 1000) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const API_URL = isOnline
            ? "http://<rtx-4050-server-ip>:8000/generate"
            : "http://127.0.0.1:8000/generate";
        try {
            const response = yield axios_1.default.post(API_URL, { prompt, max_tokens });
            if (!((_a = response.data) === null || _a === void 0 ? void 0 : _a.response)) {
                throw new Error("Empty response from server");
            }
            return response.data.response.trim();
        }
        catch (error) {
            console.error("❌ API Error:", error);
            const errorMessage = isOnline
                ? "❌ Error: Failed to get response from the RTX server"
                : "❌ Error: Failed to get response from local AI backend";
            throw new Error(errorMessage);
        }
    });
}
exports.fetchAICompletion = fetchAICompletion;
