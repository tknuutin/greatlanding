
let _ = require('lodash');
let { Planet } = require('./Planet');
let { Rocket } = require('./Rocket');
let { Rectangle } = require('./Shapes');
let { clampRot, distancePoints } = require('./Calc');
let V = require('./Vector');

// ----------------------------------------------------
// Gravity stuff, should move this out of here
const GRAV_DAMP = 75;

function getGravity(distance, maxDist, surfaceGrav) {
    if (distance > maxDist) {
        return 0;
    }

    if (distance <= 0) {
        return surfaceGrav;
    }

    return ((-(1 / (maxDist / 10)) * distance) + surfaceGrav) / GRAV_DAMP;
}

function getGravityStrenghtForPoint(point, planet) {
    let dist = distancePoints(point, planet) - (planet.size / 2);
    return getGravity(dist, planet.gravMaxDist, planet.gravity);
}
// ----------------------------------------------------

const ROCKET_W = 57;
const ROCKET_H = 137.5;
const ROCKET_H_OFFSET = 5;

function getRocketStartPos(rocket, angle, planet) {
    let worldPoint = planet.getSurfacePoint(angle);
    let dir = V.sub(worldPoint, planet);
    let mag = V.magnitude(dir);
    let add = rocket.height / 2 - ROCKET_H_OFFSET;
    let finalPos = V.add(V.mul(V.unit(dir), mag + add), planet);
    return finalPos;
}

class ShapeManager {
    constructor(images, gameMap) {
        this.shapes = [];

        this.planets = _.map(gameMap.planets, (planetDef) => {
            let planet = new Planet(planetDef);
            this.addShape(planet);
            return planet;
        });

        let rocket = new Rocket({
            smokeImg: images['cloud.png'],
            img: images['rocket.png'],
            x: 0, y: 0,
            rotation: gameMap.basePlanetAngle,
            width: ROCKET_W / 2, height: ROCKET_H / 2,

            regX: ROCKET_W / 4,
            // Adding five so it looks like the approx central mass point
            regY: (ROCKET_H / 4) + ROCKET_H_OFFSET
        });

        this.gameMap = gameMap;
        this.rocket = rocket;
        this.setRocketPosition();
        this.addShape(rocket);
    }

    setRocketStartPosition() {
        let angle = this.gameMap.basePlanetAngle
        let planet = _.find(this.planets, (planet) => planet.isBase);
        let startPos = getRocketStartPos(this.rocket, angle, planet);
        rocket.x = startPos.x;
        rocket.y = startPos.y;
    }

    reset() {
        this.setRocketPosition();
        this.rocket.move.v = { x: 0, y: 0 };
        this.rocket.launched = false;
    }

    getClosestPlanet(rocket) {
        return _.reduce(this.planets, (result, planet) => {
            let dist = distancePoints(rocket, planet);
            if (dist < result.dist) {
                result.dist = dist;
                result.planet = planet;
            }
            return result;
        }, { dist: Number.POSITIVE_INFINITY });
    }

    applyGravity(shape) {
        let planet = this.getClosestPlanet(shape).planet;  // Lazy I know

        let strength = getGravityStrenghtForPoint(shape, planet);
        let planetDirection = V.unit(V.sub(planet, shape));

        let gravity = V.mul(planetDirection, strength);
        shape.move.v.x += gravity.x;
        shape.move.v.y += gravity.y;
    }

    updateShapePositions() {
        _.forEach(this.shapes, (shape) => {
            if (shape.update) {
                shape.update();
            }

            if (shape.move && !shape.move.stopped) {
                if (shape.isRocket && !(!shape.launched || shape.landed)) {
                    this.applyGravity(shape);
                }

                shape.x += shape.move.v.x;
                shape.y += shape.move.v.y;
            }

            if (shape.rotspeed) {
                shape.rotation += shape.rotspeed;
                shape.rotation = clampRot(shape.rotation);
            }
        });
    }

    getShapes() {
        return this.shapes;
    }

    addShape(shape) {
        this.shapes.push(shape);
    }

    removeShape(shape) {
        _.pull(this.shapes, shape);
    }

}

module.exports = { ShapeManager };

