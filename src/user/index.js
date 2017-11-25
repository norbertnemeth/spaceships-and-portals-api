class User {
  constructor(socket, msg) {
    this.socket = socket;
    this.socketId = socket.id;
    this.username = msg.username;
    this.position = 0;
    this.character = "";
  }

  getCharacterAndPosition() {
    return { position: this.position, character: this.character };
  }

  getPosition() {
    return this.position;
  }

  setCharacter(character) {
    this.character = character;
  }

  setPosition(position) {
    this.position = position;
  }
}

module.exports = User;
