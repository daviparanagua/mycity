const rules = {
    cities: {
        minDistanceBetweenCities: 2,
        maxCities: 2,
    },
    resources: {
        baseResourceGain: 0.2,
        resourceGainScale: 1,
        list: ['food', 'wood', 'iron', 'stone'],
        buildingModifiers: {
            farm: {food: 0.1},
            sawmill: {wood: 0.1},
            ironmine: {iron: 0.1},
            stonemine: {stone: 0.1}
        }
    },
    buildings: {
        list: ['farm', 'sawmill', 'ironmine', 'stonemine', 'market']
    }
}

module.exports = rules