// utils/logService.js
const db = require("../db");

exports.writeLog = (user_id, action, module, description, old_data = null, new_data = null, ip_address = null, user_agent = null) => {
  const sql = `
      INSERT INTO system_logs 
      (user_id, action, module, description, old_data, new_data, ip_address, user_agent) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [
    user_id,
    action,
    module,
    description,
    old_data,
    new_data,
    ip_address,
    user_agent
  ]);
};
