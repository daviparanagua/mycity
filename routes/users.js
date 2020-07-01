var express = require("express");
var bcrypt = require("bcrypt");
var router = express.Router();
const { pool } = require("../database");
const { UCS2_ESPERANTO_CI } = require("mysql2/lib/constants/charsets");

/* GET users listing. */
router.post("/register", async function (req, res, next) {
  const username = req.body.username;
  const rawpassword = req.body.password;
  try {
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(rawpassword, salt);

    pool.getConnection().then(async (conn) => {
      try {
        const result = await conn.query(
          "INSERT INTO users (username, password) VALUES (?, ?)",
          [username, hash]
        );
        res.send(result);

        conn.release();
      } catch (err) {
        res.status(500).send(err);
      }
    });
  } catch (err) {
    res.status(500).send(err);
  }
});

router.post("/login", async function (req, res, next) {
  const username = req.body.username;
  const triedPassword = req.body.password;

  pool.getConnection().then(async (conn) => {
    try {
      const [
        results,
        fields
      ] = await conn.query("SELECT * FROM users WHERE username = ?", [
        username
      ]);

      const user = results[0];
      if (!user) {
        return res.status(404).send();
      }
      const hashPassword = user.password;

      if (await bcrypt.compare(triedPassword, hashPassword)) {
        res.status(200).send(true);
      } else {
        res.status(401).send(false);
      }
    } catch (err) {
      console.error(err);
      res.status(500).send(err);
    }
    conn.release();
  });
});

module.exports = router;
