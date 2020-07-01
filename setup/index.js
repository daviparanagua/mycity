require("dotenv").config();
const { pool } = require("../database");

pool.getConnection().then(async (conn) => {
    conn.query(`CREATE TABLE users (
        'id' int(10) unsigned NOT NULL AUTO_INCREMENT,
        'username' varchar(50) NOT NULL DEFAULT '',
        'password' varchar(200) NOT NULL DEFAULT '',
        PRIMARY KEY ('id'),
        UNIQUE KEY 'username' ('username')
      ) ENGINE=InnoDB DEFAULT CHARSET=latin1`)
    }
)