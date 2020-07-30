const Exception = require("../../../helpers/Exception");
const gameRules = require("../../../gamerules");
const { pool } = require("../../../database");

async function updatePopulation(city, updateUntil, breakpointCalled) {
  const lastUpdatedTS = +new Date(city.lastUpdated);
  const secondsPassed = (+updateUntil - lastUpdatedTS)/1000;
  
  city.populationIncrease = gameRules.population.baseGrowth;
  const gainedPopulation = city.populationIncrease * secondsPassed;
  city.population += gainedPopulation;

  // breakpoint
  if (!breakpointCalled || breakpointCalled.type == 'population') {
    const popFractionMissing = 1-(city.population - Math.floor(city.population));
    const toNextPop = (1000 * popFractionMissing) / city.populationIncrease;

    this.addBreakpoint(
      city,
      new Date(updateUntil.getTime() + toNextPop),
      "population",
      { value: +1 }
    );
  }

  return city;
}

module.exports = updatePopulation;
