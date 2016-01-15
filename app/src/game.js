
let _ = require('lodash');
let { Rectangle } = require('./Shapes');
let { Rocket } = require('./Rocket');
let { Renderer } = require('./Renderer');
let { KeyboardTracker } = require('./Trackers');


const FPS = 30;

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

