const Exception = require("../../../helpers/Exception");
const gameRules = require("../../../gamerules");
const { pool } = require("../../../database");
const { calculateScale, buildTime } = require("../calculators");

module.exports = async function updateEvents(city) {
    // Order and calculate true time of events
    let lastEventOfType = {};
    let additionalLevelForEnqueuement = {};

    for (let event of city.events) {
      // Save extra level por cost scale
      if (event.eventType == "build")
        additionalLevelForEnqueuement[event.building] =
          (additionalLevelForEnqueuement[event.building] || 0) + 1;

      // If first event, skip
      if (!lastEventOfType[event.eventType]) {
        lastEventOfType[event.eventType] = event;
        continue;
      }

      // Enqueue remaining events
      const eventDurationMs = buildTime(
        city,
        event.building,
        additionalLevelForEnqueuement[event.building] - 1
      ); // -1 because self should't count
      const eventDuration = eventDurationMs * 1000;
      event.eventStart = lastEventOfType[event.eventType].eventEnd;
      event.eventEnd = new Date(+new Date(event.eventStart) + eventDuration);
      lastEventOfType[event.eventType] = event;
    }

    return city;
  }