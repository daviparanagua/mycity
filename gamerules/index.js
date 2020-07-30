const perHour = (value) => value / 3600;

const basicResources = ["food", "wood", "iron", "stone"];

const rules = {
  cities: {
    minDistanceBetweenCities: 2,
    maxCities: 2
  },
  resources: {
    baseResourceGain: {
      wood: perHour(20),
      food: perHour(20),
      stone: perHour(10)
    },
    baseResourceStorage: { wood: 100, food: 100, stone: 50 },
    resourceGainScale: 1,
    storageBase: 20,
    storageScale: 1.1,
    list: basicResources
  },
  population: {
    baseGrowth: 2,
    resources: {
      mod: {
        food: perHour(-1)
      }
    },
    growth: perHour(0.05)/24
  },
  buildings: {
    farm: {
      costs: {
        base: { wood: 50 },
        scale: { wood: 1.3 },
        time: 30,
        timeScale: 1.3,
      },
      population: {base: 3, scale: 1.2 },
      resources: {
        mod: { food: {base: perHour(40), scale: 1.238990371 } }
      }
    },
    sawmill: {
      costs: {
        base: { wood: 5, iron: 40, stone: 40 },
        scale: { wood: 1.1, iron: 1.25, stone: 1.25 },
        time: 50,
        timeScale: 1.36
      },
      population: {base: 3, scale: 1.2 },
      resources: {
        mod: { wood: {base: perHour(40), scale: 1.238990371 } }
      }
    },
    stonemine: {
      costs: {
        base: { wood: 60, iron: 30 },
        scale: { wood: 1.2, iron: 1.35 },
        time: 60,
        timeScale: 1.07
      },
      population: {base: 3, scale: 1.2 },
      resources: {
        mod: { iron: {base: perHour(30), scale: 1.238990371 } }
      }
    },
    ironmine: {
      costs: {
        base: { wood: 50, stone: 50 },
        scale: { wood: 1.2, stone: 1.25 },
        time: 60,
        timeScale: 1.2
      },
      population: {base: 3, scale: 1.2 },
      resources: {
        mod: { iron: {base: perHour(30), scale: 1.238990371 } }
      }
    },
    market: {
      costs: {
        base: { wood: 100, stone: 100 },
        scale: { wood: 1.3, stone: 1.15 },
        time: 60,
        timeScale: 1.07,
        requires: {
          storage: 2
        }
      },
      population: {base: 3, scale: 1.2 },
    },
    storage: {
      costs: {
        base: { wood: 200, stone: 200 },
        scale: { wood: 1.2, stone: 1.2 },
        time: 35,
        timeScale: 1.1
      },
      population: {base: 3, scale: 1.2 },
      resources: {
        max: (() => {
          const r = {};
          for (resource of basicResources) {
            r[resource] = { base: 1000, scale: 1.200454937 };
          }
          return r;
        })()
      }
    }
  }
};

module.exports = rules;
