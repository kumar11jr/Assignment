const WebSocket = require("ws");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const express = require("express");
const cors = require("cors");

const SECRET_KEY = "helllllllllllllllllllll";
const users = []; // Temporary storage for demo purposes

const app = express();
app.use(express.json());
app.use(cors());

const server = app.listen(1337, () => console.log("Strapi Backend Running on Port 1337"));
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === "auth") {
        const user = users.find((u) => u.username === data.username);
        if (user && bcrypt.compareSync(data.password, user.password)) {
          const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: "1h" });
          ws.send(JSON.stringify({ type: "auth_success", token }));
        } else {
          ws.send(JSON.stringify({ type: "auth_error", message: "Invalid credentials" }));
        }
      } else if (data.type === "message") {
        const timestamp = new Date().toISOString();
        ws.send(JSON.stringify({ type: "message", message: data.message, timestamp }));
      }
    } catch (error) {
      console.error("Error processing message", error);
    }
  });

  ws.on("close", () => console.log("Client disconnected"));
});

app.post("/auth/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }
  if (users.find((u) => u.username === username)) {
    return res.status(400).json({ message: "User already exists" });
  }
  const hashedPassword = bcrypt.hashSync(password, 10);
  users.push({ username, password: hashedPassword });
  res.json({ message: "User registered successfully" });
});

app.post("/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }
  const user = users.find((u) => u.username === username);
  if (user && bcrypt.compareSync(password, user.password)) {
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "1h" });
    return res.json({ token });
  }
  res.status(400).json({ message: "Invalid credentials" });
});
