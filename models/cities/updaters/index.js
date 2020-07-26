const Exception = require("../../../helpers/Exception");
const gameRules = require("../../../gamerules");
const { pool } = require("../../../database");
const { calculateScale, buildTime } = require("../calculators");

const updateResources = require('./updateResources');
const updateBuildOptions = require('./updateBuildOptions');
const updateEvents = require('./updateEvents');
const build = require('./build');


module.exports = {
  async updateCycleVariants(city, updateUntil) {
    updateUntil.setMilliseconds(0);
    city = await this.updateEvents(city);
    city = await this.updateResources(city, updateUntil);
    city = await this.updateBuildings(city);
    city = await this.updateBuildOptions(city);
    return city;
  },
  async organize(city) {
    city.resources = {};
    city.buildings = {};
    for (let building of Object.keys(gameRules.buildings)) {
      city.buildings[building] = city[building];
      delete city[building];
    }
    for (let resource of gameRules.resources.list) {
      city.resources[resource] = city[resource];
      delete city[resource];
    }

    return city;
  },
  updateEvents,
  updateResources,
  updateBuildings(city) {
    return city;
  },
  updateBuildOptions,
  build,
  async consumeResources(city, resourcesCost, simulation) {
    let updates = [];
    let wheres = [];
    let updateValues = [];
    let whereValues = [];

    const conn = await pool.getConnection();
    try {
      for (let resource in resourcesCost) {
        updates.push(" ?? = ?? - ? ");
        updateValues = updateValues.concat([
          resource,
          resource,
          resourcesCost[resource]
        ]);
        wheres.push(" ?? >= ? ");
        whereValues = whereValues.concat([resource, resourcesCost[resource]]);
      }
      city.missingResources = {};
      for (let resource in city.resources) {
        if (city.resources[resource] < resourcesCost[resource]) {
          city.missingResources[resource] =
            city.resources[resource] - resourcesCost[resource];
        }
      }

      if (Object.keys(city.missingResources).length > 0) return false;

      if (simulation) return true;

      for (let resource in resourcesCost) {
        city.resources -= resourcesCost[resource];
      }

      const [
        results,
        fields
      ] = await conn.query(
        `UPDATE citiesResources SET ${updates.join(
          ", "
        )} WHERE cityId = ${pool.escape(city.id)} AND ${wheres.join(" AND ")}`,
        [...updateValues, ...whereValues]
      );

      return results.affectedRows > 0;
    } finally {
      conn.release();
    }
  }
};
