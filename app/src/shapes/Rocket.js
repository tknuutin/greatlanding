
let _ = require('lodash');
let { Sprite } = require('shapes/Shapes');
let { EngineSmoke } = require('shapes/Effects');
let { rads, rotateAroundPoint } = require('math/Calc');

let { ROCKET } = require('config/GameConfig');
let { MAIN, LEFT, RIGHT, REVERSE } = ROCKET.ENGINES;

/*
 * The player-controllable Rocket instance. Takes in an options object. Subclasses Sprite.
 * - smokeImg: Image instance to use for the engine smoke effects.
 */
class Rocket extends Sprite {
    constructor(opts) {
        super(opts);

        // Is the rocket resting on a planet surface?
        this.launched = false;
        this.optimalRotation = 0;

        // dumb
        this.isRocket = true;

        // Should cut all engine effects immediately?
        this.cutEngines = false;

        this.fuel = ROCKET.START_FUEL;
        this.drawOnMinimap = true;

        this.autolandOn = false;
        this.autolandTurnEnginesCooldown = false;

        this.points = [
            { x: 0, y: -this.height / 2 },
            { x: -this.width / 2, y: this.height / 2 - 5},
            { x: this.width / 2, y: this.height / 2 - 5}
        ];

        this.rotspeed = 0;
        this.move = {
            v: {
                x: 0,
                y: 0
            }
        };

        this.engines = {
            main: {
                def: {
                    x: this.width / 2, y: 60,
                    angle: MAIN.ANGLE, scale: MAIN.SCALE, force: MAIN.FORCE
                }
            },
            reverse1: {
                def: {
                    x: 7, y: 10,
                    angle: REVERSE.ANGLE, scale: REVERSE.SCALE, force: REVERSE.FORCE
                }
            },
            reverse2: {
                def: {
                    x: this.width - 7, y: 10,
                    angle: REVERSE.ANGLE, scale: REVERSE.SCALE, force: REVERSE.FORCE
                }
            },
            left: {
                def: {
                    x: 5, y: 12,
                    angle: LEFT.ANGLE, scale: LEFT.SCALE, force: LEFT.FORCE
                }
            },
            right: {
                def: {
                    x: this.width - 5, y: 12,
                    angle: RIGHT.ANGLE, scale: RIGHT.SCALE, force: RIGHT.FORCE
                }
            }
        };

        _.forIn(this.engines, (engine, name) => {
            engine.on = false;
            let obj = _.cloneDeep(engine.def);
            obj.img = opts.smokeImg;
            engine.smoke = new EngineSmoke(obj);
        });
    }

    _sendSignal(engine, isPowered) {
        if ((this.launched || engine === this.engines.main) &&
            !(this.fuel <= 0 && isPowered)) {

            engine.on = isPowered;
            if (isPowered) {
                engine.smoke.start();
            } else {
                engine.smoke.stop();
            }
        }
    }

    /*
     * Send a start or stop signal to a given engine. Starts smoke effect.
     * - engine: One of the members of rocket.engines.
     * - isPowered: Boolean whether engine should be powered or not.
     */
    sendSignalToEngine(engine, isPowered) {
        if (this.autolandOn && 
            (engine === this.engines.left || engine === this.engines.right)) {
            return;
        }

        this._sendSignal(engine, isPowered);
    }

    setOptimalRotation(rot) {
        this.optimalRotation = rot;
    }

    /*
     * Apply a force pointing in the forward/backward direction of the rocket.
     * - force: Strength of the force, as in the magnitude of the vector.
     */
    applyForwardForce(force) {
        let thrust = { x: 0, y: force };
        let newThrust = rotateAroundPoint(rads(this.rotation), { x: 0, y: 0 }, thrust);
        this.move.v.x += newThrust.x;
        this.move.v.y += newThrust.y;
    }

    /*
     * Get the current fuel as percentage from the starting fuel.
     */
    getFuel() {
        return (this.fuel / ROCKET.START_FUEL) * 100;
    }

    /*
     * Use a given amount of fuel from the reserves.
     */
    useFuel(amount) {
        this.fuel = Math.max(0, this.fuel - amount);
        if (this.fuel <= 0) {
            this._sendSignal(this.engines.main, false);
            this._sendSignal(this.engines.reverse1, false);
            this._sendSignal(this.engines.reverse2, false);
            this._sendSignal(this.engines.left, false);
            this._sendSignal(this.engines.right, false);
        }
    }

    fireEngines() {
        if (this.engines.left.on) {
            this.useFuel(LEFT.THRUST);
            this.rotspeed += LEFT.THRUST;
        }
        if (this.engines.right.on) {
            this.useFuel(RIGHT.THRUST);
            this.rotspeed -= RIGHT.THRUST;
        }

        if (this.engines.left.on) {
            let thrust = this.engines.left.thrust || LEFT.THRUST;
            this.useFuel(thrust);
            this.rotspeed += thrust;
        }
        if (this.engines.right.on) {
            let thrust = this.engines.right.thrust || RIGHT.THRUST;
            this.useFuel(thrust);
            this.rotspeed -= thrust;
        }
    }

