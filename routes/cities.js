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
 * Funda a primeira cidade
 * @route POST /cities
 * @param {string} name.body.required Nome da cidade
 * @group cities - Operações de cidades
 * @returns {object} 200 - Dados do usuário
 * @returns {Error}  default - Unexpected error
 */
router.post("/first", citiesController.fundCity);

/**
 * Cria uma nova cidade
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
 * Obtém dados da cidade
 * @route GET /cities/:id
 * @group cities - Operações de cidades
 * @param {integer} id.params.required ID da Cidade
 * @returns {object} 200 - Dados do usuário
 * @returns {Error}  default - Unexpected error
 */
router.get("/:id", citiesController.getCity);


/**
 * Simula construção de um edifício na cidade
 * @route POST /cities/:id/build
 * @group cities - Operações de cidades
 * @param {integer} id.params.required ID da Cidade
 * @param {string} building.body.required ID do edifício a construir (Ex.: sawmill)
 * @returns {object} 200 - Dados do usuário
 * @returns {Error}  default - Unexpected error
 */
router.get("/:id/build", (req, res, next) =>{ req.simulation = true; next()} , citiesController.build);

/**
 * Constrói um edifício na cidade
 * @route POST /cities/:id/build
 * @group cities - Operações de cidades
 * @param {integer} id.params.required ID da Cidade
 * @param {string} building.body.required ID do edifício a construir (Ex.: sawmill)
 * @returns {object} 200 - Dados do usuário
 * @returns {Error}  default - Unexpected error
 */
router.post("/:id/build", citiesController.build);

/**
 * Busca cidade nas coordenadas X,Y
 * @route GET /cities/:x/:y
 * @group cities - Operações de cidades
 * @param {integer} x.params.required Coordenada X
 * @param {integer} y.params.required Coordenada Y
 * @returns {object} 200 - Dados do usuário
 * @returns {Error}  default - Unexpected error
 */
router.get("/:xStart/:yStart/:xEnd/:yEnd", citiesController.citiesInRange);

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
