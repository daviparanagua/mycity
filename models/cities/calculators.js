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
  );
}

const perHour = (value) => value / 3600;

const perDay = (value) => perHour(value) / 24;

module.exports = { calculateScale, buildTime, perHour, perDay };
