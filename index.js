const _ = require("lodash");
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.Server(app);
const io = socketIO(server);

let currentQuestionNumber = 0;
let triviaData = [
  { q: "What is KS's favourite food?", a: "French Fries" }, 
  { q: "What is Lois's new favourite game?", a: "Smash Bros" }
];
let points = [];

server.listen(process.env.PORT || 5000, function () {
  console.log("Server started on port 5000");
})

app.use(express.static(__dirname + '/public'));

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.get("/display", function(req, res) {
  res.sendFile(__dirname + "/display.html");
});

app.get("/admin", function(req, res) {
  res.sendFile(__dirname + "/admin.html");
});

io.on("connection", function(socket) {
  const serverMessage = {message: "Welcome to Antioch CG Gathering!"};
  socket.emit("onConnection", serverMessage);

  socket.on("onClientRegister", (data) => {
    socket.name = data.clientName;
    if (data.clientName === "admin") {
      socket.emit("onUpdateAdmin", {triviaData: triviaData, currentQuestionNumber: currentQuestionNumber});
    } else {
      socket.emit("onNewQuestion", {triviaObject: triviaData[currentQuestionNumber]});
      if (data.clientName === "display") {
        socket.emit("onUpdatePoints", {points: points});
      }
    }
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
    io.sockets.emit("onUpdateAdmin", {triviaData: triviaData, currentQuestionNumber: currentQuestionNumber});
  });

  socket.on("onChangeQuestionNumber", (data) => {
    currentQuestionNumber = data.questionNumber;
    io.sockets.emit("onNewQuestion", {triviaObject: triviaData[currentQuestionNumber]});
    socket.emit("onUpdateAdmin", {triviaData: triviaData, currentQuestionNumber: currentQuestionNumber});
  });

  socket.on("onSelectAnswer", (data) => {
    const clientList = _.find(triviaData[currentQuestionNumber].answers, (o) => {return o.answer === data.answer}).clients;
    for (let i = 0; i < clientList.length; i++) {
      const newPoint = i === 0 ? 2 : 1;
      const currName = clientList[i];
      let pointData = _.find(points, (o) => {return o.name === currName});
      if (pointData === undefined) {
        points.push({name: currName, point: newPoint});
      } else {
        pointData.point += newPoint;
      }
    }
    io.sockets.emit("onUpdatePoints", {points: points});
    io.sockets.emit("onShowAnswer", {answer: triviaData[currentQuestionNumber].a});
  });

  socket.on("onRevealAnswer", ()=> {
    io.sockets.emit("onShowAnswer", {answer: triviaData[currentQuestionNumber].a});
  });

  socket.on("onClearData", () => {
    points = [];
    currentQuestionNumber = 0;
    for (let i = 0; i < triviaData.length; i++) {
      triviaData[i].answers = [];
    }
    io.sockets.emit("onUpdateAdmin", {triviaData: triviaData, currentQuestionNumber: currentQuestionNumber});
    io.sockets.emit("onNewQuestion", {triviaObject: triviaData[currentQuestionNumber]});
    io.sockets.emit("onUpdatePoints", {points: points});
  });

  socket.on("onEndGame", () => {
    io.sockets.emit("onGameEnded", {points: points});
  });
});