
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

const START_ROT = 340;

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
    constructor(images, planets) {
        this.shapes = [];

        this.planets = _.map(planets, (planetDef) => {
            let planet = new Planet(planetDef);
            this.addShape(planet);
            return planet;
        });

        let rocket = new Rocket({
            smokeImg: images['cloud.png'],
            img: images['rocket.png'],
            x: 0, y: 0,
            rotation: START_ROT,
            width: ROCKET_W / 2, height: ROCKET_H / 2,

            regX: ROCKET_W / 4,
            // Adding five so it looks like the approx central mass point
            regY: (ROCKET_H / 4) + ROCKET_H_OFFSET
        });

        let startPos = getRocketStartPos(rocket, START_ROT, this.planets[0]);
        rocket.x = startPos.x;
        rocket.y = startPos.y;

        this.rocket = rocket;
        this.addShape(new Rectangle({
            x: 297, y: -297, width: 6, height: 6, fillStyle: '#ff0000'
        }));
        this.addShape(rocket);
    }

    applyGravity(shape) {
        let planet = this.planets[0];
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

