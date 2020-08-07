// Setup basic express server
var express = require("express");
var path = require("path");
var config = require("./lib/config");

var app = express();

// Force redirect to HTTPS if the protocol was HTTP
if (!process.env.LOCAL) {
  app.use(enforce.HTTPS({ trustProtoHeader: true }));
}

var server = require("http").createServer(app);
var io = require("socket.io")(server);
var redis = require("socket.io-redis");
io.adapter(redis({ host: config.REDIS_ENDPOINT, port: 6379 }));

// Lower the heartbeat timeout (helps us expire disconnected people faster)
io.set("heartbeat timeout", config.HEARTBEAT_TIMEOUT);
io.set("heartbeat interval", config.HEARTBEAT_INTERVAL);

// Routing
app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
  socket.on("room-join", (room) => {
    socket.join(room);
    socket.emit("event", "Joined room " + room);
    socket.broadcast.to(room).emit("event", "Someone joined room " + room);
  });

  socket.on("event", (e) => {
    socket.broadcast.to(e.room).emit("event", e.name + " says hello!");
  });
});

module.exports = server;
