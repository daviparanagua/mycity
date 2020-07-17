const perHour = (value) => value / 3600;

const basicResources = ["food", "wood", "iron", "stone"];

const rules = {
  cities: {
    minDistanceBetweenCities: 2,
    maxCities: 2
  },
  resources: {
    baseResourceGain: {wood: perHour(60), food:perHour(30), stone: perHour(10)},
    baseResourceStorage: {wood: 60, food: 30, stone: 10, iron: 0},
    resourceGainScale: 1,
    storageBase: 20,
    storageScale: 1.1,
    list: basicResources
  },
  buildings: {
    farm: {
      costs: {
        base: { wood: 12 },
        scale: { wood: 1.1 },
        time: 30,
        timeScale: 1.1
      },
      resources: {
        mod: { food: perHour(20) }
      }
    },
    sawmill: {
      costs: {
        base: { wood: 4, iron: 4, stone: 4 },
        scale: { wood: 1.2, iron: 1.1, stone: 1.23 },
        time: 50,
        timeScale: 1.03
      },
      resources: {
        mod: { wood: perHour(20) }
      }
    },
    ironmine: {
      costs: {
        base: { wood: 8, stone: 8 },
        scale: { wood: 1.2, stone: 1.23 },
        time: 60,
        timeScale: 1.05
      },
      resources: {
        mod: { iron: perHour(20) }
      }
    },
    stonemine: {
      costs: {
        base: { wood: 8, iron: 8 },
        scale: { wood: 1.2, iron: 1.3 },
        time: 60,
        timeScale: 1.07
      },
      resources: {
        mod: { stone: perHour(20) }
      }
    },
    storage: {
      costs: {
        base: { wood: 8, stone: 8 },
        scale: { wood: 1, stone: 1.2 },
        time: 35,
        timeScale: 1.07
      },
      resources: {
        max: (() => {
          const r = {};
          for (resource of basicResources) {
            r[resource] = { base: 100, scale: 1.25 };
          }
          return r;
        }
      )()}
    }
  }
};

module.exports = rules;
