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
      const userCities = await this.getCities([["userId", "=", userId]]);
      if (userCities.length > 0)
        throw new Exception(409, `Too many cities. Maximum is 1`, userCities);

      const begin = gameRules.world.size / 2,
        end = gameRules.world.size,
        beginX = gameRules.world.size / 2,
        beginY = gameRules.world.size / 2,
        endX = gameRules.world.size,
        endY = gameRules.world.size;

      let walker = begin,
        suitable = [];

      const citiesNearby = await this.getCities([
        ["x", ">=", beginX],
        ["y", ">=", beginY],
        ["x", "<=", endX],
        ["y", "<=", endY]
      ]);

      let proposedX = beginX,
        proposedY = beginY,
        chosen;

      while (walker <= end) {
        proposedX = beginX;
        proposedY = walker;
        while (proposedX <= walker) {
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
          // console.log({proposedX, proposedY, nearby})
          proposedX++;
        }

        proposedY = beginY;
        proposedX = walker;
        while (proposedY < walker) {
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

          // console.log({proposedX, proposedY, nearby})
          proposedY++;
        }

        if (suitable.length) {
          chosen = suitable[Math.floor(Math.random() * suitable.length)];
          break;
        }
        walker++;
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

    console.log(params);
    const conn = await pool.getConnection();
    try {
      // Not at or above city limit
      const userCities = await this.getCities([["userId", "=", userId]]);
      if (userCities.length >= gameRules.cities.maxCities)
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
