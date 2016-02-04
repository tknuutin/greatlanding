
let _ = require('lodash');

let { Rocket } = require('./Rocket');
let { Rectangle } = require('./Shapes');
let { clampRot, distancePoints } = require('./Calc');
let V = require('./Vector');

let { ROCKET } = require('./GameConfig');


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

class ShapeManager {
    constructor(images, gameMap) {
        this.shapes = [];
        this.planets = [];
        this.gameMap = null;
        this.rocket = null;
        this.images = images;

        this.crashed = false;
    }

    getRocket() {
        return this.rocket;
    }

    setCrashed(value) {
        this.crashed = value;
        if (this.rocket && value) {
            this.rocket.move.stopped = true;
        }
    }

    initMap(planets, rocketDef) {
        this.planets = planets;
        _.each(planets, this.addShape.bind(this));

        let rocket = new Rocket(_.merge(rocketDef, {
            smokeImg: this.images['cloud.png'],
            img: this.images['rocket.png'],
            width: ROCKET.WIDTH * ROCKET.FACTOR, height: ROCKET.HEIGHT * ROCKET.FACTOR,

            regX: ROCKET.WIDTH * (ROCKET.FACTOR / 2),
            // Adding five so it looks like the approx central mass point
            regY: (ROCKET.HEIGHT / 4) + ROCKET.H_OFFSET
        }));

        this.rocket = rocket;
        this.addShape(rocket);
    }

    reset() {
        this.shapes = [];
        this.planets = null;
        this.rocket = null;
        this.gameMap = null;
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

