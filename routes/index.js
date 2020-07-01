require("dotenv").config();
const express = require("express");
const router = express.Router();
const { pool } = require("../database");
const {verifyJWT} = require('../middlewares/auth')

/* GET home page. */
router.get("/",  function (req, res, next) {
  pool.getConnection().then(async (conn) => {
    const [results] = await conn.query("SELECT 1 + 1 AS resultado")
      res.send({ status: "ok", '1+1=': results[0].resultado});
    
    conn.release();
  });
});

router.use("/users", require("./users"));

router.get('/secret', verifyJWT)

module.exports = router;
