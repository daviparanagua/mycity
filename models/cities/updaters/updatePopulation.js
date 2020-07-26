const Exception = require("../../../helpers/Exception");
const gameRules = require("../../../gamerules");
const { pool } = require("../../../database");

module.exports = async function updatePopulation(city, updateUntil) {
  const lastUpdatedTS = +new Date(city.lastUpdated);
  const secondsPassed = Math.floor((+updateUntil - lastUpdatedTS) / 1000);

  city.populationIncrease = city.population * gameRules.population.growth;

  city.population += city.populationIncrease * secondsPassed;

  return city;
};
