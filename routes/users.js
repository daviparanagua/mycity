var express = require("express");
var bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
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

      } catch (err) {
        res.status(500).send(err);
      } finally {
        conn.release();
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
        return res.status(404).send({ ok: false });
      }
      const hashPassword = user.password;

      if (await bcrypt.compare(triedPassword, hashPassword)) {
        const token = jwt.sign(
          { id: user.id, username: user.username },
          process.env.JWT_SECRET,
          { expiresIn: "7d" }
        );
        res
          .status(200)
          .cookie("authToken", token, { maxAge: 900000, sameSite: false})
          .send({ ok: true, id: user.id });
      } else {
        res.status(401).send({ ok: false });
      }
      
    } catch (err) {
      console.error(err);
      res.status(500).send(err);
    } finally {
      conn.release();
    }
  });
});

module.exports = router;
