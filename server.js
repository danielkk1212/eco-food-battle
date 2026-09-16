const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
app.use(express.static("public"));

const questions = [
  ["친환경 음식이란 무엇일까요?", ["환경을 생각하여 생산·유통·소비되는 음식","가격이 가장 비싼 음식","포장이 가장 화려한 음식","외국에서만 생산되는 음식"], 0],
  ["친환경 음식이 환경에 좋은 이유는 무엇일까요?", ["음식을 더 많이 버리게 하기 때문","환경 오염과 자원 낭비를 줄이는 데 도움이 되기 때문","음식의 가격을 무조건 올리기 때문","모든 음식을 냉동하기 때문"], 1],
  ["제철 식재료를 사용하는 것의 장점은 무엇일까요?", ["필요한 에너지와 자원 사용을 줄이는 데 도움이 된다","항상 수입해야 한다","음식물 쓰레기가 반드시 늘어난다","모든 식재료를 비싸게 만든다"], 0],
  ["지역에서 생산된 식재료를 먹으면 어떤 효과가 있을까요?", ["운송 거리를 줄여 환경 부담을 낮추는 데 도움이 된다","운송 거리가 반드시 길어진다","음식을 모두 수입하게 된다","음식물 쓰레기가 반드시 늘어난다"], 0],
  ["친환경 음식과 관련이 가장 적은 것은 무엇일까요?", ["제철 식재료 사용","지역 식재료 이용","음식물 쓰레기 줄이기","필요 이상으로 일회용품 사용하기"], 3],
  ["음식이 우리 식탁에 오기까지 발생하는 환경 문제와 관련 있는 것은 무엇일까요?", ["식재료의 생산과 운송 과정에서 발생하는 탄소 배출","책의 글자 크기","연필의 길이","교실의 칠판 크기"], 0],
  ["친환경 음식을 선택할 때 고려할 수 있는 것은 무엇일까요?", ["제철인지, 지역에서 생산되었는지 등을 살펴본다","포장지가 가장 큰 제품만 고른다","무조건 가장 비싼 음식을 고른다","음식을 많이 남길 수 있는지를 본다"], 0],
  ["음식물 쓰레기를 줄이는 방법으로 알맞은 것은 무엇일까요?", ["먹을 만큼만 덜어 먹는다","먹지 않을 음식도 많이 산다","남은 음식을 모두 버린다","음식을 필요 이상으로 만든다"], 0],
  ["친환경 음식의 소비가 늘어나면 기대할 수 있는 변화는 무엇일까요?", ["환경을 고려한 생산과 소비가 늘어날 수 있다","모든 음식이 사라진다","음식물 쓰레기가 반드시 늘어난다","자원이 무조건 더 많이 낭비된다"], 0],
  ["우리가 실천할 수 있는 친환경 식생활은 무엇일까요?", ["먹을 만큼만 구매하고 음식물 쓰레기를 줄인다","남길 것을 생각하지 않고 많이 산다","일회용품을 항상 많이 사용한다","제철 식재료를 일부러 피한다"], 0]
].map(([question, options, answer]) => ({question, options, answer}));

const rooms = new Map();

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code;
  do {
    code = Array.from({length: 6}, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  } while (rooms.has(code));
  return code;
}

function roomInfo(room) {
  return {
    players: room.players.map(p => ({id:p.id, name:p.name, score:p.score})),
    started: room.started
  };
}

function sendQuestion(code, room) {
  const q = questions[room.questionIndex];
  io.to(code).emit("question", {
    index: room.questionIndex,
    total: questions.length,
    question: q.question,
    options: q.options
  });
}

io.on("connection", socket => {
  socket.on("createRoom", name => {
    name = String(name || "").trim().slice(0,20);
    if (!name) return socket.emit("errorMessage","이름을 입력해주세요.");

    const code = makeCode();
    const room = {
      hostId: socket.id,
      players: [{id:socket.id, name, score:0, answered:false}],
      started: false,
      questionIndex: 0
    };

    rooms.set(code, room);
    socket.join(code);
    socket.data.roomCode = code;
    socket.emit("roomCreated", {code, isHost:true, info:roomInfo(room)});
  });

  socket.on("joinRoom", data => {
    const code = String(data?.code || "").trim().toUpperCase();
    const name = String(data?.name || "").trim().slice(0,20);
    const room = rooms.get(code);

    if (!name) return socket.emit("errorMessage","이름을 입력해주세요.");
    if (!room) return socket.emit("errorMessage","존재하지 않는 방입니다.");
    if (room.started) return socket.emit("errorMessage","이미 시작된 방입니다.");
    if (room.players.length >= 2) return socket.emit("errorMessage","방이 가득 찼습니다.");

    room.players.push({id:socket.id, name, score:0, answered:false});
    socket.join(code);
    socket.data.roomCode = code;
    io.to(code).emit("roomUpdated", roomInfo(room));
  });

  socket.on("startGame", () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.id) return;
    if (room.players.length !== 2) return socket.emit("errorMessage","두 명이 모두 들어온 뒤 시작해주세요.");

    room.started = true;
    room.questionIndex = 0;
    room.players.forEach(p => { p.score = 0; p.answered = false; });
    io.to(socket.data.roomCode).emit("gameStarted", {total:questions.length});
    sendQuestion(socket.data.roomCode, room);
  });

  socket.on("answer", answerIndex => {
    const code = socket.data.roomCode;
    const room = rooms.get(code);
    if (!room || !room.started) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player || player.answered) return;

    player.answered = true;
    if (Number(answerIndex) === questions[room.questionIndex].answer) player.score += 10;

    io.to(code).emit("scores", room.players.map(p => ({id:p.id,name:p.name,score:p.score})));

    if (room.players.every(p => p.answered)) {
      setTimeout(() => {
        const current = rooms.get(code);
        if (!current || !current.started) return;

        current.questionIndex++;
        if (current.questionIndex >= questions.length) {
          current.started = false;
          io.to(code).emit("gameOver", {
            results: current.players.map(p => ({id:p.id,name:p.name,score:p.score}))
          });
          return;
        }

        current.players.forEach(p => p.answered = false);
        sendQuestion(code, current);
      }, 700);
    }
  });

  socket.on("disconnect", () => {
    const code = socket.data.roomCode;
    const room = rooms.get(code);
    if (!room) return;

    room.players = room.players.filter(p => p.id !== socket.id);
    if (room.players.length === 0) {
      rooms.delete(code);
      return;
    }

    if (room.hostId === socket.id) room.hostId = room.players[0].id;
    room.started = false;
    io.to(code).emit("playerLeft");
    io.to(code).emit("roomUpdated", roomInfo(room));
  });
});

app.get("/health", (req,res) => res.json({ok:true, message:"eco-food-battle server is running"}));

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
