const Exception = require("../../../helpers/Exception");
const gameRules = require("../../../gamerules");
const { pool } = require("../../../database");
const { calculateScale, buildTime } = require("../calculators");

module.exports = async function updateBuildOptions(city) {
    // Result
    city.buildOptions = {};

    let additionalLevelForEnqueuement = {};

    for (let event of city.events) {
      // Save extra level por cost scale
      if (event.eventType == "build")
        additionalLevelForEnqueuement[event.building] =
          (additionalLevelForEnqueuement[event.building] || 0) + 1;
    }

    for (let building of Object.keys(gameRules.buildings)) {
      const buildingCosts = gameRules.buildings[building].costs;
      if (!buildingCosts) continue;

      let cc = { costs: {} }; //Calculated cost
      cc.allowed = true;

      for (let resource in buildingCosts.base) {
        cc.costs[resource] = calculateScale(
          buildingCosts.base[resource],
          buildingCosts.scale[resource],
          city.buildings[building] + ( additionalLevelForEnqueuement[building] ||0)
        );
      }

      cc.time = buildTime(city, building, additionalLevelForEnqueuement[building]);
      if (buildingCosts.requires) {
        for (req in buildingCosts.requires) {
          if (buildingCosts.requires[req] > city.buildings[req]) {
            cc.requires = buildingCosts.requires;
            cc.allowed = false;
          }
        }
      }

      city.buildOptions[building] = cc;
    }
    return city;
  }