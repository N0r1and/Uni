import React, { useState, useRef, useEffect } from "react";
import { Send, LogOut, Bot } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const chatEndRef = useRef(null);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await fetch("http://localhost:8000/api/logout/", {
      method: "POST",
      credentials: "include",
    });
    navigate("/login");
  };

  useEffect(() => {
    fetch("http://localhost:8000/api/user-info/", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setUsername(data.username || "");
        setEmail(data.email || "");
      });

    fetch("http://localhost:8000/api/history/", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.history && data.history.length > 0) {
          setMessages(data.history);
        } else {
          setMessages([
            {
              id: 0,
              role: "bot",
              content:
                "👋 Привіт! Я — бот, який допоможе вам знайти університет.\n\n📝 Напишіть свої бали ЗНО або НМТ у такому форматі:\n`Математика – 180, Українська мова – 190, Історія – 160`\n\nЯ одразу підберу для вас факультети та спеціальності 💡",
            },
          ]);
        }
      });
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = {
      id: Date.now(),
      role: "user",
      content: input,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/chat/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      if (data.bot_response) {
        const botMessage = {
          id: Date.now() + 1,
          role: "bot",
          content: data.bot_response,
        };
        setMessages((prev) => [...prev, botMessage]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "bot",
          content: "⚠️ Сервер не відповідає. Спробуйте пізніше.",
        },
      ]);
    }
    setLoading(false);
  };

  const renderMessageWithLinks = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) =>
      urlRegex.test(part) ? (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline break-words"
        >
          {part}
        </a>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Хедер */}
      <header className="sticky top-0 z-10 bg-white shadow-sm py-4 px-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Bot className="text-blue-600" size={24} />
          <h1 className="text-xl font-semibold text-gray-800">UniChat</h1>
        </div>
        <div className="relative">
          <div
            className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer"
            onClick={() => setMenuOpen(!menuOpen)}
            title="Профіль"
          >
            <span className="text-white font-medium">
              {username.charAt(0).toUpperCase() || "👤"}
            </span>
          </div>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-md border z-50">
              <div className="px-4 py-2 text-sm text-gray-800 font-semibold">
                👤 {username}
              </div>
              <div className="px-4 py-2 text-sm text-gray-600">{email}</div>
              <div className="border-t my-1" />
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                Вийти
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Чат */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={msg.id || i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] md:max-w-[60%] p-3 rounded-lg whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-gray-200 text-gray-800 rounded-bl-none"
              }`}
            >
              {renderMessageWithLinks(msg.content)}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-800 p-3 rounded-lg rounded-bl-none">
              Друкує...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Ввід */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="sticky bottom-0 bg-white border-t p-4 z-10"
      >
        <div className="max-w-4xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Напишіть повідомлення..."
            className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}