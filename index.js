const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.Server(app);
const io = socketIO(server);

server.listen(5000, function () {
  console.log("Server started on port 5000");
})

app.get('/', function(req, res) {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", function(socket) {
  const serverMessage = {message: "PING"}
  let count = 11;
  socket.emit("server-ping", serverMessage)
  socket.on("client-pong", (data) => {
    console.log(data.message)
    if (count > 0) {
      socket.emit("server-ping", serverMessage)
      count --
    }
  })
});