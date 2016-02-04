
let _ = require('lodash');

function checkRocketCollision(rocket, planets) {
    return !rocket.launched ? null : (_.filter(planets, (planet) => {
        return planet.collidesWith(rocket);
    })[0] || null);
}

module.exports = { checkRocketCollision };