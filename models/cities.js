const Exception = require("../helpers/Exception");
const gameRules = require("../gamerules");
const { pool } = require("../database");

module.exports = {
  async getCities(filters, getResources = false) {
    const conn = await pool.getConnection();
    try {
      const escapedFilters = filters
        .map((flt) =>
          [conn.escapeId(flt[0]), flt[1], conn.escape(flt[2])].join(" ")
        )
        .join(" AND ");

      let [results, resFields] = await conn.query(
        `SELECT * FROM cities ${
          getResources ? " INNER JOIN citiesResources ON cityId = id" : ""
        } WHERE ${escapedFilters}`
      );

      if (getResources) {
        results = await this.updateResources(results);
        results = await this.updateBuildings(results);
      }

      return results;
    } finally {
      conn.release();
    }
  },
  async buildCity(userId, params) {
    if (!params.name.length || !"x" in params || !"y" in params)
      throw new Exception(400, "All parameters are required");

    const conn = await pool.getConnection();
    try {
      // Not at or above city limit
      const userCities = await this.getCities([["userId", "=", userId]]);
      if (userCities.length >= gameRules.cities.minDistanceBetweenCities)
        throw new Exception(
          409,
          `Too many cities. Maximum is ${gameRules.cities.minDistanceBetweenCities}`,
          userCities
        );

      // No nearby cities
      const citiesNearby = await this.getCities([
        ["x", ">=", params.x - gameRules.cities.minDistanceBetweenCities],
        ["y", ">=", params.y - gameRules.cities.minDistanceBetweenCities],
        ["x", "<=", params.x + gameRules.cities.minDistanceBetweenCities],
        ["y", "<=", params.y + gameRules.cities.minDistanceBetweenCities]
      ]);

      if (citiesNearby.length > 0)
        throw new Exception(409, "City around", citiesNearby);

      const [
        createdResults
      ] = await conn.query(
        "INSERT INTO cities (userId, name, x, y) VALUES (?,?,?,?)",
        [userId, params.name, params.x, params.y]
      );

      await conn.query(
        "INSERT INTO citiesResources (cityId) VALUES (LAST_INSERT_ID())"
      );
      return createdResults;
    } finally {
      conn.release();
    }
  },
  async updateResources(cities) {
    if ("id" in cities) {
      cities = [cities];
    }
    for (city of cities) {
      const conn = await pool.getConnection();
      try {
        const updateUntil = new Date();
        updateUntil.setMilliseconds(0);
        const lastUpdatedTS = +new Date(city.lastUpdated);
        const secondsPassed = Math.floor((+updateUntil - lastUpdatedTS) / 1000);

        // Updates resources based on gain

        // Base
        let resourcesPerSecond = {};
        gameRules.resources.list.forEach(
          (res) =>
            (resourcesPerSecond[res] = gameRules.resources.baseResourceGain)
        );

        // By Building
        for (let [building, effects] of Object.entries(
          gameRules.resources.buildingModifiers
        )) {
          for (let resource in effects) {
            resourcesPerSecond[resource] += effects[resource] * city[building];
          }
        }

        // Result
        city.resources = {};
        for (let resource of gameRules.resources.list) {
          city[resource] += resourcesPerSecond[resource] * secondsPassed;
          city.resources[resource] = city[resource];
          delete city[resource];
        }

        city.lastUpdated = updateUntil;

        await conn.query(
          "UPDATE citiesResources SET wood = ?, food = ?, iron = ?, stone = ?, lastUpdated = ? WHERE cityId = ?",
          [
            city.resources.wood,
            city.resources.food,
            city.resources.iron,
            city.resources.stone,
            new Date(),
            city.id
          ]
        );
      } finally {
        conn.release();
      }
    }
    return cities;
  },
  updateBuildings(cities) {
    if ("id" in cities) {
      cities = [cities];
    }
    for (city of cities) {
      // Result
      city.buildings = {};
      for (let building of gameRules.buildings.list) {
        city.buildings[building] = city[building];
        delete city[building];
      }
    }
    return cities;
  }
};
