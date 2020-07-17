const gameRules = require("../../gamerules");

function calculateScale(base, scale, level) {
  if (level < 1) return base;
  let value = base * scale ** (level - 1);
  return value;
}
function buildTime(city, building, additionalLevels = 0) {
  const buildingCosts = gameRules.buildings[building].costs;
  return calculateScale(
    buildingCosts.time,
    buildingCosts.timeScale,
    city.buildings[building] + additionalLevels
  ) * 1000;
}

module.exports = { calculateScale, buildTime };
