const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const mongoose = require("mongoose");

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors());

// Enhanced Connection with Success/Error logs
mongoose.connect("mongodb://127.0.0.1:27017/chatApp")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

const MessageSchema = new mongoose.Schema({
  room: String,
  author: String,
  message: String,
  image: String, 
  time: String,
});
const Message = mongoose.model("Message", MessageSchema);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] },
  maxHttpBufferSize: 1e7 // Supports high-res images up to 10MB
});

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join_room", async (room) => {
    socket.join(room);
    const history = await Message.find({ room }).limit(50).sort({ _id: 1 });
    socket.emit("load_history", history);
  });

  socket.on("send_message", async (data) => {
    const newMessage = new Message(data);
    await newMessage.save();
    socket.to(data.room).emit("receive_message", data);
  });

  // 🚀 ADDED: Clear Chat Listener
  socket.on("clear_chat", async (room) => {
    await Message.deleteMany({ room });
    io.in(room).emit("chat_cleared"); // Notify everyone in the room to empty their UI
    console.log(`🧹 Chat cleared for room: ${room}`);
  });

  socket.on("typing", (data) => {
    socket.to(data.room).emit("display_typing", data);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

server.listen(3001, () => console.log("🚀 SERVER ON 3001"));