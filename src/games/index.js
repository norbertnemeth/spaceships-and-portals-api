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
    game.users.push(this.waitingPlayer, user);
    game.users.forEach((user, idx) => {
      user.socket.join(id);
      user.setCharacter(characters[idx]);
    });
    this.data[id] = game;
    this.waitingPlayer = null;
    console.log('Game has begun!');
    game.users.forEach(user => user.socket.emit('game-started', { gameId: id, ownId: user.socketId }));
    return id;
  }

  generateBattleField(id) {
    this.data[id].tableSize = { row: 6, column: 8, total: 48 };
    const table = this.fillEmpty(this.fillSpaceship(this.fillPortals(new Array(this.data[id].tableSize.total))));
    this.data[id].table = table;
    main.io.to(id).emit('table-generate-success', {
      table: this.data[id].table,
      tableSize: this.data[id].tableSize,
      playerPositionsWithData: this.data[id].users.map(user => user.getCharacterAndPosition()),
      youTurn: this.data[id].users[Math.floor(Math.random() * 2)].socketId
    });
  }

  fillSpaceship(table, spaceship = 3) {
    const tableSize = table.length;
    for (let i = 0; i < spaceship; i++) {
      while (true) {
        const spaceshipPostion = Math.floor(Math.random() * tableSize);
        if (!table[spaceshipPostion] && spaceshipPostion > 0 && spaceshipPostion + 3 < tableSize) {
          table[spaceshipPostion] = {
            type: 'spaceship',
            id: `${spaceshipPostion}_spaceship`,
            value: `spaceship${i + 1}`
          };
          break;
        }
      }
    }
    return table;
  }

  fillPortals(table, portalNumber = 5) {
    const tableSize = table.length;
    for (let i = 0; i < portalNumber; i++) {
      const portalPostion = {};

      while (true) {
        const pos = Math.floor((Math.random() * tableSize));
        if (!table[pos] && pos > 0 && pos + 3 < tableSize) {
          portalPostion.first = pos;
          break;
        }
      }

      while (true) {
        const pos = Math.floor((Math.random() * tableSize));
        if (!table[pos] && pos !== portalPostion.first && pos > 0 && pos + 3 < tableSize) {
          portalPostion.second = pos;
          break;
        }
      }
      table[portalPostion.first] = {
        type: "portal",
        twinsPosition: portalPostion.second,
        id: `${portalPostion.first}_${portalPostion.second}_portal`,
        value: `portal${i + 1}`
      };
      table[portalPostion.second] = {
        type: "portal",
        twinsPosition: portalPostion.first,
        id: `${portalPostion.first}_${portalPostion.second}_portal`,
        value: `portal${i + 1}`
      };
    }
    return table;
  }

  fillEmpty(table) {
    for (let index = 0; index < table.length; index++) {
      const item = table[index];
      table[index] = item ? Object.assign(item, { index }) : { index };
    }
    return table;
  }
}

module.exports = Games;
