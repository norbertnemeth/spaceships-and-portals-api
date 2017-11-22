const uuid = require('uuid/v4');
const main = require('../../lib');

const characters = ['player1', 'player2'];

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
    if (this.waitingPlayer.socketId === user.socketId) {
      return null;
    }
    const id = uuid();
    const game = { users: [], nextPlayer: this.waitingPlayer.socketId, id };
    game.users.push({ ...this.waitingPlayer, character: characters[0] }, { ...user, character: characters[1] });
    game.users.forEach(user => user.socket.join(id));
    this.data[id] = game;
    this.waitingPlayer = null;
    console.log('Game has begun!');
    main.io.to(id).emit('game-started', id);
    return id;
  }

  generateBattleField(id) {
    this.data[id].tableSize = { row: 6, column: 8, total: 48 };
    const table = this.fillEmpty(this.fillRocket(this.fillTeleport(new Array(this.data[id].tableSize.total))));
    this.data[id].table = table;
    main.io.to(id).emit('table-generate-success', { table: this.data[id].table, tableSize: this.data[id].tableSize });
  }

  fillRocket(table, rocketNumber = 3) {
    const tableSize = table.length;
    for (let i = 1; i < rocketNumber; i++) {
      while (true) {
        const rocketPostion = Math.floor(Math.random() * tableSize);
        if (!table[rocketPostion]) {
          table[rocketPostion] = {
            type: 'ROCKET',
            id: `${rocketPostion}_ROCKET`
          };
          break;
        }
      }
    }
    return table;
  }

  fillTeleport(table, teleportNumber = 4) {
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
        id: `${teleportPostion.first}_${teleportPostion.second}_TELEPORT`
      };
      table[teleportPostion.second] = {
        type: "TELEPORT",
        twinsPosition: teleportPostion.first,
        id: `${teleportPostion.first}_${teleportPostion.second}_TELEPORT`
      };
    }
    return table;
  }

  fillEmpty(table) {
    table[0] = { characters, index: 0 };
    for (let index = 1; index < table.length; index++) {
      const item = table[index];
      table[index] = item ? Object.assign(item, { index }) : { index };
    }
    return table;
  }
}

module.exports = Games;
