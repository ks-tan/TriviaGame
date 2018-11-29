const _ = require("lodash");
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.Server(app);
const io = socketIO(server);

let clientsData = [];
let currentQuestionNumber = 0;
const triviaData = [
  { q: "What is KS's favourite food?", a: "French Fries" }, 
  { q: "What is Lois's new favourite game?", a: "Smash Bros" }
];

server.listen(5000, function () {
  console.log("Server started on port 5000");
})

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.get("/admin", function(req, res) {
  res.sendFile(__dirname + "/admin.html");
});

io.on("connection", function(socket) {
  const serverMessage = {message: "Welcome to Trivia Game!"};
  socket.emit("onConnection", serverMessage);

  socket.on("disconnect", () => {
    _.remove(clientsData, (data) => {return data.socketId === socket.id;});
  });

  socket.on("onClientRegister", (data) => {
    //Only update `clientsData` if the client's `sockedId` is already recorded
    if (_.find(clientsData, (client) => {return client.socketId === socket.id}) === undefined) { 
      clientsData.push({socketId: socket.id, name: data.clientName});
      socket.emit("onNewQuestion", {triviaObject: triviaData[currentQuestionNumber]});
    }
  })
});