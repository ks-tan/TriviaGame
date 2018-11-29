const _ = require("lodash");
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.Server(app);
const io = socketIO(server);

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

  socket.on("onClientRegister", (data) => {
    socket.name = data.clientName;
    socket.emit("onNewQuestion", {triviaObject: triviaData[currentQuestionNumber]});
  });

  socket.on("onSubmitAnswer", (data) => {
    const answer = data.answer;
    let currentTriviaObject = triviaData[currentQuestionNumber];
    if (currentTriviaObject.answers === undefined) {
      currentTriviaObject.answers = [];
    }
    let triviaObjectAnswer = _.find(currentTriviaObject.answers, (o) => {return o.answer === answer});
    if (triviaObjectAnswer === undefined) {
      currentTriviaObject.answers.push({answer: answer, clients: [socket.name]});
    } else if (_.find(triviaObjectAnswer.clients, (s) => {return s === socket.name}) === undefined){
      triviaObjectAnswer.clients.push(socket.name);
    }
    io.sockets.emit("onAnswerSubmitted", {answers: currentTriviaObject.answers});
  });
});