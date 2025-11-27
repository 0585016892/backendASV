function reviewSocket(io) {
  io.on("connection", (socket) => {

    // Tham gia phòng riêng (nếu có dùng room)
    socket.on("joinRoom", (room) => {
      socket.join(room);
    });

    // Khi duyệt review
    socket.on("approveReview", (reviewId) => {
      io.emit("reviewApproved", { reviewId });
    });

    // Khi xóa review
    socket.on("reviewDeleted", (reviewId) => {
      io.emit("reviewDeleted", { reviewId });
    });
// Khi thêm review mới
    socket.on("newReview", (review) => {
      io.emit("newReview", review); 
    });
    socket.on("disconnect", () => {
      console.log("Client ngắt:", socket.id);
    });
  });
}

module.exports = reviewSocket;
