
// Gravity dampening factor, purely arbitrary value selected
// to get a nice gameplay feel.
const GRAV_DAMP = 75;

let V = require('math/Vector');
let { distancePoints } = require('math/Calc');

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

function applyGravity(planet, shape) {
    let strength = getGravityStrenghtForPoint(shape, planet);
    let planetDirection = V.unit(V.sub(planet, shape));

    return V.mul(planetDirection, strength);
}

module.exports = { getGravity, getGravityStrenghtForPoint, applyGravity };
