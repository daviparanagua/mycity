const gameRules = require("../../gamerules");
const { pool } = require("../../database");
const { calculateScale, buildTime } = require("./calculators");
const { buildings } = require("../../gamerules");


const processors = {
    build(city, event) {
        const building = event.building;
        city.buildings[building] += 1;
        event.processed = true;
        return city;
    }
}

function processEvent(city, event) {
    city = processors[event.eventType](city, event)
    return city
}

module.exports = {processEvent};