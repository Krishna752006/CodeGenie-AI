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
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const api_1 = require("./api");
require("./styles.css");
const io5_1 = require("react-icons/io5");
const hi_1 = require("react-icons/hi");
const bs_1 = require("react-icons/bs");
const bs_2 = require("react-icons/bs");
const lu_1 = require("react-icons/lu");
const react_syntax_highlighter_1 = require("react-syntax-highlighter");
const prism_1 = require("react-syntax-highlighter/dist/esm/styles/prism");
const ChatBox = () => {
    const [messages, setMessages] = (0, react_1.useState)([]);
    const [input, setInput] = (0, react_1.useState)("");
    const [isTyping, setIsTyping] = (0, react_1.useState)(false);
    const [isOnline, setIsOnline] = (0, react_1.useState)(false);
    const chatRef = (0, react_1.useRef)(null);
    const textareaRef = (0, react_1.useRef)(null);
    const fileInputRef = (0, react_1.useRef)(null);
    function extractCodeBlocks(text) {
        const codeRegex = /```(?:[\w]*)?\n([\s\S]*?)```/g;
        let match;
        const codeBlocks = [];
        while ((match = codeRegex.exec(text)) !== null) {
            codeBlocks.push(match[1].trim());
        }
        return codeBlocks;
    }
    function removeCodeBlocks(text) {
        return text.replace(/```(?:[\w]*)?\n[\s\S]*?```/g, "").trim();
    }
    const renderMessage = (msg) => {
        if (msg.sender === "bot") {
            const codeBlocks = extractCodeBlocks(msg.text);
            const displayText = removeCodeBlocks(msg.text);
            return ((0, jsx_runtime_1.jsxs)("div", Object.assign({ className: "bot-message" }, { children: [displayText && (0, jsx_runtime_1.jsx)("pre", { children: displayText }), codeBlocks.map((code, idx) => ((0, jsx_runtime_1.jsxs)("div", Object.assign({ className: "code-block" }, { children: [(0, jsx_runtime_1.jsx)(react_syntax_highlighter_1.Prism, Object.assign({ language: "tsx", style: prism_1.darcula, wrapLongLines: true, customStyle: { whiteSpace: "pre-wrap", wordBreak: "break-word" } }, { children: code })), (0, jsx_runtime_1.jsxs)("div", Object.assign({ className: "code-actions" }, { children: [(0, jsx_runtime_1.jsx)("button", Object.assign({ onClick: () => navigator.clipboard.writeText(code) }, { children: (0, jsx_runtime_1.jsx)(bs_2.BsCopy, { size: 15 }) })), (0, jsx_runtime_1.jsx)("button", Object.assign({ onClick: () => {
                                            var _a, _b;
                                            const vscode = (_b = (_a = window).acquireVsCodeApi) === null || _b === void 0 ? void 0 : _b.call(_a);
                                            if (vscode) {
                                                vscode.postMessage({ type: "insertCode", code });
                                            }
                                        } }, { children: (0, jsx_runtime_1.jsx)(lu_1.LuFileCode2, { size: 15 }) }))] }))] }), idx)))] })));
        }
        return (0, jsx_runtime_1.jsx)("pre", Object.assign({ className: "user-message" }, { children: msg.text }));
    };
    const scrollToBottom = () => {
        if (chatRef.current) {
            chatRef.current.scrollTo({
                top: chatRef.current.scrollHeight,
                behavior: "smooth",
            });
        }
    };
    (0, react_1.useEffect)(() => {
        scrollToBottom();
    }, [messages, isTyping]);
    (0, react_1.useEffect)(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            const scrollHeight = textarea.scrollHeight;
            const maxHeight = 120;
            const minHeight = 40;
            if (scrollHeight > minHeight) {
                textarea.style.height = Math.min(scrollHeight, maxHeight) + "px";
                textarea.style.overflowY = scrollHeight > maxHeight ? "auto" : "hidden";
            }
            else {
                textarea.style.height = minHeight + "px";
                textarea.style.overflowY = "hidden";
            }
        }
    }, [input]);
    const sendMessage = () => __awaiter(void 0, void 0, void 0, function* () {
        if (!input.trim())
            return;
        const prompt = input.trim();
        setMessages((prev) => [...prev, { text: prompt, sender: "user" }]);
        setInput("");
        setIsTyping(true);
        try {
            const aiResponse = yield (0, api_1.fetchAICompletion)(prompt, isOnline);
            setMessages((prev) => [...prev, { text: aiResponse, sender: "bot" }]);
        }
        catch (error) {
            setMessages((prev) => [...prev, { text: error.message, sender: "bot" }]);
        }
        finally {
            setIsTyping(false);
        }
    });
    const handleFileUpload = (e) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const file = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0];
        if (!file)
            return;
        const reader = new FileReader();
        reader.onload = () => __awaiter(void 0, void 0, void 0, function* () {
            const fileContent = reader.result;
            setMessages((prev) => [
                ...prev,
                { text: `📎 Attached: ${file.name}\n`, sender: "user" },
            ]);
            const prompt = `User uploaded file: ${file.name}\n\n${fileContent}`;
            setIsTyping(true);
            try {
                const aiResponse = yield (0, api_1.fetchAICompletion)(prompt, isOnline);
                setMessages((prev) => [...prev, { text: aiResponse, sender: "bot" }]);
            }
            catch (error) {
                setMessages((prev) => [...prev, { text: error.message, sender: "bot" }]);
            }
            finally {
                setIsTyping(false);
            }
        });
        reader.readAsText(file);
    });
    return ((0, jsx_runtime_1.jsxs)("div", Object.assign({ className: "chatbox-container" }, { children: [(0, jsx_runtime_1.jsxs)("div", Object.assign({ className: "chatbox-history", ref: chatRef }, { children: [messages.map((msg, index) => ((0, jsx_runtime_1.jsx)("div", Object.assign({ className: `message-bubble ${msg.sender === "user" ? "user-bubble" : "bot-bubble"}` }, { children: renderMessage(msg) }), index))), isTyping && (0, jsx_runtime_1.jsx)("div", Object.assign({ className: "typing-indicator" }, { children: "CodeGenie is typing..." }))] })), (0, jsx_runtime_1.jsxs)("div", Object.assign({ className: "chatbox-input-area" }, { children: [(0, jsx_runtime_1.jsx)("button", Object.assign({ className: "action-button", onClick: () => { var _a; return (_a = fileInputRef.current) === null || _a === void 0 ? void 0 : _a.click(); }, title: "Attachments" }, { children: (0, jsx_runtime_1.jsx)(io5_1.IoAddCircleOutline, { size: 20 }) })), (0, jsx_runtime_1.jsx)("input", { type: "file", ref: fileInputRef, style: { display: "none" }, onChange: handleFileUpload }), (0, jsx_runtime_1.jsx)("button", Object.assign({ className: "action-button", onClick: () => setIsOnline((prev) => !prev), title: isOnline ? "RTX Mode (Remote)" : "Local Mode (on device)" }, { children: isOnline ? (0, jsx_runtime_1.jsx)(bs_1.BsPciCard, { size: 20 }) : (0, jsx_runtime_1.jsx)(hi_1.HiDesktopComputer, { size: 20 }) })), (0, jsx_runtime_1.jsx)("textarea", { ref: textareaRef, className: "chatbox-input", placeholder: "Type your task here", value: input, onChange: (e) => setInput(e.target.value), onKeyDown: (e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                                const target = e.target;
                                setTimeout(() => {
                                    target.style.height = "40px";
                                    target.scrollTop = 0;
                                }, 0);
                            }
                        } }), (0, jsx_runtime_1.jsx)("button", Object.assign({ className: "send-button", onClick: sendMessage }, { children: (0, jsx_runtime_1.jsx)(io5_1.IoSendOutline, { size: 20 }) }))] }))] })));
};
exports.default = ChatBox;
