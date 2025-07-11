// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // در حالت واقعی بهتره دامنه‌ی خاص بدی
    methods: ["GET", "POST"]
  }
});
app.use(express.static('public'));


const users = new Map();

io.on("connection", (socket) => {
  console.log("New user connected: " + socket.id);

  socket.on("join-room", ({ roomId, username }) => {
    socket.join(roomId);
    users.set(socket.id, { roomId, username });
    socket.to(roomId).emit("user-joined", { socketId: socket.id, username });
  });

  socket.on("send-signal", ({ signalData, to }) => {
    io.to(to).emit("receive-signal", {
      from: socket.id,
      signalData,
    });
  });

  socket.on("return-signal", ({ signalData, to }) => {
    io.to(to).emit("received-returned-signal", {
      from: socket.id,
      signalData,
    });
  });

  socket.on("disconnect", () => {
    const user = users.get(socket.id);
    if (user) {
      socket.to(user.roomId).emit("user-disconnected", socket.id);
      users.delete(socket.id);
    }
    console.log("User disconnected: " + socket.id);
  });
});

server.listen(5000, () => {
  console.log("Server listening on port 5000");
});