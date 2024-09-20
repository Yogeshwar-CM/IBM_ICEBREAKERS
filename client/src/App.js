import "./App.css";
import { Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Main from "./Main";
import EditorPage from "./components/EditorPage";
import { Toaster } from "react-hot-toast";

function App() {
  const originalConsoleError = console.error;

  console.error = (...args) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes(
        "ResizeObserver loop completed with undelivered notifications."
      )
    ) {
      return; // Ignore this specific warning
    }
    originalConsoleError(...args); // Call the original console.error for other errors
  };
  return (
    <>
      <div>
        <Toaster position="top-center"></Toaster>
      </div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/editor/:roomId" element={<EditorPage />} />
        <Route path="/main/:roomId" element={<Main />} />
      </Routes>
    </>
  );
}

export default App;
