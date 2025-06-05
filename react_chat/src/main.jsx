import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Chat from "./Chat";
import Login from "./Login";
import Register from "./Register";
import "./index.css"; // 🟢 Дуже важливо


function ProtectedRoute({ children }) {
  const [auth, setAuth] = React.useState(null);

  React.useEffect(() => {
    fetch("http://localhost:8000/api/check-auth/", {
      credentials: "include",
    }).then((res) => {
      setAuth(res.ok);
    });
  }, []);

  if (auth === null) return <div>Перевірка авторизації...</div>;
  return auth ? children : <Navigate to="/login" />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
