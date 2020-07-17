const { pool } = require("../../database");
const { values } = require("mysql2/lib/constants/charset_encodings");
const gameRules = require("../../gamerules");

async function sync(city) {
  const conn = await pool.getConnection();
  try {
    // Resources and buildings

    {
      let fields = [];
      let values = [];
      // resources
      for (let resource of gameRules.resources.list) {
        fields.push(resource);
        values.push(city.resources[resource]);
      }

      // buildings
      for (let building of Object.keys(gameRules.buildings)) {
        fields.push(building);
        values.push(city.buildings[building]);
      }

      const fieldsString = fields.join(" = ?,") + "= ?";

      await conn.query(
        `UPDATE citiesResources SET ${fieldsString}, lastUpdated = ? WHERE cityId = ?`,
        [...values, city.lastUpdated, city.id]
      );
    }

    // Events
    if (city.events.length > 1) {
      const deletableEvents = city.events
        .map((ev) => {
          if (ev.resolved) return ev.eventId;
        })
        .filter(Boolean);
      if (deletableEvents.length > 0) {
        console.log(deletableEvents);
        await conn.query(
          `DELETE FROM citiesEvents WHERE eventId IN (${deletableEvents.join(
            ","
          )}) AND cityId = ?`,
          [city.id]
        );
      }
    }

  } finally {
    conn.release();
  }
}

module.exports = { sync };
