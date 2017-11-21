class User {
  constructor(socket, msg) {
    this.socket = socket;
    this.socketId = socket.id;
    this.username = msg.username;
  }

}

module.exports = User;
