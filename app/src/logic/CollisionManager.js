
let _ = require('lodash');

/*
 * Checks if the rocket collides with any of the given planets.
 * Returns null if no planet collides, returns the specific planet otherwise.
 */
function checkRocketCollision(rocket, planets) {
    return !rocket.launched ? null : (_.filter(planets, (planet) => {
        return planet.collidesWithRocket(rocket);
    })[0] || null);
}

module.exports = { checkRocketCollision };