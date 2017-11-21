const Games = require('../src/games');
const User = require('../src/user');
const app = require('express')();
const server = require('http').Server(app);
export const io = require('socket.io')(server);

server.listen(4001); //TODO: Configból!
console.log('Server listeing on 4000 port!');

const games = new Games();

io.on('connection', socket => {
  console.log(`${socket.id} socket connected!`);
  socket.on('start', msg => {
    const user = new User(socket, msg);
    const id = games.newUser(user);
    if (id) games.generateBattleField();
  });
});
