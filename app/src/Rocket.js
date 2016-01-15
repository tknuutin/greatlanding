
let _ = require('lodash');
let { Sprite } = require('./Shapes');
let { EngineSmoke } = require('./Effects');
let { rads, rotateAroundPoint } = require('./Calc');

const MAIN_THRUST = 0.7;
const ROT_THRUST = 0.8;
const REVERSE_THRUST = 0.35;


class Rocket extends Sprite {
    constructor(opts) {
        super(opts);

        this.rotspeed = 0;
        this.move = {
            vector: {
                x: 0,
                y: 0
            }
        };

        this.engines = {
            main: {
                def: {
                    x: this.width / 2, y: 60,
                    angle: 180, scale: 1, force: 3
                }
            },
            reverse1: {
                def: {
                    x: 7, y: 10,
                    angle: 0, scale: 0.5, force: 2
                }
            },
            reverse2: {
                def: {
                    x: this.width - 7, y: 10,
                    angle: 0, scale: 0.5, force: 2
                }
            },
            left: {
                def: {
                    x: 5, y: 12,
                    angle: 270, scale: 0.5, force: 2
                }
            },
            right: {
                def: {
                    x: this.width - 5, y: 12,
                    angle: 90, scale: 0.5, force: 2
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
        engine.on = isPowered;
        if (isPowered) {
            engine.smoke.start();
        }
        else {
            engine.smoke.stop();
        }
    }

    applyForwardForce(force) {
        let thrust = { x: 0, y: force };
        let newThrust = rotateAroundPoint(rads(this.rotation), { x: 0, y: 0 }, thrust);
        this.move.vector.x += newThrust.x;
        this.move.vector.y += newThrust.y;
    }

    update() {
        if (this.engines.main.on) {
            this.applyForwardForce(-MAIN_THRUST);
        }
        if (this.engines.reverse1.on) {
            this.applyForwardForce(REVERSE_THRUST);
        }
        if (this.engines.left.on) {
            this.rotspeed += ROT_THRUST;
        }
        if (this.engines.right.on) {
            this.rotspeed -= ROT_THRUST;
        }
    }

    renderSmoke(ctx, smoke) {
        smoke.prerender(ctx);
        smoke.render(ctx);
        smoke.postrender(ctx);
    }

    render(ctx) {
        super.render(ctx);
        _.forIn(this.engines, (engine, name) => this.renderSmoke(ctx, engine.smoke));
    }
}

module.exports = { Rocket };
