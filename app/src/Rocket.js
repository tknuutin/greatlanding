
let _ = require('lodash');
let { Sprite } = require('./Shapes');
let { EngineSmoke } = require('./Effects');
let { rads, rotateAroundPoint } = require('./Calc');

const MAIN_THRUST = 0.6;
const ROT_THRUST = 0.4;
const REVERSE_THRUST = 0.3;


class Rocket extends Sprite {
    constructor(opts) {
        super(opts);

        // this.launched = false;
        this.launched = true;
        this.launching = false;

        this.isRocket = true;

        this.cutEngines = false;

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
        this.move.v.x += newThrust.x;
        this.move.v.y += newThrust.y;
    }

    update() {
        if (this.engines.main.on) {
            if (!this.launched && !this.launching) {
                this.launching = true;
                setTimeout(function() {
                    this.launched = true;
                    console.log('launched!');
                    this.launching = false;
                }, 500);
            }

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
        // if (true) {
        //     this.renderPoint(ctx, this.points[0]);
        // }

        if (!this.cutEngines) {
            _.forIn(this.engines, (engine, name) => this.renderSmoke(ctx, engine.smoke));
        }
    }
}

module.exports = { Rocket };
