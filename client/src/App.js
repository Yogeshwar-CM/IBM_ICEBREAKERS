import "./App.css";
import { Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Main from "./Main";
import EditorPage from "./components/EditorPage";
import { Toaster } from "react-hot-toast";

function App() {
  const consoleError = console.error;
  console.error = (...args) => {
    if (
      args[0] &&
      args[0].includes(
        "ResizeObserver loop completed with undelivered notifications."
      )
    ) {
      return;
    }
    consoleError(...args);
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
