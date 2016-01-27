
let _ = require('lodash');
let { Renderer } = require('./Renderer');
let { KeyboardTracker } = require('./Trackers');
let { GameLogic } = require('./GameLogic');
let { ShapeManager } = require('./ShapeManager');
let { GameUI } = require('./GameUI');

const FPS = 30;

class Game {
    constructor(opts) {
        this.shapes = [];
        this.renderer = opts.renderer;

        this.ui = opts.ui;

        this.shapeManager = new ShapeManager(opts.images, [
            {
                name: 'Base',
                x: 200, y: 1700,
                gravity: 13,
                size: 3000, fillStyle: '#85889E',
                atmsSize: 3800,
                // In RGB to avoid converting when we use a rgba string in a gradient
                atmsColor: [179, 232, 255]
            },
            {
                name: 'Target',
                x: 3500, y: -100,
                gravity: 12.5,
                size: 2700,
                fillStyle: '#9E8593',
                atmsSize: 3400,
                atmsColor: [255, 207, 253]
            }
        ]);

        this.gameLogic = new GameLogic(opts.images, this.shapeManager);
        this.debug = {
            getShapes: () => {
                return [];
            }
        };

        this.record = false;
        this.count = 0;

        if (this.record) {
            setInterval(() => {
                // console.log('logic:', this.count);
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
        } catch (e) {
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
                    this.ui.update(this.lastInfo);
                }

                let shapes = this.shapeManager.getShapes().concat(this.debug.getShapes());
                let camera = {
                    x: this.rocket.x, y: this.rocket.y
                };

                this.renderer.updateEffects(shapes, this.lastInfo, this.rocket, camera);
                this.renderer.render(shapes, camera);
                this.renderer.renderUI(this.ui.getShapes());

                this.stopped = this.lastInfo.stop;
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
            } else {
                console.warn('Stopped!');
            }
        };

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
}

function startApp(opts) {
    let canvas = document.getElementById('gamecanvas');
    let { images, updateUI } = opts;

    let renderer = new Renderer({
        background: images['spacebg.jpg'],
        canvas,
        width: 700, height: 500
    });

    let game = new Game({
        images, ui: new GameUI(), renderer
    });

    let kb = new KeyboardTracker({
        onForwardDown: game.keyInputs.onForwardDown,
        onForwardUp: game.keyInputs.onForwardUp,

        onReverseDown: game.keyInputs.onReverseDown,
        onReverseUp: game.keyInputs.onReverseUp,

        onRightDown: game.keyInputs.onRightDown,
        onRightUp: game.keyInputs.onRightUp,
        onLeftDown: game.keyInputs.onLeftDown,
        onLeftUp: game.keyInputs.onLeftUp
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
            } else {
                lateral.innerHTML = '';
                vertical.innerHTML = '';
            }

        };
    })();
}

window.onload = function onAppLoad() {
    preloadImages(_.map([
        'rocket.png',
        'cloud.png',
        'spacebg.jpg',
        'explosion.png'
    ])).then((images) => {

        startApp({
            images: _.reduce(images, (imageMap, value) => {
                imageMap[value.path] = value.img;
                return imageMap;
            }, {}),
            updateUI: createUpdateUI()
        });
    })
};

