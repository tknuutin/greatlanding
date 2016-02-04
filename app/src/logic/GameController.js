let _ = require('lodash');

let { GameLogic } = require('logic/GameLogic');
let { ShapeManager } = require('logic/ShapeManager');
let { GameInitializer, MAPS } = require('logic/GameInitializer');

let GameConfig = require('config/GameConfig');

const FPS = GameConfig.FPS;

class GameController {
    constructor(opts) {
        this.images = opts.images;
        this.shapes = [];
        this.renderer = opts.renderer;
        this.mapNum = 0;

        this.ui = opts.ui;

        let shapeMgr = new ShapeManager(opts.images);
        this.gameLogic = null;
        this.initializer = new GameInitializer();
        this.shapeManager = shapeMgr;

        this.record = false;
        this.count = 0;

        if (this.record) {
            setInterval(() => {
                this.count = 0;
            }, 1000);
        }

        this.keyInputs = _.chain({
            onForwardDown: (rocket) => {
                rocket.sendSignalToEngine(rocket.engines.main, true);
            },
            onForwardUp: (rocket) => {
                rocket.sendSignalToEngine(rocket.engines.main, false);
            },
            onReverseDown: (rocket) => {
                rocket.sendSignalToEngine(rocket.engines.reverse1, true);
                rocket.sendSignalToEngine(rocket.engines.reverse2, true);
            },
            onReverseUp: (rocket) => {
                rocket.sendSignalToEngine(rocket.engines.reverse1, false);
                rocket.sendSignalToEngine(rocket.engines.reverse2, false);
            },
            onRightDown: (rocket) => {
                rocket.sendSignalToEngine(rocket.engines.left, true);
            },
            onRightUp: (rocket) => {
                rocket.sendSignalToEngine(rocket.engines.left, false);
            },
            onLeftDown: (rocket) => {
                rocket.sendSignalToEngine(rocket.engines.right, true);
            },
            onLeftUp: (rocket) => {
                rocket.sendSignalToEngine(rocket.engines.right, false);
            }
        }).reduce((result, func, key) => {
            result[key] = () => func(shapeMgr.getRocket());
            return result;
        }, {}).merge({
            onSpace: () => {
                this.reset();
                this.init();
                this.doneWithReset = Date.now();
            }
        }).value();

        this.init();

    }

    reset() {
        this.shapeManager.reset();
        this.ui.reset();
    }

    init() {
        this.gameLogic = new GameLogic(this.images, this.shapeManager);
        let mapInfo = this.initializer.initMap(MAPS[this.mapNum]);
        this.shapeManager.initMap(mapInfo.planets, mapInfo.rocketDef);
        this.ui.createIndicator(mapInfo.targetPoint, 'Target');
    }

    logicUpdate() {
        if (this.record) {
            this.count++;
        }

        try {
            this.gameLogic.update();
            let info = this.gameLogic.analyze();
            if (info.stop) {
                this.stop = true;
            }

            if (info.gameOver) {
                this.gameOver = true;
            }

            this.lastInfo = info;
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
                let rocket = this.shapeManager.getRocket();
                if (rocket) {
                    this.ui.update(this.lastInfo);
                }

                let shapes = this.shapeManager.getShapes();
                let camera = rocket ? {
                    x: rocket.x, y: rocket.y
                } : { x: 0, y: 0 };

                this.renderer.updateEffects(shapes, this.lastInfo, rocket, camera);
                this.renderer.render(shapes, camera);
                this.renderer.renderUI(this.ui.getShapes());
                this.stopped = this.lastInfo.stop;
            }
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

module.exports = { GameController };
