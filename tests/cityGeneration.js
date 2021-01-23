require("dotenv").config();
const citiesModel = require("../models/cities");

async function generateCities(amount) {
  let cities = [];
  for (let i = 0; i <= amount; i++) {
    cities.push(
      await citiesModel
        .fundCity(0, { name: "Teste", ignoreMax: true })
        .then((c) => {
          console.log(c);
        })
        .catch((e) => {
          console.error(e);
        })
    );
  }
  return cities;
}

generateCities(20);
