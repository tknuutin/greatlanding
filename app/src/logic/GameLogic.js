

let CollisionManager = require('logic/CollisionManager');
let V = require('math/Vector');
let { degs, rads, getPlanetLateralSpeed, getPlanetVerticalSpeed, clampRot } = require('math/Calc');
let { SpriteSheet } = require('shapes/Effects');
let { LIMIT_LATERAL, LIMIT_VERTICAL, LIMIT_ANGLE } = require('config/GameConfig');

/*
 * Takes in a Planet and Rocket instance and returns as degrees the angle
 * between the surface tangent and the rocket's bottom surface.
 * - planet: Planet instance
 * - rocket: Rocket Instance
 */
function getRocketAngleToPlanet(planet, rocket) {
    let surfaceTangent = V.normals(V.sub(planet, rocket))[0];

    let landingPoints = rocket.getPoints();
    let lp1 = landingPoints[1];
    let lp2 = landingPoints[2];
    let landVector = V.sub(lp1, lp2);

    return degs(V.angle(landVector, surfaceTangent));
}

function getOptimalRotation(planet, rocket, rocketAngletoPlanet) {
    let toPlanet = V.sub(planet, rocket);
    let angle = degs(V.angle(toPlanet, { x: 0, y: 10 }));
    if (rocket.x < planet.x) {
        angle = 360 - angle;
    }

    window.drawDebug(null, angle + '');
    return angle;
}

/*
 * Creates an animated explosion using the given Image instance
 * at the given position. Fires the given onEnded callback
 * when the explosion finishes animating.
 * - img: A preloaded Image instance
 * - position: An position object with x and y values.
 * - onEnded: Callback function
 */
function makeExplosion(img, position, onEnded) {
    // TODO: move these magic values somewhere else.
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

/*
 * Get the message string displayed when the user wins.
 * - info: An object describing the game state.
 */
function getWinnerMessage(info) {
    let fuel = Math.round(info.rocket.getFuel() * 100) / 100;
    return `You reached the target with ${fuel}% fuel.`;
}

/*
 * Get the message string displayed when the Rocket explodes.
 * - info: An object describing the game state.
 */
function getExplosionMessage(info) {
    if (info.angle > 90) {
        return 'That\'s a weird way to land!';
    } else if (info.angle > LIMIT_ANGLE) {
        return 'Your landing angle was too steep!';
    } else if (Math.abs(info.lateral) > LIMIT_LATERAL) {
        return 'Your lateral velocity was too high!';
    } else if (info.vertical > LIMIT_VERTICAL) {
        return 'Your vertical velocity was too high!';
    }
    return 'What a mystery!';
}

/*
 * Main game logic resolving class. Creates game state
 * info objects by analyzing the shapes in the game.
 * - images: An object with preloaded Image instances
 * - shapeMgr: The ShapeManager instance
 */
class GameLogic {
    constructor(gameMap, images, shapeMgr) {
        this.gameMap = gameMap;
        this.images = images;
        this.shapeMgr = shapeMgr;
        this.shouldStop = false;

        this.crashed = false;

        this.uiMessage = null;
    }

    /*
     * Set the "crashed" status of the game.
     * - value: Boolean value describing whether the user has crashed.
     * - info: A game state object at the time when the crash happened.
     */
    setCrashed(value, info) {
        this.crashed = value;
        this.crashInfo = info;
        this.shapeMgr.setCrashed(value);
    }

    /*
     * Adds an UI message into the game state.
     * - info: An object that describes an UI popup message.
     *   - header: A string describing the message header.
     *   - message: A longer message to be displayed.
     *   - showRestartTip: Boolean, should display the restart tooltip?
     */
    addUIMessage(info) {
        this.uiMessage = info;
    }

    /*
     * Resolve rocket crashing on a planet.
     * - info: Game state.
     * - rocket: Rocket instance.
     */
    resolveCrash(info, rocket) {
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
    }

    /*
     * Resolve rocket landing on a planet.
     * - info: Game state.
     * - rocket: Rocket instance.
     * - planet: Planet instance.
     */
    resolveLand(info, rocket, planet) {
        let finalRot = degs(V.angle(V.sub(planet, rocket), { x: 0, y: 5 }));
        rocket.rotation = (planet.x > rocket.x) ? -(finalRot) : finalRot;
        info.landed = true;
        rocket.launched = false;
        rocket.stop();

        let tAngle = this.gameMap.targetAngle;
        let tWidth = this.gameMap.targetWidth;
        let targetStart = tAngle - tWidth / 2;
        let targetStop = targetStart + tWidth;

        if (planet.isTarget && (finalRot > targetStart && finalRot < targetStop)) {
            setTimeout(() => {
                this.addUIMessage({
                    header: 'A winner is you!',
                    message: getWinnerMessage(info),
                    showRestartTip: true
                });
            }, 300);
        }
    }

    /*
     * Checks whether the game at the state is in contact with a planet.
     * Will call relevant parties if the Rocket is in contact, for example
     * winning the game if in contact with the target planet, exploding, etc.
     * Returns a new game state pbject.
     */
    checkForPlanetContact(info) {
        let rocket = info.rocket;
        let { lateral, vertical, angle } = info;
        let planet = CollisionManager.checkRocketCollision(info.rocket, info.planets);
        if (planet) {
            if (Math.abs(lateral) > LIMIT_LATERAL || vertical > LIMIT_VERTICAL || angle > LIMIT_ANGLE) {
                this.resolveCrash(info, rocket);
            } else {
                this.resolveLand(info, rocket, planet);
            }

            info.gameOver = planet.isTarget || info.crashed;
        }
        return info;
    }

    /*
     * Analyzes the current game state and returns an object describing it.
     * Includes values such as closest planet, vertical speed compared to
     * that planet's surface, etc.
     */
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
            rocket.setOptimalRotation(getOptimalRotation({
                x: closestPlanet.x, y: closestPlanet.y
            }, { x: rocket.x, y: rocket.y }));

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

    /*
     * Run updates on the game logic.
     */
    update() {
        this.shapeMgr.updateShapePositions();
    }
}

module.exports = { GameLogic }