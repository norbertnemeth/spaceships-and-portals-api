const uuid = require('uuid/v4');
const main = require('../../lib');

class Games {
  constructor() {
    this.waitingPlayer = null;
    this.data = [];
  }

  newUser(user) {
    if (!this.waitingPlayer || this.waitingPlayer.socket.disconnected) {
      console.log('Waiting for other player!');
      this.waitingPlayer = user;
      return null;
    }
    const id = uuid();
    const game = { users: [], nextPlayer: 0, id };
    game.users.push(this.waitingPlayer, user);
    game.users.forEach(user => user.socket.join(id));
    this.data[id] = game;
    this.waitingPlayer = null;
    console.log('Game has begun!');
    main.io.to(id).emit('game-started', id);
    return id;
  }

  generateBattleField(id) {
    const table = this.fillEmpty(this.fillRocket(this.fillTeleport(new Array(36))));
    this.data[id].table = table;
    console.log(this.data[id]);
  }

  fillRocket(table, rocketNumber = 6) {
    const tableSize = table.length;
    for (let i = 1; i < rocketNumber; i++) {
      while (true) {
        const rocketPostion = Math.floor((Math.random() * tableSize));
        if (!table[rocketPostion]) {
          table[rocketPostion] = {
            type: 'ROCKET',
            id: `${rocketPostion}_ROCKET`,
            players: []
          };
          break;
        }
      }
    }
    return table;
  }

  fillTeleport(table, teleportNumber = 6) {
    const tableSize = table.length;
    for (let i = 1; i < teleportNumber; i++) {
      const teleportPostion = {};

      while (true) {
        const pos = Math.floor((Math.random() * tableSize));
        if (!table[pos]) {
          teleportPostion.first = pos;
          break;
        }
      }

      while (true) {
        const pos = Math.floor((Math.random() * tableSize));
        if (!table[pos] && pos !== teleportPostion.first) {
          teleportPostion.second = pos;
          break;
        }
      }
      table[teleportPostion.first] = {
        type: "TELEPORT",
        twinsPosition: teleportPostion.second,
        id: `${teleportPostion.first}_${teleportPostion.second}_TELEPORT`,
        players: []
      };
      table[teleportPostion.second] = {
        type: "TELEPORT",
        twinsPosition: teleportPostion.first,
        id: `${teleportPostion.first}_${teleportPostion.second}_TELEPORT`,
        players: []
      };
    }
    return table;
  }

  fillEmpty(table) {
    table[0] = { players: ['username?', 'object?'] };
    for (let i = 1; i < table.length; i++) {
      const item = table[i];
      table[i] = item ? item : { players: [] };
    }
    return table;
  }
}

module.exports = Games;
