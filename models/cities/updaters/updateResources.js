const Exception = require("../../../helpers/Exception");
const gameRules = require("../../../gamerules");
const { pool } = require("../../../database");
const { calculateScale, buildTime } = require("../calculators");
const { resources } = require("../../../gamerules");

module.exports = async function (city, updateUntil) {
  const conn = await pool.getConnection();
  try {
    const lastUpdatedTS = +new Date(city.lastUpdated);
    const secondsPassed = Math.floor((+updateUntil - lastUpdatedTS) / 1000);
    // Updates resources based on gain

    // Base
    let resourcesPerSecond = {};
    let resourcesMaxStorage = {};
    gameRules.resources.list.forEach((res) => {
      resourcesPerSecond[res] = gameRules.resources.baseResourceGain[res] || 0;
      resourcesMaxStorage[res] =
        gameRules.resources.baseResourceStorage[res] || 0;
    });

    // By Population
    for (let [res, value] of Object.entries(
      gameRules.population.resources.mod
    )) {
      resourcesPerSecond[res] += value * city.population;
    }

    // By Buildings
    for (let [buildingId, building] of Object.entries(gameRules.buildings)) {
      if (
        city.buildings[buildingId] &&
        building.resources &&
        building.resources.mod
      ) {
        for (let resource in building.resources.mod) {
          resourcesPerSecond[resource] += calculateScale(
            building.resources.mod[resource].base,
            building.resources.mod[resource].scale,
            city.buildings[buildingId]
          );
        }
      }
      if (
        city.buildings[buildingId] &&
        building.resources &&
        building.resources.max
      ) {
        for (let resource in building.resources.max) {
          resourcesMaxStorage[resource] += calculateScale(
            building.resources.max[resource].base,
            building.resources.max[resource].scale,
            city.buildings[buildingId]
          );
        }
      }
    }

    // Result
    city.resourcesIncome = {};
    for (let resource of gameRules.resources.list) {
      city.resources[resource] += resourcesPerSecond[resource] * secondsPassed;
      city.resourcesIncome[resource] = resourcesPerSecond[resource];
      city.resources[resource] =
        city.resources[resource] > resourcesMaxStorage[resource]
          ? resourcesMaxStorage[resource]
          : city.resources[resource];
    }

    for (let resource of gameRules.resources.list) {
      // If negative income, create breakpoint
      if (city.resourcesIncome[resource] < 0) {
        const toZeroResource = Math.ceil(-1000*city.resources[resource] / city.resourcesIncome[resource]);
        // console.log('NEGATIVEINCOME', resource, toZeroResource)
        this.addOrReplaceBreakpoint(
          city,
          new Date(updateUntil.getTime() + toZeroResource),
          `resource-zero-${resource}`
        );
      }
    }

    city.resourcesMaxStorage = resourcesMaxStorage;
  } finally {
    conn.release();
  }

  return city;
};
