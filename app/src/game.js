
let _ = require('lodash');
let { Rectangle, Sprite } = require('./Shapes');
let { Renderer } = require('./Renderer');
let { KeyboardTracker } = require('./Trackers');
let { EngineSmoke } = require('./Effects');

const FPS = 30;

const MAIN_THRUST = 0.7;
const ROT_THRUST = 1.2;
const REVERSE_THRUST = 0.35;

function rads(deg) {
    return (Math.PI / 180) * deg;
}

function rotateAroundPoint(rotation, rotationpoint, inPoint) {
    // http://stackoverflow.com/questions/3249083/is-this-how-rotation-about-a-point-is-done
    let point = {
        x: inPoint.x,
        y: inPoint.y
    };

    // Translate
    let translatedX = point.x - rotationpoint.x;
    let translatedY = point.y - rotationpoint.y;

    point.x = Math.cos(rotation) * translatedX - Math.sin(rotation) * translatedY;
    point.y = Math.sin(rotation) * translatedX + Math.cos(rotation) * translatedY;

    // Translate back
    point.x += rotationpoint.x;
    point.y += rotationpoint.y;

    return point;
}

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


        // this.mainEngineOn = false;
        // this.mainSmoke = new EngineSmoke({
        //     img: opts.smokeImg,
        //     x: this.width / 2, y: 60,
        //     angle: 180,
        //     scale: 1,
        //     force: 3
        // });

        // this.reverseEngineOn = false;
        // this.reverseSmoke1 = new EngineSmoke({
        //     img: opts.smokeImg,
        //     x: 7, y: 10,
        //     angle: 0,
        //     scale: 0.5,
        //     force: 2
        // });
        // this.reverseSmoke2 = new EngineSmoke({
        //     img: opts.smokeImg,
        //     x: this.width - 7, y: 10,
        //     angle: 0,
        //     scale: 0.5,
        //     force: 2
        // });
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

    // setMainEngine(isOn) {
    //     this.mainEngineOn = isOn;
    //     if (isOn) {
    //         this.mainSmoke.start();
    //     }
    //     else {
    //         this.mainSmoke.stop();
    //     }
    // }

    // setReverseEngines(isOn) {
    //     this.reverseEngineOn = isOn;
    //     if (isOn) {
    //         this.reverseSmoke1.start();
    //         this.reverseSmoke2.start();
    //     }
    //     else {
    //         this.reverseSmoke1.stop();
    //         this.reverseSmoke2.stop();
    //     }
    // }

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

class ShapeManager {
    constructor(images) {
        this.shapes = [];

        this.addShape(new Rectangle({
            x: 0, y: 0,
            width: 500, height: 400,
            fillStyle: '#000'
        }));

        this.rocket = new Rocket({
            smokeImg: images['cloud.png'],
            img: images['rocket.png'],
            x: 100, y: 200,
            rotation: 30,
            width: 114 / 4, height: 275 / 4,
            regX: 114 / 8, regY: (275 / 8) + 5  // Adding five so it looks like the approx central mass point
        });
        this.addShape(this.rocket);

        // smoke.start();
        // setTimeout(() => {
        //     console.log('stopped');
        //     smoke.stop();
        // }, 2000);

        // this.addShape(smoke);
    }

    updateShapePositions() {
        _.forEach(this.shapes, (shape) => {
            if (shape.update) {
                shape.update();
            }

            if (shape.move && !shape.move.stopped) {
                shape.x += shape.move.vector.x;
                shape.y += shape.move.vector.y;
            }

            if (shape.rotspeed) {
                shape.rotation += shape.rotspeed;
            }
        });
    }

    getShapes() {
        return this.shapes;
    }

    addShape(shape) {
        this.shapes.push(shape);
    }

}

