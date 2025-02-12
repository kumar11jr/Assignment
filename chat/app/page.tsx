"use client";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

interface Message {
  text: string;
  time: string;
}

const ChatApp = () => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [token, setToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [chat, setChat] = useState<Message[]>([]);
  const ws = useRef<WebSocket | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedToken = localStorage.getItem("token");
      if (savedToken) {
        setToken(savedToken);
      }

      // Load chat history from localStorage
      const savedChat = localStorage.getItem("chat");
      if (savedChat) {
        setChat(JSON.parse(savedChat));
      }
    }
  }, []);

  useEffect(() => {
    if (chat.length > 0) {
      localStorage.setItem("chat", JSON.stringify(chat));
    }
  }, [chat]);

  const handleRegister = async () => {
    try {
      await axios.post("http://13.203.190.62:1337/auth/register", { username, password });
      alert("User registered. Please log in.");
    } catch (error) {
      alert("Registration failed");
      console.log(error);
    }
  };

  const handleLogin = async () => {
    try {
      const response = await axios.post("http://13.203.190.62:1337/auth/login", { username, password });
      localStorage.setItem("token", response.data.token);
      setToken(response.data.token);
    } catch (error) {
      alert("Login failed");
      console.log(error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("chat"); // Clear chat history on logout
    setToken(null);
    setChat([]); // Reset chat state
    window.location.href = "/";
  };

  const clearChat = () => {
    localStorage.removeItem("chat");
    setChat([]);
  };

  useEffect(() => {
    if (token) {
      ws.current = new WebSocket("ws://13.203.190.62:1337");

      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "message") {
          const newMessage = { text: data.message, time: new Date(data.timestamp).toLocaleTimeString() };
          setChat((prevChat) => [...prevChat, newMessage]);
        }
      };

      return () => {
        ws.current?.close();
      };
    }
  }, [token]);

  const sendMessage = () => {
    if (ws.current && message) {
      ws.current.send(JSON.stringify({ type: "message", message }));
      setMessage("");
    }
  };

  if (!isMounted) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white px-6">
      {!token ? (
        <motion.div 
          className="p-8 bg-gray-800 rounded-2xl shadow-lg w-full max-w-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-2xl font-bold text-center mb-4">Authentication</h2>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 bg-gray-700 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 bg-gray-700 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <div className="flex justify-between">
            <motion.button
              onClick={handleRegister}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all"
              whileHover={{ scale: 1.05 }}
            >
              Register
            </motion.button>
            <motion.button
              onClick={handleLogin}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-all"
              whileHover={{ scale: 1.05 }}
            >
              Login
            </motion.button>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          className="p-6 bg-gray-800 rounded-2xl shadow-lg w-full max-w-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-2xl font-bold text-center mb-4">Chat</h2>
          <div className="border border-gray-600 p-4 w-full h-80 overflow-auto rounded-lg bg-gray-900 shadow-inner">
            {chat.map((msg, index) => (
              <motion.div 
                key={index}
                className="p-2 my-2 bg-gray-700 rounded-lg w-fit max-w-[80%] shadow-md"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <span className="text-sm text-gray-400">{msg.time}</span>
                <p className="text-lg">{msg.text}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-4 flex">
            <input
              type="text"
              placeholder="Type a message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <motion.button
              onClick={sendMessage}
              className="ml-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-all"
              whileHover={{ scale: 1.05 }}
            >
              Send
            </motion.button>
          </div>
          <div className="flex justify-between mt-4">
            <motion.button
              onClick={clearChat}
              className="w-[48%] px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-all"
              whileHover={{ scale: 1.05 }}
            >
              Clear Chat
            </motion.button>
            <motion.button
              onClick={handleLogout}
              className="w-[48%] px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-all"
              whileHover={{ scale: 1.05 }}
            >
              Logout
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Disable SSR to fix Next.js hydration issues
export default dynamic(() => Promise.resolve(ChatApp), { ssr: false });
