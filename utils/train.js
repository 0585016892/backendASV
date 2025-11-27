// train.js
const { trainNlp } = require("./nlp");

(async () => {
  await trainNlp();
  console.log("✅ Đã train xong model và lưu vào utils/model.nlp");
})();
