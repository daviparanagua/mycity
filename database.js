const mysql = require("mysql2");

let pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    charset: "utf8_general_ci"
  });

const promisePool = pool.promise();

module.exports = {pool: promisePool};
