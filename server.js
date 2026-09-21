const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

const rooms = new Map();
const questions = [
  ["탄소발자국이란 무엇을 나타내는 말일까요?", ["토양의 색깔", "발자국의 크기", "음식의 무게", "활동이나 제품에서 발생하는 온실가스 배출량"], 3],

  ["식품의 생산과 운송에서 주로 문제가 되는 온실가스는 무엇일까요?", ["헬륨", "이산화탄소 등 온실가스", "산소만", "수증기만"], 1],

  ["로컬푸드란 일반적으로 무엇을 뜻할까요?", ["지역에서 생산되어 가까운 곳에서 소비되는 식품", "외국에서만 생산되는 식품", "오래 보관한 식품", "포장만 친환경인 식품"], 0],

  ["로컬푸드를 선택하면 줄이는 데 도움이 될 수 있는 것은 무엇일까요?", ["모든 농업 활동", "식재료의 종류", "음식의 영양소", "장거리 운송에 필요한 환경 부담"], 3],

  ["제철 과일을 고르는 이유로 알맞은 것은?", ["포장지가 더 크기 때문이다", "자연적인 재배 시기에 맞춰 생산할 수 있기 때문이다", "무조건 가격이 비싸기 때문이다", "항상 비행기로 운송되기 때문이다"], 1],

  ["친환경 농업에서 중요하게 생각할 수 있는 것은?", ["토양과 생태계를 고려하는 농업", "쓰레기를 무조건 많이 만드는 것", "물을 낭비하는 것", "농지를 모두 포장하는 것"], 0],

  ["농업에서 물을 아껴 사용하는 이유는?", ["농작물을 모두 없애기 위해", "소중한 수자원을 효율적으로 이용하기 위해", "식품의 포장을 늘리기 위해", "운송 거리를 늘리기 위해"], 1],

  ["다음 중 물 절약에 도움이 되는 행동은?", ["물을 계속 틀어 놓기", "필요한 만큼만 물을 사용하기", "사용하지 않는 수도를 켜 두기", "음식물을 물에 계속 흘려보내기"], 1],

  ["친환경 식생활에서 '필요한 만큼 구매하기'가 중요한 이유는?", ["남는 음식과 자원 낭비를 줄이는 데 도움이 되기 때문", "포장 쓰레기를 반드시 늘리기 때문", "음식을 더 많이 버리기 때문", "운송 거리를 늘리기 때문"], 0],

  ["냉장고 속 식재료를 먼저 확인하면 어떤 점이 좋을까요?", ["음식을 더 많이 버리게 된다", "이미 가진 식재료를 활용해 불필요한 구매를 줄일 수 있다", "포장을 더 많이 하게 된다", "식재료가 모두 상하게 된다"], 1],

  ["남은 음식을 활용하는 방법으로 알맞은 것은?", ["무조건 바로 버리기", "상태가 괜찮다면 다른 요리에 활용하기", "포장만 늘리기", "필요 이상으로 다시 만들기"], 1],

  ["식품을 보관할 때 음식물 쓰레기를 줄이는 데 도움이 되는 행동은?", ["냉장고 문을 계속 열어 두기", "모든 식품을 아무렇게나 두기", "식재료에 맞는 방법으로 적절히 보관하기", "먹을 수 있는 음식도 버리기"], 2],

  ["식품의 유통기한이나 소비기한을 확인하는 습관이 도움이 되는 이유는?", ["포장재를 늘리기 때문", "음식을 더 많이 남기기 때문", "식품을 안전하고 계획적으로 소비하는 데 도움이 되기 때문", "운송 거리를 늘리기 때문"], 2],

  ["채소의 잎이나 줄기 등 먹을 수 있는 부분을 활용하면?", ["버려지는 식재료를 줄일 수 있다", "포장 쓰레기가 반드시 늘어난다", "물을 더 많이 낭비한다", "음식물 쓰레기가 반드시 늘어난다"], 0],

  ["식생활에서 자원을 절약하는 방법으로 알맞은 것은?", ["먹을 만큼 조리하고 남은 음식은 알맞게 보관하기", "먹을 수 있는 음식까지 버리기", "일회용품을 계속 사용하기", "필요 이상으로 조리하기"], 0],

  ["식물성 식품을 선택하는 것이 친환경 식생활과 관련될 수 있는 이유는?", ["모든 식물성 식품은 환경 영향을 전혀 주지 않기 때문", "식물성 식품은 항상 지역에서만 생산되기 때문", "식품 종류와 생산 방식에 따라 환경 영향이 달라질 수 있기 때문", "식물은 운송이 필요 없기 때문"], 2],

  ["친환경 식생활에서 중요한 태도는 무엇일까요?", ["한 번 실천하고 다시 하지 않기", "환경 영향을 생각하면서 지속적으로 실천하기", "필요 없는 음식을 많이 구매하기", "쓰레기를 줄이는 행동을 피하기"], 1],

  ["환경을 생각한 식품 선택을 할 때 가장 적절한 태도는?", ["가격만 보고 환경 영향을 판단하기", "여러 정보를 살펴보고 상황에 맞게 선택하기", "포장 색깔만 보고 결정하기", "광고 문구만 보고 결정하기"], 1],

  ["식품의 이동 거리가 길어지면 일반적으로 어떤 과정이 더 필요할 수 있을까요?", ["농작물의 성장 과정이 사라진다", "운송 과정", "음식의 조리 과정이 항상 사라진다", "포장 과정이 반드시 없어지는 것이다"], 1],

  ["지역 농산물을 이용할 때 기대할 수 있는 또 다른 장점은?", ["농업이 필요 없어지는 것이다", "모든 식품 생산이 중단된다", "지역 농가와 지역 경제를 지원하는 데 도움이 될 수 있다", "음식의 종류가 반드시 하나로 줄어든다"], 2],

  ["친환경 식생활을 실천할 때 가장 현실적인 방법은?", ["모든 음식을 한꺼번에 바꾸기", "일상에서 실천할 수 있는 작은 행동부터 꾸준히 하기", "아무것도 하지 않기", "먹지 않는 것만 선택하기"], 1],

  ["다음 중 지속가능한 식생활과 가장 가까운 행동은?", ["물을 필요 이상으로 사용하기", "음식을 최대한 많이 버리기", "자원과 환경을 생각하며 음식물을 적절히 소비하기", "필요 없는 포장을 계속 사용하기"], 2],

  ["음식을 소중히 여기는 행동으로 알맞은 것은?", ["필요 이상으로 구매하기", "남은 음식을 관리하지 않기", "식재료를 계획적으로 구매하고 남김을 줄이기", "먹을 수 있는 음식 버리기"], 2],

  ["친환경 식생활의 목표를 가장 잘 나타낸 것은?", ["환경과 자원을 생각하면서 건강하고 지속가능하게 먹는 것", "포장지를 많이 사용하는 것", "모든 음식을 수입하는 것", "무조건 비싼 음식만 먹는 것"], 0],

  ["우리가 친환경 식생활을 실천해야 하는 이유로 가장 알맞은 것은?", ["쓰레기를 더 많이 만들기 위해", "현재와 미래의 환경과 자원을 함께 생각하기 위해", "음식을 더 많이 남기기 위해", "불필요한 소비를 늘리기 위해"], 1]
];
function code() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

