const Exception = require("../../../helpers/Exception");
const gameRules = require("../../../gamerules");
const { pool } = require("../../../database");
const { calculateScale, buildTime } = require("../calculators");

const updateResources = require("./updateResources");
const updateBuildOptions = require("./updateBuildOptions");
const updateEvents = require("./updateEvents");
const updatePopulation = require("./updatePopulation");
const build = require("./build");
const cities = require("..");

const MAX_ITERATIONS = 10000;

module.exports = {
  async updateCity(city) {
    const FixedDate = new Date();
    city.internal = {};

    city = await this.organize(city);
    city = await this.calculateEventBreakpoints(city);

    city = await this.updateCycleVariants(city, city.lastUpdated);

    i = 0;
    while (city.internal.breakpoints.length > 0) {
      const breakpoint = city.internal.breakpoints.shift();
      if (breakpoint.time > new Date()) break;
      if (i > MAX_ITERATIONS) {
        console.error("Max iterations exceeded");
        break;
      }
      i++;

      console.log(breakpoint.type, breakpoint.time);

      let updateUntil = breakpoint.time;

      city = await this.updateCycleVariants(city, updateUntil, breakpoint);

      if (breakpoint.type == "event") {
        city = await this.processEvent(city, breakpoint.data);
      }
      city.lastUpdated = updateUntil;
    }

    // Update until present
    city = await this.updateCycleVariants(city, FixedDate);
    city.lastUpdated = FixedDate;
    await this.sync(city);
    return city;
  },
  async updateCycleVariants(city, updateUntil, breakpoint) {
    city = await this.updateEvents(city);
    city = await this.updateResources(city, updateUntil);
    city = await this.updatePopulation(city, updateUntil, breakpoint);
    city = await this.updateBuildings(city);
    city = await this.updateBuildOptions(city);
    return city;
  },
  async organize(city) {
    city.resources = {};
    city.buildings = {};
    city.lastUpdated = new Date(city.lastUpdated);
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
  calculateEventBreakpoints(city) {
    const breakpoints = [];

    for (event of city.events) {
      breakpoints.push({
        time: event.eventEnd,
        type: "event",
        data: event
      });
    }

    city.internal.breakpoints = breakpoints;

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
  removeBreakpoint(city, type) {
    const toDeleteIndex = city.internal.breakpoints.findIndex(
      (item) => item.type == type
    );
    if (toDeleteIndex > -1) {
      city.internal.breakpoints.splice(toDeleteIndex, 1);
    }
  },
  addBreakpoint(city, time, type, data) {
    city.internal.breakpoints.push({
      time,
      type,
      data
    });

    city.internal.breakpoints = city.internal.breakpoints.sort(
      (a, b) => +a.time - +b.time
    );
  },
  addOrReplaceBreakpoint(city, time, type, data) {
    this.removeBreakpoint(city, type);
    this.addBreakpoint(city, time, type, data);
  },
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
