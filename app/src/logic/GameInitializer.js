
let _ = require('lodash');
let { Planet } = require('shapes/Planet');
let V = require('math/Vector');
let { ROCKET } = require('config/GameConfig');

// List of defined maps!
const MAPS = [
    {
        planets: [
            {
                name: 'Base',
                x: 200, y: 1700,
                gravity: 11,
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
                gravity: 7.5,
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

/*
 * Get the x,y coordinates of a rocket on the surface at a given angle at a given planet.
 * - angle: Angle in degrees
 * - planet: Planet instance
 */
function getRocketStartPos(angle, planet) {
    let worldPoint = planet.getSurfacePoint(angle);
    let dir = V.sub(worldPoint, planet);
    let mag = V.magnitude(dir);
    let add = (ROCKET.HEIGHT / (2 / ROCKET.FACTOR)) - ROCKET.H_OFFSET;
    let finalPos = V.add(V.mul(V.unit(dir), mag + add), planet);
    return finalPos;
}

/*
 * A factory class that initializes a specific map by instantiating key objects.
 * Could be a collection of functions I guess!
 */
class GameInitializer {
    constructor() {
        // nothing
    }

    /*
     * Takes in a map definition and returns an instance of Planet instances initialized
     * from the map info.
     */
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
        targetPlanet.paintSurface(targetAngle - targetWidth / 2, targetAngle + targetWidth / 2, '#D47D83', {
            isLandingPad: true
        });

        return planets;
    }

    /*
     * Takes in a map definition and returns an object with Rocket properties
     * that define the Rocket's state at the start of the map.
     */
    initRocketDef(gameMap, planets) {
        let angle = gameMap.basePlanetAngle;
        let startPlanet = _.find(planets, (planet) => planet.isBase);
        let startPos = getRocketStartPos(angle, startPlanet);
        return {
            x: startPos.x, y: startPos.y,
            rotation: angle
        };
    }

    /*
     * Takes in a map definition (one of the maps in the MAPS const) and returns an object
     * with the following properties:
     * - planets: Array of Planet instances in the map.
     * - rocketDef: Rocket starting properties. Not a Rocket instance.
     * - targetPoint: The x,y coordinates of the target of this map.
     */
    initMap(gameMap) {
        this.map = gameMap;
        let planets = this.initPlanets(gameMap);
        let tPlanet = _.find(planets, (planet) => planet.isTarget);

        return {
            planets,
            rocketDef: this.initRocketDef(gameMap, planets),
            targetPoint: tPlanet.getSurfacePoint(gameMap.targetPlanetAngle),
            targetAngle: gameMap.targetPlanetAngle,
            targetWidth: gameMap.targetWidth
        };
    }

}

module.exports = { GameInitializer, MAPS };

