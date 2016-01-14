
let _ = require('lodash');
let { Rectangle, Sprite } = require('./Shapes');
let { Renderer } = require('./Renderer');
let { KeyboardTracker } = require('./Trackers');

const FPS = 30;

const MAIN_THRUST = 0.7;
const ROT_THRUST = 1.5;
const REVERSE_THRUST = 0.7;

function rads(deg){
    return (Math.PI / 180) * deg;
};

function rotateAroundPoint(rotation, rotationpoint, inPoint) {
    // http://stackoverflow.com/questions/3249083/is-this-how-rotation-about-a-point-is-done
    var point = {
        x: inPoint.x,
        y: inPoint.y,
    };

    // Translate
    var translatedX = point.x - rotationpoint.x;
    var translatedY = point.y - rotationpoint.y;

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
        }

        this.mainEngineOn = false;
    }

    applyForwardForce(force) {
        let thrust = { x: 0, y: force };
        let newThrust = rotateAroundPoint(rads(this.rotation), { x: 0, y: 0 }, thrust);
        this.move.vector.x += newThrust.x;
        this.move.vector.y += newThrust.y;
    }

    setMainEngine(status) {
        this.mainEngineOn = status;
    }

    update() {
        if (this.mainEngineOn) {
            this.applyForwardForce(-MAIN_THRUST);
        }
    }
}

class ShapeManager {
    constructor(images) {
        this.shapes = [];

        console.log('images', images);

        this.addShape(new Rectangle({
            x: 0, y: 0,
            width: 500, height: 400,
            fillStyle: '#000'
        }));

        this.rocket = new Rocket({
            img: images['rocket.png'],
            x: 100, y: 100,
            rotation: 30,
            width: 114 / 4, height: 275 / 4,
            regX: 114 / 8, regY: 275 / 8
        });

        this.addShape(this.rocket);
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

            renderer.logFps();
        }

        let rocket = this.shapeManager.rocket;
        this.keyInputs = {
            onForwardDown: () => {
                rocket.setMainEngine(true);
            },
            onForwardUp: () => {
                rocket.setMainEngine(false);
            },
            onReverseDown: () => {
                applyForwardForce(REVERSE_THRUST);
            },
            onRightDown: () => {
                rocket.rotspeed += ROT_THRUST;
            },
            onLeftDown: () => {
                rocket.rotspeed -= ROT_THRUST;
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
        onRightDown: game.keyInputs.onRightDown,
        onLeftDown: game.keyInputs.onLeftDown
    });

    game.start();
}

window.onload = function onAppLoad() {
    preloadImages(_.map([
        'rocket.png'
    ])).then((images) => {
        startApp(_.reduce(images, (imageMap, value) => {
            imageMap[value.path] = value.img;
            return imageMap;
        }, {}));
    })
};

