import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Chat from "./pages/Chat";
import { Provider } from "react-redux";
import appStore from "./store/appStore";
import { Toaster } from "react-hot-toast";

const App = () => {
  return (
    <Provider store={appStore}>
      <BrowserRouter>
        <Toaster />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="*" element={<Login />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
};
export default App;
