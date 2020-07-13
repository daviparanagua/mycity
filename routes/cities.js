var express = require("express");
var router = express.Router();
const citiesController = require("../controllers/cities");

/**
 * Lista as cidades do usuário
 * @route GET /cities
 * @group cities - Operações de cidades
 * @returns {object} 200 - Dados do usuário
 * @returns {Error}  default - Unexpected error
 */
router.get("/", citiesController.myCities);

/**
 * Cria uma nova cidade para o usuário
 * @route POST /cities
 * @param {string} name.body.required Nome da cidade
 * @param {integer} x.body.required Coordenada X
 * @param {integer} y.body.required Coordenada Y
 * @group cities - Operações de cidades
 * @returns {object} 200 - Dados do usuário
 * @returns {Error}  default - Unexpected error
 */
router.post("/", citiesController.buildCity);

/**
 * Busca cidade nas coordenadas X,Y
 * @route GET /cities/:x/:y
 * @group cities - Operações de cidades
 * @param {integer} x.params.required Coordenada X
 * @param {integer} y.params.required Coordenada Y
 * @returns {object} 200 - Dados do usuário
 * @returns {Error}  default - Unexpected error
 */
router.get("/:x/:y", citiesController.cityInCoords);

module.exports = router;
