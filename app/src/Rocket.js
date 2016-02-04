
let _ = require('lodash');
let { Sprite } = require('./Shapes');
let { EngineSmoke } = require('./Effects');
let { rads, rotateAroundPoint } = require('./Calc');

let { ROCKET } = require('./GameConfig');
let { MAIN, LEFT, RIGHT, REVERSE } = ROCKET.ENGINES;

class Rocket extends Sprite {
    constructor(opts) {
        super(opts);

        this.launched = false;
        this.isRocket = true;
        this.cutEngines = false;

        this.fuel = ROCKET.START_FUEL;

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

    sendSignalToEngine(engine, isPowered) {
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

    applyForwardForce(force) {
        let thrust = { x: 0, y: force };
        let newThrust = rotateAroundPoint(rads(this.rotation), { x: 0, y: 0 }, thrust);
        this.move.v.x += newThrust.x;
        this.move.v.y += newThrust.y;
    }

    getFuel() {
        return (this.fuel / ROCKET.START_FUEL) * 100;
    }

    useFuel(amount) {
        this.fuel = Math.max(0, this.fuel - amount);
        if (this.fuel <= 0) {
            this.sendSignalToEngine(this.engines.main, false);
            this.sendSignalToEngine(this.engines.reverse1, false);
            this.sendSignalToEngine(this.engines.reverse2, false);
            this.sendSignalToEngine(this.engines.left, false);
            this.sendSignalToEngine(this.engines.right, false);
        }
    }

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
        if (this.engines.left.on) {
            this.useFuel(LEFT.THRUST);
            this.rotspeed += LEFT.THRUST;
        }
        if (this.engines.right.on) {
            this.useFuel(RIGHT.THRUST);
            this.rotspeed -= RIGHT.THRUST;
        }
    }

    stop() {
        this.move.v = { x: 0, y: 0 };
        this.rotspeed = 0;
    }

    getPoints() {
        return _.map(this.points, (point) => rotateAroundPoint(rads(this.rotation), { x: 0, y: 0, }, point));
    }

    renderSmoke(ctx, smoke) {
        smoke.prerender(ctx);
        smoke.render(ctx);
        smoke.postrender(ctx);
    }

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
