class User {
  constructor(socket, msg) {
    this.socket = socket;
    this.socketId = socket.id;
    this.username = msg.username;
    this.position = 0;
    this.character = "";
  }

}

module.exports = User;
