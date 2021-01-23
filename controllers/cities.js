const citiesModel = require("../models/cities");

module.exports = {
  async myCities(req, res, next) {
    try {
      const cities = await citiesModel.getCities(
        [["userId", "=", req.userId]],
        true
      );
      res.send(cities);
    } catch (err) {
      console.error(err, err.stack);
      res.status(500).send(err);
    }
  },
  async getCity(req, res, next) {
    try {
      const city = await citiesModel.getCityById(req.params.id, {userId: req.userId} );
      res.send(city);
    } catch (err) {
      if(!err.isException) console.error(err);
      res.status(500).send(err);
    }
  },
  async cityInCoords(req, res, next) {
    try {
      const cities = await citiesModel.getCities([
        ["x", "=", req.params.x],
        ["y", "=", req.params.y]
      ]);
      res.send(cities);
    } catch (err) {
      if(!err.isException) console.error(err);
      res.status(500).send(err);
    }
  },
  async citiesInRange(req, res, next) {
    try {
      const cities = await citiesModel.getCities([
        ["x", ">=", req.params.xStart],
        ["y", ">=", req.params.yStart],
        ["x", "<=", req.params.xEnd],
        ["y", "<=", req.params.yEnd]
      ]);
      res.send(cities);
    } catch (err) {
      if(!err.isException) console.error(err);
      res.status(500).send(err);
    }
  },
  async fundCity(req, res, next) {
    try {
      const cities = await citiesModel.fundCity(req.userId, { ...req.body });
      res.send(cities);
    } catch (err) {
      if(!err.isException) console.error(err);
      res.status(err.status || 500).send(err);
    }
  },
  async buildCity(req, res, next) {
    try {
      const cities = await citiesModel.buildCity(req.userId, { ...req.body });
      res.send(cities);
    } catch (err) {
      if(!err.isException) console.error(err);
      res.status(err.status || 500).send(err);
    }
  },
  async build(req, res, next) {
    const isSimulation = req.simulation || false

    try {
      const result = await citiesModel.build(
        req.params.id,
        req.body.building,
        req.userId,
        isSimulation
      );
      res.status(202).send({status: 202, result, isSimulation});
    } catch (err) {
      if(!err.isException) console.error(err);
      res.status(err.status || 500).send(err);
    }
  }
};
