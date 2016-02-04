
// let _ = require('lodash');
let CollisionManager = require('./CollisionManager');
let V = require('./Vector');
let { degs } = require('./Calc');
let { getPlanetLateralSpeed, getPlanetVerticalSpeed } = require('./Calc');
let { SpriteSheet } = require('./Effects');
let { LIMIT_LATERAL, LIMIT_VERTICAL, LIMIT_ANGLE } = require('./GameConfig');

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

function getWinnerMessage(info) {
    let fuel = Math.round(info.rocket.getFuel() * 100) / 100;
    return `You reached the target with ${fuel}% fuel.`;
}

function getExplosionMessage(info) {
    if (info.angle > 90) {
        return "That's a weird way to land!";
    } else if (info.angle > LIMIT_ANGLE) {
        return 'Your landing angle was too steep!';
    } else if (Math.abs(info.lateral) > LIMIT_LATERAL) {
        return 'Your lateral velocity was too high!';
    } else if (info.vertical > LIMIT_VERTICAL) {
        return 'Your vertical velocity was too high!';
    }
    return 'What a mystery!';
}

class GameLogic {
    constructor(images, shapeMgr) {
        this.images = images;
        this.shapeMgr = shapeMgr;
        this.shouldStop = false;

        this.crashed = false;

        this.uiMessage = null;
    }

    setCrashed(value, info) {
        this.crashed = value;
        this.crashInfo = info;
        this.shapeMgr.setCrashed(value);
    }

    addUIMessage(info) {
        this.uiMessage = info;
    }

    checkForPlanetContact(info) {
        let rocket = info.rocket;
        let { lateral, vertical, angle } = info;
        let planet = CollisionManager.checkRocketCollision(info.rocket, info.planets);
        if (planet) {
            if (Math.abs(lateral) > LIMIT_LATERAL || vertical > LIMIT_VERTICAL || angle > LIMIT_ANGLE) {
                this.setCrashed(true, info);
                rocket.stop();
                rocket.alpha = 0;
                rocket.cutEngines = true;

                let expl = makeExplosion(this.images['explosion.png'], { x: rocket.x, y: rocket.y }, () => {
                    this.shapeMgr.removeShape(expl);
                });
                setTimeout(() => {
                    this.addUIMessage({
                        header: 'You exploded!',
                        message: getExplosionMessage(info),
                        showRestartTip: true
                    });
                }, 300);
                this.shapeMgr.addShape(expl);
            } else {
                let finalRot = degs(V.angle(V.sub(planet, rocket), { x: 0, y: 5 }));
                rocket.rotation = (planet.x > rocket.x) ? -(finalRot) : finalRot;
                info.landed = true;
                rocket.launched = false;
                rocket.stop();

                if (planet.isTarget) {
                    setTimeout(() => {
                        this.addUIMessage({
                            header: 'A winner is you!',
                            message: getWinnerMessage(info),
                            showRestartTip: true
                        });
                    }, 300);
                }
            }

            info.gameOver = planet.isTarget || info.crashed;
        }
        return info;
    }

    analyze() {
        let info = {};
        let { shapeMgr } = this;
        let rocket = shapeMgr.getRocket();

        let closestPlanetInfo = shapeMgr.getClosestPlanet(rocket);
        let closestPlanet = closestPlanetInfo.planet;

        info.rocket = rocket;
        info.landing = true;
        info.closestPlanet = closestPlanet;
        info.closestPlanetDistance = closestPlanetInfo.dist;
        info.planets = shapeMgr.planets;

        if (this.crashed) {
            info.speed = this.crashInfo.speed;
            info.lateral = this.crashInfo.lateral;
            info.vertical = this.crashInfo.vertical;
            info.angle = this.crashInfo.angle;
        } else {
            info.speed = V.magnitude(rocket.move.v);
            info.lateral = getPlanetLateralSpeed(closestPlanet, rocket);
            info.vertical = getPlanetVerticalSpeed(closestPlanet, rocket);
            info.angle = getRocketAngleToPlanet(closestPlanet, rocket);
            info = this.checkForPlanetContact(info);
        }

        if (this.uiMessage) {
            info.uiMessage = this.uiMessage;
            this.uiMessage = null;
        }

        info.crashed = this.crashed;
        info.stop = this.shouldStop ? true : info.stop;
        return info;
    }

    update() {
        this.shapeMgr.updateShapePositions();
    }
}

module.exports = { GameLogic }