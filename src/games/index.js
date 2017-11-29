const uuid = require('uuid/v4');
const main = require('../../lib');

const characters = ['player1', 'player2'];
const spaceshipRange = 4;

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
    const game = { users: [], id };
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
    this.data[id].turn = this.data[id].users[Math.floor(Math.random() * 2)].socketId;
    main.io.to(id).emit('table-generate-success', {
      table: this.data[id].table,
      tableSize: this.data[id].tableSize,
      playerPositionsWithData: this.data[id].users.map(user => user.getCharacterAndPosition()),
      youTurn: this.data[id].turn
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

  dice(gameId, socketId) {
    if (!this.data[gameId] || this.data[gameId].turn !== socketId) return;
    const playerIdx = this.data[gameId].users.findIndex(user => user.socketId === socketId);
    const rollResult = Math.floor(Math.random() * 6) + 1;
    const newPos = this.calcPos(this.data[gameId].users[playerIdx].position + rollResult, this.data[gameId].table);
    this.data[gameId].users[playerIdx].position = newPos;
    const nextPlayerId = this.data[gameId].users.findIndex(user => user.socketId !== socketId);
    this.data[gameId].turn = this.data[gameId].users[nextPlayerId].socketId;
    main.io.to(gameId).emit('dice-result', {
      playerPositionsWithData: this.data[gameId].users.map(user => user.getCharacterAndPosition()),
      youTurn: this.data[gameId].users[nextPlayerId].socketId
    });
  }

  calcPos(position, table) {
    const field = table[position];
    if (!field) return table.length - 1;
    if (!field.type) return position;
    if (field.type === 'portal') return field.twinsPosition;
    if (field.type === 'spaceship') return this.calcPos(this.calcSpaceshipFlyingDist(position), table);
  }

  calcSpaceshipFlyingDist(position) {
    const dist = Math.floor(Math.random() * spaceshipRange * 2 + 1) - spaceshipRange;
    if (dist === 0) this.calcSpaceshipFlyingDist();
    const newPos = position + dist;
    return newPos < 0 ? 0 : newPos;
  }
}

module.exports = Games;
