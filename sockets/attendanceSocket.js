let ioGlobal = null;

const initAttendanceSocket = (io) => {
  ioGlobal = io;

  io.on("connection", (socket) => {
    socket.on("join-user-room", (user_id) => {
      socket.join(String(user_id));
    });
  });
};

const emitAttendanceToUser = (user_id, data) => {
  if (ioGlobal) {
    ioGlobal.to(String(user_id)).emit("attendance-realtime", data);
  }
};

module.exports = {
  initAttendanceSocket,
  emitAttendanceToUser,
};
