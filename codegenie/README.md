# 🚀 CodeGenie - Setup & Running Guide

## 🧩 Backend Setup

Navigate to the `codegenie` directory and install the required backend dependencies using `pip`. This includes FastAPI, Uvicorn, Transformers, Torch, and other essential libraries for the AI model and API service.

```bash
cd codegenie
pip install -r requirements.txt
```

---

## 🌐 Frontend Dependency Installation

Navigate back to the `codegenie` directory and install all necessary frontend dependencies using `npm`. First, use `npm install` to fetch and set up the packages listed in `package.json`, then use `npm ci` to ensure a clean and consistent install based on the lock file.

```bash
cd codegenie
npm install
npm ci
```

---

## 🧠 Model Initialization

Navigate to the backend folder and run `main.py` to download and initialize the AI model. This script sets up the backend server using FastAPI and ensures the required model files are loaded and ready for inference.

```bash
cd backend
python main.py
```

 This step may take a few minutes during the first run as it downloads the model from Hugging Face.

---

## 🖥 CodeGenie UI Setup

Navigate to the `src` directory, then into the `codegenie-ui` directory and install the frontend dependencies. This UI is built with React and TypeScript, and you’ll need to run the following commands to ensure everything is properly installed and locked:

```bash
cd src/codegenie-ui
npm install
npm ci
```

---

## 🔥 Launch the CodeGenie UI

To verify that the CodeGenie UI is working correctly, run the development server using:

```bash
npm run start
```

This will start the React app and open it in your default browser (usually at `http://localhost:3000`). You should see the CodeGenie interface up and running! 🎉

 Make sure your backend (`main.py`) is also running for full functionality.
 `npm install` fetches the dependencies, and `npm ci` ensures consistency with the `package-lock.json`.

---

## 🔗 Connect the Backend

After setting up the frontend, fire up the FastAPI backend to handle prompt-to-code requests from CodeGenie:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

 The server started successfully at `http://0.0.0.0:8000`, and you’ll see real-time API requests being processed — a clear sign that CodeGenie is now communicating with the backend model.

 The `/generate` endpoint is actively handling requests coming from the React UI!

---

## 🚀 Keyboard Shortcuts

Boost your productivity with the following CodeGenie shortcuts:

| Command                             | Windows/Linux Shortcut | macOS Shortcut        | Description                                      |
|-------------------------------------|-------------------------|------------------------|--------------------------------------------------|
| **Generate Code**                   | `Ctrl+G Ctrl+C`         | `Cmd+G Cmd+C`          | Generate code using the provided prompt.         |
| **Generate from Last Comment**      | `Ctrl+Alt+,`            | `Cmd+Alt+,`            | Generate code based on the last code comment.    |
| **Trigger Inline Completion**       | `Ctrl+T Ctrl+I`         | `Cmd+T Cmd+I`          | Show inline code suggestions.                    |
| **Debug Selected Code**             | `Alt+S`                 | `Alt+S`                | Get AI-assisted debugging on selected code.      |
| **Enable CodeGenie**                | `Ctrl+Alt+E`            | `Cmd+Alt+E`            | Enable the CodeGenie extension.                  |
| **Disable CodeGenie**               | `Ctrl+Alt+D`            | `Cmd+Alt+D`            | Disable the CodeGenie extension.                 |

> 📝 **Note:** All shortcuts work when the editor is focused.
