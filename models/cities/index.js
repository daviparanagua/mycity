const Exception = require("../../helpers/Exception");
const gameRules = require("../../gamerules");
const { pool } = require("../../database");
const updaters = require("./updaters");
const { processEvent } = require("./eventProcessor");
const { sync } = require("./sync");

module.exports = {
  async getCities(filters, getResources = false) {
    const conn = await pool.getConnection();
    let events, results, resFields;

    try {
      // Builds request based on filters
      const escapedFilters = filters
        .map((flt) =>
          [conn.escapeId(flt[0]), flt[1], conn.escape(flt[2])].join(" ")
        )
        .join(" AND ");

      [results, resFields] = await conn.query(
        `SELECT * FROM cities ${
          getResources ? " INNER JOIN citiesResources ON cityId = id" : ""
        } WHERE ${escapedFilters}`
      );

      if (results.length) {
        const cityIds = results.map((res) => conn.escape(res.id)).join(",");

        // get events
        if (getResources) {
          [events] = await conn.query(
            `SELECT * FROM citiesEvents ce 
          LEFT JOIN eventsBuild eb ON ce.eventType = 'build' AND ce.eventId = eb.eventID
          WHERE cityId IN (${cityIds})
          ORDER BY eventEnd ASC
          `
          );
        }

        // get details
        if (getResources) {
          // Event processing loop
          for (city of results) {
            city.events = events.filter((ev) => ev.cityId == city.id);
            city = await this.updateCity(city);
            // delete city.internal
          }
        }
      }

      return results;
    } finally {
      conn.release();
    }
  },
  async getCityById(cityId, options = {}) {
    let city = (await this.getCities([["id", "=", cityId]], true, options))[0];
    // Se opções

    city = this.filterVisibleInfo(city, options);

    return city;
  },
  filterVisibleInfo(city, options) {
    if (options.unrestricted) return city;
    if (options.userId != city.userId) {
      city = this.applyWhitelist(city, ["id", "userId", "name", "x", "y"]);
    }
    return city;
  },
  applyWhitelist(city, allowed) {
    return Object.keys(city)
      .filter((key) => allowed.includes(key))
      .reduce((obj, key) => {
        obj[key] = city[key];
        return obj;
      }, {});
  },
  // Creates first city
  // WARN TODO : Slow and heavy
  async fundCity(userId, params) {
    if (!params.name) throw new Exception(400, "All parameters are required");

    if (params.name.length < 2) throw new Exception(400, "Name is too short");
    const conn = await pool.getConnection();

    try {
      // Already has city
      if (userId > 0 && !params.ignoreMax) {
        // Only testing
        const userCities = await this.getCities([["userId", "=", userId]]);
        if (userCities.length > 0)
          throw new Exception(409, `Too many cities. Maximum is 1`, userCities);
      }

      let suitable = [],
        incrX = 1,
        incrY = 1;

      if (Math.random() < 0.5) incrX = -1;
      if (Math.random() < 0.5) incrY = -1;

      const begin = gameRules.world.size / 2,
        end = gameRules.world.size,
        beginX = incrX > 0 ? gameRules.world.size / 2 : 0,
        beginY = incrY > 0 ? gameRules.world.size / 2 : 0,
        endX = incrX > 0 ? gameRules.world.size : gameRules.world.size / 2,
        endY = incrY > 0 ? gameRules.world.size : gameRules.world.size / 2;

      let iterations = 0;

      const citiesNearby = await this.getCities([
        ["x", ">=", beginX - gameRules.cities.minDistanceBetweenCities],
        ["y", ">=", beginY - gameRules.cities.minDistanceBetweenCities],
        ["x", "<=", endX + gameRules.cities.minDistanceBetweenCities],
        ["y", "<=", endY + gameRules.cities.minDistanceBetweenCities]
      ]);

      let proposedX, proposedY, chosen;

      while (iterations <= gameRules.world.size / 2) {
        const walkerX = incrX > 0 ? beginX + iterations : endX - iterations;
        const walkerY = incrY > 0 ? beginY + iterations : endY - iterations;
        // console.log("================= reset ===============");

        proposedX = incrX > 0 ? beginX : endX;
        proposedY = walkerY;

        while (incrX > 0 ? proposedX <= walkerX : proposedX >= walkerX) {
          const nearby = citiesNearby.find(
            (c) =>
              c.x <= proposedX + gameRules.cities.minDistanceBetweenCities &&
              c.x >= proposedX - gameRules.cities.minDistanceBetweenCities &&
              c.y <= proposedY + gameRules.cities.minDistanceBetweenCities &&
              c.y >= proposedY - gameRules.cities.minDistanceBetweenCities
          );

          if (!nearby) {
            suitable.push({ proposedX, proposedY });
          }
          // console.log({ proposedX, proposedY, walkerX, walkerY, nearby });
          proposedX += incrX;
        }

        proposedX = walkerX;
        proposedY = incrY > 0 ? beginY : endY;
        while (incrY > 0 ? proposedY <= walkerY : proposedY >= walkerY) {
          const nearby = citiesNearby.find(
            (c) =>
              c.x <= proposedX + gameRules.cities.minDistanceBetweenCities &&
              c.x >= proposedX - gameRules.cities.minDistanceBetweenCities &&
              c.y <= proposedY + gameRules.cities.minDistanceBetweenCities &&
              c.y >= proposedY - gameRules.cities.minDistanceBetweenCities
          );

          if (!nearby) {
            suitable.push({ proposedX, proposedY });
          }

          // console.log({ proposedX, proposedY, walkerX, walkerY, nearby });
          proposedY += incrY;
        }

        if (suitable.length) {
          chosen = suitable[Math.floor(Math.random() * suitable.length)];
          break;
        }
        iterations++;
      }

      if (!chosen) {
        throw new Exception(409, `Cannot fund any more cities`);
      }

      const createdResults = this.buildCity(userId, {
        ...params,
        x: chosen.proposedX,
        y: chosen.proposedY
      });

      return createdResults;
    } finally {
      conn.release();
    }
  },
  async buildCity(userId, params) {
    if (!params.name || !"x" in params || !"y" in params)
      throw new Exception(400, "All parameters are required");

    if (params.name.length < 2) throw new Exception(400, "Name is too short");

    // console.log(params);
    const conn = await pool.getConnection();
    try {
      // Not at or above city limit
      const userCities = await this.getCities([["userId", "=", userId]]);

      if (
        userCities.length >= gameRules.cities.maxCities &&
        userId > 0 &&
        !params.ignoreMax
      )
        throw new Exception(
          409,
          `Too many cities. Maximum is ${gameRules.cities.maxCities}`,
          userCities
        );

      // No nearby cities
      const citiesNearby = await this.getCities([
        ["x", ">=", params.x - gameRules.cities.minDistanceBetweenCities],
        ["y", ">=", params.y - gameRules.cities.minDistanceBetweenCities],
        ["x", "<=", params.x + gameRules.cities.minDistanceBetweenCities],
        ["y", "<=", params.y + gameRules.cities.minDistanceBetweenCities]
      ]);

      if (citiesNearby.length > 0)
        throw new Exception(409, "City around", citiesNearby);

      const [
        createdResults
      ] = await conn.query(
        "INSERT INTO cities (userId, name, x, y) VALUES (?,?,?,?)",
        [userId, params.name, params.x, params.y]
      );

      await conn.query(
        "INSERT INTO citiesResources (cityId) VALUES (LAST_INSERT_ID())"
      );
      return createdResults;
    } finally {
      conn.release();
    }
  },
  ...updaters,
  processEvent,
  sync
};
