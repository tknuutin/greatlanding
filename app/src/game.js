
let _ = require('lodash');
let { Rectangle } = require('./Shapes');
let { Planet } = require('./Planet');
let { Rocket } = require('./Rocket');
let { Renderer } = require('./Renderer');
let { KeyboardTracker } = require('./Trackers');
let { GameLogic } = require('./GameLogic');
let { clampRot } = require('./Calc');
let { getPlanetLateralSpeed, getPlanetVerticalSpeed } = require('./Calc');

const FPS = 30;

class ShapeManager {
    constructor(images, planets) {
        this.shapes = [];

        this.planets = _.map(planets, (planetDef) => {
            let planet = new Planet(planetDef);
            this.addShape(planet);
            return planet;
        });

        this.addShape(new Rectangle({
            x: 10, y: 10,
            width: 50, height: 50,
            fillStyle: '#ff0000'
        }));

        this.rocket = new Rocket({
            smokeImg: images['cloud.png'],
            img: images['rocket.png'],
            x: -100, y: 150,
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
                shape.x += shape.move.v.x;
                shape.y += shape.move.v.y;
            }

            if (shape.rotspeed) {
                shape.rotation += shape.rotspeed;
                shape.rotation = clampRot(shape.rotation);
            }
        });
    }

    getShapes() {
        return this.shapes;
    }

    addShape(shape) {
        this.shapes.push(shape);
    }

    removeShape(shape) {
        _.pull(this.shapes, shape);
    }

}

class Game {
    constructor(opts) {
        this.shapes = [];
        this.renderer = opts.renderer;

        this.shapeManager = new ShapeManager(opts.images, [
            {
                name: 'Home',
                x: 200, y: 1700,
                size: 3000, fillStyle: '#85889E',
                atmsSize: 3500,
                // In RGB to avoid converting when we use a rgba string in a gradient
                atmsColor: [179, 232, 255]
            }
        ]);

        this.gameLogic = new GameLogic(opts.images, this.shapeManager);
        this.debug = {
            getShapes: () => { return []; }
        };

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
            },
            onLeftDown: () => {
                rocket.sendSignalToEngine(rocket.engines.right, true);
            },
            onLeftUp: () => {
                rocket.sendSignalToEngine(rocket.engines.right, false);
            }
        };
        this.rocket = rocket;
    }

    logicUpdate() {
        if (this.record) {
            this.count++;
        }

        try {
            if (!this.gameOver) {
                this.gameLogic.update();
                let info = this.gameLogic.analyze();
                if (info.stop) {
                    this.stop = true;
                }

                if (info.gameOver) {
                    this.gameOver = true;
                }

                this.lastInfo = info;
            }
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
                if (this.rocket) {
                    updateUI(this.lastInfo);
                }

                let shapes = this.shapeManager.getShapes().concat(this.debug.getShapes());
                let camera = {
                    x: this.rocket.x, y: this.rocket.y
                };

                this.renderer.updateEffects(shapes, this.lastInfo, this.rocket, camera);
                this.renderer.render(shapes, camera);
                // this.stopped = true;
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

function updateUI() {
    // nothing here
}

function startApp(images) {
    let canvas = document.getElementById('gamecanvas');

    let renderer = new Renderer({
        background: images['spacebg.jpg'],
        canvas,
        width: 700, height: 500
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

function createUpdateUI() {
    return (() => {
        let uix = document.getElementById('ui-x');
        let uiy = document.getElementById('ui-y');
        let uispeed = document.getElementById('ui-speed');
        let uirotation = document.getElementById('ui-rotation');
        let landing = document.getElementById('ui-landing');
        let lateral = document.getElementById('ui-lateral');
        let vertical = document.getElementById('ui-vertical');
        let langle = document.getElementById('ui-langle');

        return (state) => {
            let rocket = state.rocket;
            uix.innerHTML = Math.round(rocket.x);
            uiy.innerHTML = Math.round(rocket.y);
            let round = (num) => Math.round(num * 100) / 100;
            uispeed.innerHTML = round(state.speed);
            uirotation.innerHTML = round(rocket.rotation);
            landing.innerHTML = state.landing + '';

            if (state.landing) {
                lateral.innerHTML = round(state.lateral);
                vertical.innerHTML = round(state.vertical);
                langle.innerHTML = round(state.angle);
            }
            else {
                lateral.innerHTML = '';
                vertical.innerHTML = '';
            }

        };
    })();
}

window.onload = function onAppLoad() {
    updateUI = createUpdateUI();

    preloadImages(_.map([
        'rocket.png',
        'cloud.png',
        'spacebg.jpg',
        'explosion.png'
    ])).then((images) => {
        startApp(_.reduce(images, (imageMap, value) => {
            imageMap[value.path] = value.img;
            return imageMap;
        }, {}));
    })
};

