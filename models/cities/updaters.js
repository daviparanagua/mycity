const Exception = require("../../helpers/Exception");
const gameRules = require("../../gamerules");
const { pool } = require("../../database");
const { calculateScale, buildTime } = require("./calculators");

module.exports = {
  async updateCycleVariants(city, updateUntil) {
    updateUntil.setMilliseconds(0);
    city = await this.calculateEvents(city);
    city = await this.updateResources(city, updateUntil);
    city = await this.updateBuildings(city);
    city = await this.buildOptions(city);
    return city;
  },
  async organize(city) {
    city.resources = {};
    city.buildings = {};
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
  async calculateEvents(city) {
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
      const eventDuration = buildTime(
        city,
        event.building,
        additionalLevelForEnqueuement[event.building] - 1
      ); // -1 because self should't count
      event.eventStart = lastEventOfType[event.eventType].eventEnd;
      event.eventEnd = new Date(+new Date(event.eventStart) + eventDuration);
      lastEventOfType[event.eventType] = event;
    }

    return city;
  },
  async updateResources(city, updateUntil) {
    const conn = await pool.getConnection();
    try {
      const lastUpdatedTS = +new Date(city.lastUpdated);
      const secondsPassed = Math.floor((+updateUntil - lastUpdatedTS) / 1000);
      // Updates resources based on gain

      // Base
      let resourcesPerSecond = {};
      let resourcesMaxStorage = {};
      gameRules.resources.list.forEach((res) => {
        resourcesPerSecond[res] =
          gameRules.resources.baseResourceGain[res] || 0;
        resourcesMaxStorage[res] =
          gameRules.resources.baseResourceStorage[res] || 0;
      });

      // By Buildings
      for (let [buildingId, building] of Object.entries(gameRules.buildings)) {
        if (
          city.buildings[buildingId] &&
          building.resources &&
          building.resources.mod
        ) {
          for (let resource in building.resources.mod) {
            resourcesPerSecond[resource] +=
              building.resources.mod[resource] * city.buildings[buildingId];
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
        city.resources[resource] +=
          resourcesPerSecond[resource] * secondsPassed;
        city.resourcesIncome[resource] = resourcesPerSecond[resource];
        city.resources[resource] =
          city.resources[resource] > resourcesMaxStorage[resource]
            ? resourcesMaxStorage[resource]
            : city.resources[resource];
      }

      city.resourcesMaxStorage = resourcesMaxStorage;
      city.lastUpdated = updateUntil;
    } finally {
      conn.release();
    }

    return city;
  },
  updateBuildings(city) {
    return city;
  },
  buildOptions(city) {
    // Result
    city.buildOptions = {};
    for (let building of Object.keys(gameRules.buildings)) {
      const buildingCosts = gameRules.buildings[building].costs;
      if (!buildingCosts) continue;

      let cc = { costs: {} }; //Calculated cost

      for (let resource in buildingCosts.base) {
        cc.costs[resource] = calculateScale(
          buildingCosts.base[resource],
          buildingCosts.scale[resource],
          city.buildings[building]
        );
      }

      cc.time = buildTime(city, building);

      city.buildOptions[building] = cc;
    }
    return city;
  },
  async build(cityId, building, userId, simulation = true) {
    const conn = await pool.getConnection();
    try {
      const city = await this.getCityById(cityId, true);
      const canBuild = (userId = city.userId);

      if (!canBuild) throw new Exception(403, "Cannot build in this city");
      if (!(building in city.buildOptions))
        throw new Exception(422, "Invalid building");

      const buildingCosts = city.buildOptions[building];

      conn.beginTransaction();

      const consumeResources = await this.consumeResources(
        city,
        buildingCosts.costs,
        conn,
        simulation
      );

      if (!consumeResources) {
        conn.rollback();
        throw new Exception(424, "Insufficient Resources", {
          resources: city.resources,
          cost: buildingCosts.costs,
          missingResources: city.missingResources
        });
      }

      conn.query(
        `INSERT INTO citiesEvents (cityId, eventType, eventStart, eventEnd) VALUES (?, ?, ?, ?)`,
        [
          city.id,
          "build",
          new Date(),
          new Date(Date.now() + city.buildOptions[building].time * 1000)
        ]
      );

      conn.query(
        "INSERT INTO eventsBuild (eventId, building) VALUES (LAST_INSERT_ID(), ?)",
        [building]
      );
      
      if (simulation) {
        conn.rollback();
      } else {
        conn.commit();
      }
      return true;
    } finally {
      conn.release();
    }
  },
  async consumeResources(city, resourcesCost, conn, simulation) {
    let updates = [];
    let wheres = [];
    let values = [];

    for (let resource in resourcesCost) {
      updates.push(" ?? = ?? - ? ");
      values = values.concat([resource, resource, resourcesCost[resource]]);
      wheres.push(" ?? >= ? ");
      values = values.concat([resource, resourcesCost[resource]]);
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

    const [results, fields] = await conn.query(
      `UPDATE citiesResources SET ${updates.join(
        ", "
      )} WHERE cityId = ${pool.escape(city.id)} AND ${wheres.join(" AND ")}`,
      values
    );

    return results.affectedRows > 0;
  }
};