// helpers/getSettings.js
const db = require("../db");

function getSettings(callback) {
  db.query("SELECT setting_key, setting_value FROM settings", (err, rows) => {
    if (err) return callback(err);

    const settings = {};
    rows.forEach(r => (settings[r.setting_key] = r.setting_value));

    callback(null, settings);
  });
}

module.exports = getSettings;