io.on("connection", socket => {
  socket.on("createRoom", name => {
    let c = code();
    while (rooms.has(c)) c = code();

    rooms.set(c, {
      players: [{ id: socket.id, name: name || "플레이어1", score: 0 }],
      question: 0,
      answers: {},
      started: false
    });

    socket.join(c);
    socket.data.room = c;
    socket.emit("roomCreated", { code: c, host: true, name: name || "플레이어1" });
  });

  socket.on("joinRoom", ({ code, name }) => {
    code = String(code || "").trim().toUpperCase();
    const r = rooms.get(code);

    if (!r) {
      socket.emit("joinError", { message: "방이 없거나 이미 종료되었습니다." });
      return;
    }

    if (r.players.length >= 2) {
      socket.emit("joinError", { message: "방이 이미 가득 찼습니다." });
      return;
    }

    if (r.started) {
      socket.emit("joinError", { message: "이미 게임이 시작된 방입니다." });
      return;
    }

    r.players.push({ id: socket.id, name: name || "플레이어2", score: 0 });
    socket.join(code);
    socket.data.room = code;

    io.to(code).emit("roomReady", {
      players: r.players.map(p => p.name)
    });
  });

  socket.on("startGame", () => {
    const r = rooms.get(socket.data.room);
    if (!r || r.players[0].id !== socket.id || r.players.length < 2) return;

    r.started = true;
    r.question = 0;
    r.answers = {};

    io.to(socket.data.room).emit("gameStart", { questions });
  });

  socket.on("answer", choice => {
    const room = socket.data.room;
    const r = rooms.get(room);
    if (!r || !r.started) return;
    if (r.answers[socket.id] != null) return;

    const q = questions[r.question];
    r.answers[socket.id] = choice;

    if (choice === q[2]) {
      const player = r.players.find(p => p.id === socket.id);
      if (player) player.score++;
    }

    io.to(room).emit("scoreUpdate", {
      scores: r.players.map(p => ({ name: p.name, score: p.score }))
    });

    if (Object.keys(r.answers).length === 2) {
      setTimeout(() => {
        const currentRoom = rooms.get(room);
        if (!currentRoom) return;

        currentRoom.question++;
        currentRoom.answers = {};

        if (currentRoom.question >= questions.length) {
          io.to(room).emit("gameOver", {
            players: currentRoom.players.map(p => ({
              name: p.name,
              score: p.score
            }))
          });
          rooms.delete(room);
        } else {
          io.to(room).emit("nextQuestion", {
            index: currentRoom.question
          });
        }
      }, 700);
    }
  });

  socket.on("disconnect", () => {
    const c = socket.data.room;
    const r = rooms.get(c);
    if (!r) return;

    r.players = r.players.filter(p => p.id !== socket.id);

    if (r.players.length === 0) {
      rooms.delete(c);
    } else {
      io.to(c).emit("opponentLeft");
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
