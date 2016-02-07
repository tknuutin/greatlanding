
let _ = require('lodash');

let { Rocket } = require('shapes/Rocket');
let { Rectangle } = require('shapes/Shapes');
let { clampRot, distancePoints } = require('math/Calc');
let V = require('math/Vector');

let { ROCKET } = require('config/GameConfig');


// ----------------------------------------------------
// Gravity stuff, should move this out of here

// Gravity dampening factor, purely arbitrary value selected
// to get a nice gameplay feel.
const GRAV_DAMP = 75;

/*
 * Calculates the gravity at a specific distance from a planet's surface.
 * Returns a number.
 * - distance: Distance from the planet's surface
 * - maxDist: Maximum distance for the gravity well. Yes I know that's not how gravity works
 * - surfaceGrav: Gravity at the planet surface.
 */
function getGravity(distance, maxDist, surfaceGrav) {
    if (distance > maxDist) {
        return 0;
    }

    if (distance <= 0) {
        return surfaceGrav;
    }

    // Lame linear function because I'm lazy and it works gameplay wise!
    // TODO: experiment with more fun gravity algorithms
    return ((-(1 / (maxDist / 10)) * distance) + surfaceGrav) / GRAV_DAMP;
}

/*
 * Get the strength of gravity effected on a point by a given planet.
 * Returns a Number.
 * - point: An object with x,y properties.
 * - planet: Planet instance.
 */
function getGravityStrenghtForPoint(point, planet) {
    let dist = distancePoints(point, planet) - (planet.size / 2);
    return getGravity(dist, planet.gravMaxDist, planet.gravity);
}
// ----------------------------------------------------

/*
 * Shape managing class. All shapes and entities should be registered
 * with this class.
 * - images: An object with preloaded Image instances
 */
class ShapeManager {
    constructor(images) {
        this.shapes = [];
        this.planets = [];
        this.gameMap = null;
        this.rocket = null;
        this.images = images;

        this.crashed = false;
    }

    /*
     * Returns the user-controlled Rocket instance
     */
    getRocket() {
        return this.rocket;
    }

    /*
     * Set whether the Rocket has crashed or not.
     * - value: Boolean
     */
    setCrashed(value) {
        this.crashed = value;
        if (this.rocket && value) {
            this.rocket.move.stopped = true;
        }
    }

    /*
     * Initializes all the map's shapes.
     * - planets: An Array of planet instances.
     * - rocketDef: An object with Rocket properties, used to construct Rocket instance.
     */
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

    /*
     * Reset the game shapes and their states, back to an empty map.
     */
    reset() {
        this.shapes = [];
        this.planets = null;
        this.rocket = null;
        this.gameMap = null;
    }

    /*
     * Returns the closest planet to the Rocket instance.
     * - rocket: Rocket instance
     */
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

    /*
     * Apply total gravity to the given shape instance. Modifies
     * the shape's move vector.
     * - shape: A Shape instance, for example Rocket.
     */
    applyGravity(shape) {
        let planet = this.getClosestPlanet(shape).planet;  // Lazy I know

        let strength = getGravityStrenghtForPoint(shape, planet);
        let planetDirection = V.unit(V.sub(planet, shape));

        let gravity = V.mul(planetDirection, strength);

        shape.move.v.x += gravity.x;
        shape.move.v.y += gravity.y;
    }

    /*
     * Update positions of all game shapes and entities according
     * to their move vectors and other affecting factors such as gravity.
     */
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

    /*
     * Get all the game shapes as an Array.
     */
    getShapes() {
        return this.shapes;
    }

    /*
     * Add a shape to the list of game shapes.
     */
    addShape(shape) {
        this.shapes.push(shape);
    }

    /*
     * Remove a shape from the list of game shapes.
     */
    removeShape(shape) {
        _.pull(this.shapes, shape);
    }

}

module.exports = { ShapeManager };

