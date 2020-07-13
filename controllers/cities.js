const citiesModel = require("../models/cities.js");


module.exports = {
  async myCities(req, res, next) {
    try {
      const cities = await citiesModel.getCities([["userId", "=", req.userId]], true);
      res.send(cities);
    } catch (err) {
      console.error(err);
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
      console.error(err);
      res.status(500).send(err);
    }
  },
  async buildCity(req, res, next) {
    try {
      const cities = await citiesModel.buildCity(req.userId, { ...req.body });
      res.send(cities);
    } catch (err) {
      console.error(err.toString());
      res.status(err.status || 500).send(err);
    }
  }
};
