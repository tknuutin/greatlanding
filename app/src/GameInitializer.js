
let _ = require('lodash');
let { Planet } = require('./Planet');
let V = require('./Vector');
let { ROCKET } = require('./GameConfig');

const MAPS = [
    {
        planets: [
            {
                name: 'Base',
                x: 200, y: 1700,
                gravity: 13,
                size: 3000, fillStyle: '#85889E',
                atmsSize: 3800,
                isBase: true,
                // In RGB to avoid converting when we use a rgba string in a gradient
                atmsColor: [179, 232, 255]
            },
            {
                name: 'Target',
                isTarget: true,
                x: 4500, y: 5000,
                gravity: 9.5,
                size: 2700,
                fillStyle: '#9E8593',
                atmsSize: 3400,
                atmsColor: [255, 207, 253]
            }
        ],

        baseWidth: 5,
        basePlanetAngle: 340,

        targetPlanetAngle: 170,
        targetWidth: 5
    }
];

function getRocketStartPos(angle, planet) {
    let worldPoint = planet.getSurfacePoint(angle);
    let dir = V.sub(worldPoint, planet);
    let mag = V.magnitude(dir);
    let add = (ROCKET.HEIGHT / (2 / ROCKET.FACTOR)) - ROCKET.H_OFFSET;
    let finalPos = V.add(V.mul(V.unit(dir), mag + add), planet);
    return finalPos;
}

class GameInitializer {
    constructor() {
        // nothing
    }

    initPlanets(gameMap) {
        let planets = _.map(gameMap.planets, (planetDef) => {
            return new Planet(planetDef);
        });

        let baseAngle = gameMap.basePlanetAngle;
        let targetAngle = gameMap.targetPlanetAngle;
        let { baseWidth, targetWidth } = gameMap;

        let basePlanet = _.find(planets, (planet) => planet.isBase);
        basePlanet.paintSurface(baseAngle - baseWidth / 2, baseAngle + baseWidth / 2, '#7DD4AF');

        let targetPlanet = _.find(planets, (planet) => planet.isTarget);
        targetPlanet.paintSurface(targetAngle - targetWidth / 2, targetAngle + targetWidth / 2, '#D47D83');

        return planets;
    }

    initRocketDef(gameMap, planets) {
        let angle = gameMap.basePlanetAngle;
        let startPlanet = _.find(planets, (planet) => planet.isBase);
        let startPos = getRocketStartPos(angle, startPlanet);
        return {
            x: startPos.x, y: startPos.y,
            rotation: angle
        };
    }

    initMap(gameMap) {
        this.map = gameMap;
        let planets = this.initPlanets(gameMap);
        let tPlanet = _.find(planets, (planet) => planet.isTarget);

        return {
            planets,
            rocketDef: this.initRocketDef(gameMap, planets),
            targetPoint: tPlanet.getSurfacePoint(gameMap.targetPlanetAngle)
        };
    }

}

module.exports = { GameInitializer, MAPS };

