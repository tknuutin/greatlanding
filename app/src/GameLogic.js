
let CollisionManager = require('./CollisionManager');
let V = require('./Vector');
let { degs } = require('./Calc');

function getSurfacePerpendicular(planet, rocket) {
    return V.sub(planet, rocket);
}



class GameLogic {
    constructor(shapeMgr) {
        this.rocket = shapeMgr.rocket;
        this.shapeMgr = shapeMgr;
    }

    update() {
        let info = {};
        let { rocket } = this;

        this.shapeMgr.updateShapePositions();

        let planet = CollisionManager.checkRocketCollision(this.rocket, this.shapeMgr.planets);
        if (planet) {
            // console.log('collided on planet', planet.name);
            // let lateral = getPlanetLateralSpeed(planet, rocket);
            // console.log(lateral);
            // let verticalSpeed = 0;
            info.stop = true;

        }

        return info;
    }
}

module.exports = { GameLogic }