    autolandEngineSequence() {
        console.log('autolandengine sequence');
        function getRotationDirection(opt, rot) {
            if (opt <= rot) {
                let dist = rot - opt;
                return dist > 180 ? 1 : -1;
            } else {
                let dist = opt - rot;
                return dist > 180 ? -1 : 1;
            }
        }

        function getRotationDistance(target, current, direction) {
            if (direction === 1) {
                if (target < current) {
                    target += 360;
                }
                return target - current;
            } else {
                if (target > current) {
                    target -= 360;
                }
                return current - target;
            }
        }

        if (this.autolandTurnEnginesCooldown) {
            // console.log('handle engine cooldown');
            return;
        }

        if (this.engines.right.on || this.engines.left.on) {
            return;
        }


        let opt = this.optimalRotation;
        let direction = getRotationDirection(opt, this.rotation);
        let distance = getRotationDistance(opt, this.rotation, direction);

        if (distance < 5) {
            this._sendSignal(this.engines.left, false);
            this._sendSignal(this.engines.right, false);
            this.autolandTurnEnginesCooldown = false;
            clearInterval(this.autolandTurnEnginesInterval);
            return;
        }

        let engine = direction < 0 ? this.engines.right : this.engines.left;
        let maxThrust = direction < 0 ? RIGHT.THRUST : LEFT.THRUST;

        let thrust = null;
        if (distance > 30) {
            thrust = maxThrust;
        } else if (distance > 20) {
            thrust = maxThrust / 3;
        } else if (distance > 10) {
            thrust = maxThrust / 3;
        }
        engine.thrust = thrust;

        this._sendSignal(engine, true);
        console.log('turning on engine:', direction);
        this.autolandTurnEnginesInterval = setTimeout(() => {
            console.log('turning off engine:', direction);
            this._sendSignal(engine, false);
            this.autolandTurnEnginesCooldown = true;
            this.autolandTurnEnginesInterval = setTimeout(() => {
                console.log('re-enabling engine:', direction);
                this.autolandTurnEnginesCooldown = false;
            }, 50);
        }, 50);
    }

    /*
     * Update the engine status and other stats of the Rocket.
     * Applies rocket forces and expends fuel.
     */
    update() {
        if (this.engines.main.on) {
            if (!this.launched) {
                this.launched = true;
            }

            this.useFuel(MAIN.THRUST);
            this.applyForwardForce(-MAIN.THRUST);
        }
        if (this.engines.reverse1.on) {
            this.useFuel(REVERSE.THRUST);
            this.applyForwardForce(REVERSE.THRUST);
        }


        if (this.autolandOn) {
            this.autolandEngineSequence();
        }

        this.fireEngines();
    }

    /*
     * Stop the current movement and rotation of the rocket.
     * Note that this does not stop the effect of gravity.
     */
    stop() {
        this.move.v = { x: 0, y: 0 };
        this.rotspeed = 0;
    }

    /*
     * Get all the collision points of the Rocket.
     */
    getPoints() {
        return _.map(this.points, (point) => rotateAroundPoint(rads(this.rotation), { x: 0, y: 0, }, point));
    }

    /*
     * Render a smoke effect on the context.
     */
    renderSmoke(ctx, smoke) {
        smoke.beforeRender(ctx);
        smoke.render(ctx);
        smoke.afterRender(ctx);
    }

    toggleAutoLand() {
        this.autolandOn = !this.autolandOnfauto;
        if (this.autolandOn) {
            console.log('Autoland on!');
            this.engines.right.thrust = RIGHT.THRUST / 2;
            this.engines.left.thrust = LEFT.THRUST / 2;
        } else {
            if (this.autolandTurnEnginesInterval) {
                clearTimeout(this.autolandTurnEnginesInterval);
            }
            this.engines.right.thrust = null;
            this.engines.left.thrust = null;
            console.log('Autoland off.');
        }

        this.autolandTurnEnginesInterval = null;
        this.autolandTurnEnginesCooldown = false;
        // this.engines.right.turnOffAt = null;
        // this.engines.left.turnOffAt = null;
        this._sendSignal(this.engines.right, false);
        this._sendSignal(this.engines.left, false);
    }

    renderMinimap(ctx) {
        ctx.scale(15, 15);
        ctx.translate(0, -25); // regpoint
        ctx.beginPath();
        ctx.lineTo(30, 50);
        ctx.lineTo(-30, 50);
        ctx.lineTo(0, -50);
        ctx.closePath();
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#ffffff';

        ctx.stroke();
        ctx.translate(50, 50); // regpoint
    }

    /*
     * Render a debug point.
     */
    renderPoint(ctx, p) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, 4, 4);
        ctx.closePath();
        ctx.fillStyle = '#ff0055';
        ctx.fill();
        ctx.restore();
    }

    render(ctx) {
        super.render(ctx);

        if (!this.cutEngines) {
            _.forIn(this.engines, (engine, name) => this.renderSmoke(ctx, engine.smoke));
        }
    }
}

module.exports = { Rocket };