class Game {
    constructor(opts) {
        this.shapes = [];
        this.renderer = opts.renderer;
        this.shapeManager = new ShapeManager(opts.images);

        this.record = false;
        this.count = 0;

        if (this.record) {
            setInterval(() => {
                console.log('logic:', this.count);
                this.count = 0;
            }, 1000);
        }

        let rocket = this.shapeManager.rocket;
        this.keyInputs = {
            onForwardDown: () => {
                rocket.sendSignalToEngine(rocket.engines.main, true);
            },
            onForwardUp: () => {
                rocket.sendSignalToEngine(rocket.engines.main, false);
            },
            onReverseDown: () => {
                rocket.sendSignalToEngine(rocket.engines.reverse1, true);
                rocket.sendSignalToEngine(rocket.engines.reverse2, true);
            },
            onReverseUp: () => {
                rocket.sendSignalToEngine(rocket.engines.reverse1, false);
                rocket.sendSignalToEngine(rocket.engines.reverse2, false);
            },
            onRightDown: () => {
                rocket.sendSignalToEngine(rocket.engines.left, true);
            },
            onRightUp: () => {
                rocket.sendSignalToEngine(rocket.engines.left, false);
                // rocket.rotspeed += ROT_THRUST;
            },
            onLeftDown: () => {
                rocket.sendSignalToEngine(rocket.engines.right, true);
                // rocket.rotspeed -= ROT_THRUST;
            },
            onLeftUp: () => {
                rocket.sendSignalToEngine(rocket.engines.right, false);
                // rocket.rotspeed -= ROT_THRUST;
            }
        };
    }

    logicUpdate() {
        if (this.record) {
            this.count++;
        }

        try {
            this.shapeManager.updateShapePositions();
            // if (Math.random() > 0.8) {
            //     throw new Error('butt');
            // }
        }
        catch (e) {
            console.error(e.stack);
            this.stopped = true;
        }
    }

    createStepFunction() {
        // Modified from: http://nokarma.org/2011/02/02/javascript-game-development-the-game-loop/
        let loops = 0;
        let timeBetweenSteps = 1000 / FPS;
        let maxFrameSkip = 10;
        let nextGameStep = (new Date()).getTime();

        return () => {
            loops = 0;

            while ((new Date()).getTime() > nextGameStep && loops < maxFrameSkip) {
                this.logicUpdate();
                nextGameStep += timeBetweenSteps;
                loops++;
            }

            if (loops) {
                this.renderer.render(this.shapeManager.getShapes());
            }

            // setTimeout(() => {
            //     this.stopped = true;
            // }, 4000);
        };
    }

    start() {
        let step = this.createStepFunction();
        let nextFrame = () => {
            step();
            if (!this.stopped) {
                window.requestAnimationFrame(nextFrame);
            }
            else {
                console.warn('Stopped!');
            }
        }
        nextFrame();
    }

    getShapes() {
        return this.shapes;
    }
}

function preloadImages(sources) {
    return Promise.all(_.map(sources, (path) => {
        return new Promise((resolve, reject) => {
            let img = new Image();
            img.onload = () => {
                resolve({ img, path });
            };
            img.onerror = () => {
                console.error('error!', path);
                reject();
            };
            img.src = 'public/assets/img/' + path;
        });
    }));
};

function startApp(images) {
    let canvas = document.getElementById('gamecanvas');

    let renderer = new Renderer({
        canvas,
        width: 500, height: 400
    });

    let game = new Game({
        images, renderer
    });

    let kb = new KeyboardTracker({
        onForwardDown: game.keyInputs.onForwardDown,
        onForwardUp: game.keyInputs.onForwardUp,

        onReverseDown: game.keyInputs.onReverseDown,
        onReverseUp: game.keyInputs.onReverseUp,

        onRightDown: game.keyInputs.onRightDown,
        onRightUp: game.keyInputs.onRightUp,
        onLeftDown: game.keyInputs.onLeftDown,
        onLeftUp: game.keyInputs.onLeftUp,
    });

    game.start();
}

window.onload = function onAppLoad() {
    preloadImages(_.map([
        'rocket.png',
        'cloud.png'
    ])).then((images) => {
        startApp(_.reduce(images, (imageMap, value) => {
            imageMap[value.path] = value.img;
            return imageMap;
        }, {}));
    })
};

