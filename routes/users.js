var express = require("express");
var bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
var router = express.Router();
const { pool } = require("../database");
const { verifyJWT } = require("../middlewares/auth");


/**
 * Obtém informações do usuário logado
 * @route GET /users/me
 * @group users - Operações de usuário
 * @returns {object} 200 - Dados do usuário
 * @returns {Error}  default - Unexpected error
 */
router.get('/me', verifyJWT, function(req,res,next){
  res.send(req.user)
})

/**
 * Cadastra um novo usuário
 * @route GET /users/register
 * @group users - Operações de usuário
 * @param {string} username.body.required - nome de usuário
 * @param {string} password.body.required - nome de usuário
 * @returns {object} 200 - Dados do usuário
 * @returns {Error}  default - Unexpected error
 */
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

/**
 * Faz login com um usuário existente
 * @route GET /users/login
 * @group users - Operações de usuário
 * @param {string} username.body.required - nome de usuário
 * @param {string} password.body.required - nome de usuário
 * @returns {object} 200 - Dados do usuário
 * @returns {Error}  default - Unexpected error
 */
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
          .cookie("authToken", token, { maxAge: (1000 * 60 * 60 * 24 * 30), sameSite: false})
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
