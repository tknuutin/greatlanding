
let CollisionManager = require('./CollisionManager');
let V = require('./Vector');
let { degs } = require('./Calc');
let { getPlanetLateralSpeed, getPlanetVerticalSpeed } = require('./Calc');
let { SpriteSheet } = require('./Effects');

const LIMIT_LATERAL = 1;
const LIMIT_VERTICAL = 2;
const LIMIT_ANGLE = 10;


function getRocketAngleToPlanet(planet, rocket) {
    let surfaceTangent = V.normals(V.sub(planet, rocket))[0];

    let landingPoints = rocket.getPoints();
    let lp1 = landingPoints[1];
    let lp2 = landingPoints[2];
    let landVector = V.sub(lp1, lp2);

    return degs(V.angle(landVector, surfaceTangent));
}

function makeExplosion(img, position, onEnded) {
    let reg = ((320 / 5) / 2) * 1.5;
    let expl = new SpriteSheet({
        x: position.x, y: position.y,
        scaleX: 1.5, scaleY: 1.5,
        width: 320 / 5, height: 320 / 5,
        img: img, rows: 5, cols: 5,
        regX: reg, regY: reg,
        onEnded: onEnded
    });

    expl.start();
    return expl;
}

class GameLogic {
    constructor(images, shapeMgr) {
        this.images = images;
        this.rocket = shapeMgr.rocket;
        this.shapeMgr = shapeMgr;
        this.shouldStop = false;
    }

    checkForCrash(info) {
        let rocket = this.rocket;
        let { lateral, vertical, angle } = info;
        let planet = CollisionManager.checkRocketCollision(this.rocket, this.shapeMgr.planets);
        if (planet) {
            if (Math.abs(lateral) > LIMIT_LATERAL || vertical > LIMIT_VERTICAL || angle > LIMIT_ANGLE) {
                info.crashed = true;
                rocket.alpha = 0;
                rocket.cutEngines = true;
                let expl = makeExplosion(this.images['explosion.png'], { x: rocket.x, y: rocket.y }, () => {
                    this.shapeMgr.removeShape(expl);
                    this.shouldStop = true;
                });
                this.shapeMgr.addShape(expl);
            }
            else {
                let finalRot = degs(V.angle(V.sub(planet, rocket), { x: 0, y: 5 }));
                rocket.rotation = (planet.x > rocket.x) ? -(finalRot) : finalRot;
                info.landed = true;
            }

            info.gameOver = true;
        }
        return info;
    }

    analyze() {
        let info = {};
        let { rocket, shapeMgr } = this;

        let closestPlanet = shapeMgr.planets[0];

        info.rocket = rocket;
        info.landing = true;
        info.closestPlanet = closestPlanet;

        info.speed = V.magnitude(rocket.move.v);
        info.lateral = getPlanetLateralSpeed(closestPlanet, rocket);
        info.vertical = getPlanetVerticalSpeed(closestPlanet, rocket);
        info.angle = getRocketAngleToPlanet(closestPlanet, rocket);

        info = this.checkForCrash(info);

        info.stop = this.shouldStop ? true : info.stop;
        return info;
    }

    update() {
        this.shapeMgr.updateShapePositions();
    }
}

module.exports = { GameLogic }