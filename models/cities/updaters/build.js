const Exception = require("../../../helpers/Exception");
const gameRules = require("../../../gamerules");
const { pool } = require("../../../database");
const { calculateScale, buildTime } = require("../calculators");

module.exports = async function build(cityId, building, userId, simulation = true) {
    const conn = await pool.getConnection();
    try {
      const city = await this.getCityById(cityId, { unrestricted: true });
      const canBuild = (userId = city.userId);

      if (!canBuild) throw new Exception(403, "Cannot build in this city");

      if (!(building in city.buildOptions))
        throw new Exception(422, "Invalid building");

      if (!city.buildOptions[building].allowed)
        throw new Exception(
          422,
          "Cannot build",
          city.buildOptions[building].requires
        );

      const buildingCosts = city.buildOptions[building];

      conn.beginTransaction();

      const consumeResources = await this.consumeResources(
        city,
        buildingCosts.costs,
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

      await Promise.all[
        (conn.query(
          `INSERT INTO citiesEvents (cityId, eventType, eventStart, eventEnd) VALUES (?, ?, ?, ?)`,
          [
            city.id,
            "build",
            new Date(),
            new Date(Date.now() + city.buildOptions[building].time * 1000)
          ]
        ),
        conn.query(
          "INSERT INTO eventsBuild (eventId, building) VALUES (LAST_INSERT_ID(), ?)",
          [building]
        ))
      ];

      if (simulation) {
        conn.rollback();
      } else {
        await conn.commit();
      }
      return true;
    } finally {
      conn.release();
    }
  }