// backend/utils/nlp.js
const { NlpManager } = require("node-nlp");
const path = require("path");

const modelPath = path.join(__dirname, "model.nlp");
const manager = new NlpManager({ languages: ["vi"], forceNER: true });

// ===== Training data cơ bản =====

// Doanh thu
manager.addDocument("vi", "doanh thu hôm nay", "report.revenue.today");
manager.addDocument("vi", "hôm nay bán được bao nhiêu", "report.revenue.today");
manager.addDocument("vi", "doanh thu ngày hôm nay", "report.revenue.today");

manager.addDocument("vi", "doanh thu tháng này", "report.revenue.month");
manager.addDocument("vi", "tổng tiền bán hàng tháng này", "report.revenue.month");
manager.addDocument("vi", "tháng này cửa hàng thu bao nhiêu", "report.revenue.month");

// Đơn hàng
manager.addDocument("vi", "có bao nhiêu đơn hàng hôm nay", "report.orders.today");
manager.addDocument("vi", "số đơn hôm nay", "report.orders.today");
manager.addDocument("vi", "hôm nay có mấy đơn", "report.orders.today");

manager.addDocument("vi", "đơn hàng trong tuần này", "report.orders.week");
manager.addDocument("vi", "số đơn tuần này", "report.orders.week");

// Sản phẩm
manager.addDocument("vi", "top sản phẩm bán chạy", "report.topProducts");
manager.addDocument("vi", "sản phẩm nào bán nhiều nhất", "report.topProducts");
manager.addDocument("vi", "top 5 mặt hàng bán chạy", "report.topProducts");

manager.addDocument("vi", "sản phẩm nào sắp hết hàng", "report.lowStock");
manager.addDocument("vi", "mặt hàng nào còn ít", "report.lowStock");
manager.addDocument("vi", "kiểm tra tồn kho thấp", "report.lowStock");

// Khách hàng
manager.addDocument("vi", "khách hàng mới", "report.newCustomers");
manager.addDocument("vi", "khách hàng vừa đăng ký", "report.newCustomers");
manager.addDocument("vi", "có ai mới mua hàng không", "report.newCustomers");

// Smalltalk
manager.addDocument("vi", "chào", "smalltalk.greet");
manager.addDocument("vi", "xin chào", "smalltalk.greet");
manager.addDocument("vi", "hello", "smalltalk.greet");

manager.addDocument("vi", "cảm ơn", "smalltalk.thanks");
manager.addDocument("vi", "thanks", "smalltalk.thanks");
manager.addDocument("vi", "biết ơn", "smalltalk.thanks");

manager.addDocument("vi", "tạm biệt", "smalltalk.bye");
manager.addDocument("vi", "bye", "smalltalk.bye");

// Answers
manager.addAnswer("vi", "smalltalk.greet", "Xin chào, tôi có thể giúp gì cho bạn?");
manager.addAnswer("vi", "smalltalk.thanks", "Không có gì, rất vui được hỗ trợ bạn!");
manager.addAnswer("vi", "smalltalk.bye", "Tạm biệt, chúc bạn một ngày tốt lành!");

// ===== Train & Load & Incremental =====
async function trainNlp() {
  await manager.train();
  manager.save(modelPath);
  return manager;
}

function loadNlp() {
  try {
    manager.load(modelPath);
  } catch (_) {
    // lần đầu chưa có model thì bỏ qua
  }
  return manager;
}

// Thêm dữ liệu rồi train incremental
async function addTrainingData(lang, question, intent, answer = null) {
  loadNlp();
  manager.addDocument(lang, question, intent);
  if (answer) manager.addAnswer(lang, intent, answer);
  await manager.train();
  manager.save(modelPath);
  return true;
}

module.exports = { manager, trainNlp, loadNlp, addTrainingData };
