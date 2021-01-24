const mysql = require("mysql2");

let pool = mysql.createPool({
  connectionLimit: 10,
  multipleStatements: true,
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  charset: "utf8_general_ci",
  timezone: "+00:00"
});

pool.on("connection", (conn) => {
  conn.query("SET time_zone='+00:00';", (error) => {
    if (error) {
      throw error;
    }
  });
});

const promisePool = pool.promise();

module.exports = { pool: promisePool };
