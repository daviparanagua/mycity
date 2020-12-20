const Exception = require("../../../helpers/Exception");
const gameRules = require("../../../gamerules");
const { pool } = require("../../../database");

async function updatePopulation(city, updateUntil, breakpointCalled) {
  const lastUpdatedTS = +new Date(city.lastUpdated);
  const secondsPassed = (+updateUntil - lastUpdatedTS) / 1000;

  // Base Growth
  let totalIncrease = gameRules.population.baseGrowth;  // base

  city.populationIncrease = totalIncrease;

  // Insufficient resources upkeep
  let mustKillPopulation = 0;
  for (let [res, value] of Object.entries(gameRules.population.resources.mod)) {
    const resourceForPopulation = value * city.population * -1;
    console.log(res, resourceForPopulation);
    if (
      city.resources[res] <= resourceForPopulation &&
      city.resourcesIncome[res] <= resourceForPopulation
    ) {
      mustKillPopulation = Math.ceil(city.population * 0.01);
      console.log("MUST KILL " + mustKillPopulation);
      this.addOrReplaceBreakpoint(
        city,
        new Date(updateUntil.getTime()),
        "killed-population"
      );
    }
  }

  city.population -= mustKillPopulation;

  // Apply modifier
  const gainedPopulation = city.populationIncrease * secondsPassed;
  city.population += gainedPopulation;

  // Breakpoint
  const popFractionMissing =
    1 - (city.population - Math.floor(city.population));

  const toNextPop = Math.ceil(
    (1000 * popFractionMissing) / city.populationIncrease
  );
  // console.log(city.population, popFractionMissing, toNextPop)
  this.addOrReplaceBreakpoint(
    city,
    new Date(updateUntil.getTime() + toNextPop),
    "population"
  );

  return city;
}

module.exports = updatePopulation;
