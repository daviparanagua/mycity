const Exception = require("../../../helpers/Exception");
const gameRules = require("../../../gamerules");
const { pool } = require("../../../database");
const { calculateScale, buildTime } = require("../calculators");

const updateResources = require('./updateResources');
const updateBuildOptions = require('./updateBuildOptions');
const updateEvents = require('./updateEvents');
const updatePopulation = require('./updatePopulation');
const build = require('./build');


module.exports = {
  async updateCity(city){
    city.internal = {};
    
      city = await this.organize(city);
      city = await this.calculateBreakpoints(city);
      for (let event of city.events) {
        if (+event.eventEnd > Date.now()) break;

        let updateUntil = event.eventEnd;

        console.log(`event - ${updateUntil}`)
        
        city = await this.updateCycleVariants(city, updateUntil);
        city = await this.processEvent(city, event);


      }

      console.log(city.internal.breakpoints)
      
      // Update until present
      city = await this.updateCycleVariants(city, new Date());
      await this.sync(city);
      return city
    
  },
  async updateCycleVariants(city, updateUntil) {
    updateUntil.setMilliseconds(0);
    city = await this.updateEvents(city);
    city = await this.updateResources(city, updateUntil);
    city = await this.updatePopulation(city, updateUntil);
    city = await this.updateBuildings(city);
    city = await this.updateBuildOptions(city);
    city.lastUpdated = updateUntil;
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
  calculateBreakpoints(city) {
    city.internal.breakpoints = {a:'b'}

    return city;
  },
  updateEvents,
  updateResources,
  updateBuildings(city) {
    return city;
  },
  updateBuildOptions,
  updatePopulation,
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
