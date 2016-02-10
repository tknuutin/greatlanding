
let _ = require('lodash');

let { GameLogic } = require('logic/GameLogic');
let { ShapeManager } = require('logic/ShapeManager');
let { GameInitializer, MAPS } = require('logic/GameInitializer');

let GameConfig = require('config/GameConfig');

const FPS = GameConfig.FPS;

/*
 * Top controlling class that takes care of initializing and re-initializing
 * crucial game logic and managers. Takes in an object.
 * - images: An array of objects describing preloaded images.
 * - renderer: the Renderer instance.
 */
class GameController {
    constructor(opts) {
        this.images = opts.images;
        this.renderer = opts.renderer;
        this.mapNum = 0;
        this.onGameLoaded = opts.onGameLoaded;
        this.hasRendered = false;

        this.ui = opts.ui;
        this.focused = true;

        let shapeMgr = new ShapeManager(opts.images);
        this.gameLogic = null;
        this.initializer = new GameInitializer();
        this.shapeManager = shapeMgr;

        this.record = false;
        this.count = 0;

        window.onfocus = this.onFocus.bind(this);
        window.onblur = this.onBlur.bind(this);

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

    /*
     * Reset game state by destroying all and any shapes or other game state.
     */
    reset() {
        this.shapeManager.reset();
        this.ui.reset();
    }

    /*
     * Initialize or re-initialize game state with the map info. Creates shapes,
     * rocket, planets, and other such things.
     */
    init() {
        let mapInfo = this.initializer.initMap(MAPS[this.mapNum]);
        this.shapeManager.initMap(mapInfo.planets, mapInfo.rocketDef);

        this.gameLogic = new GameLogic(mapInfo, this.images, this.shapeManager);
        this.ui.createIndicator(mapInfo.targetPoint, 'Target');

        // This is hacky - should generate the whole effect beforehand and pass it to renderer
        // as a regular UI shape
        this.renderer.setUIEffectInfo({
            planets: this.shapeManager.planets
        })
    }

    /*
     * Game logic tick. Delegates calls to other game logic classes and handles graceful crashing.
     */
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

    /*
     * Creates the function for the game loop. Returns a function that will
     * run the game logic as many times as we should since last time the function was ran,
     * then renders the state.
     *
     * Forces game logic to run at FPS. Render steps may be skipped but will be caught up
     * in a weird jerk if needed, that might need to be refactored?
     *
     * Modified from: http://nokarma.org/2011/02/02/javascript-game-development-the-game-loop/
     */
    createStepFunction() {
        // Current number of logic loops done without a render.
        let loops = 0;

        // The amount of time between each render.
        let timeBetweenSteps = 1000 / FPS;

        // Max amount of render frames we can skip before we need to a render no matter what.
        let maxFrameSkip = 1000;

        // When the next game step should happen.
        let nextGameStep = (new Date()).getTime();

        return () => {
            loops = 0;

            while ((new Date()).getTime() > nextGameStep && loops < maxFrameSkip && this.focused) {
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

                this.renderer.updateEffects(shapes, this.lastInfo, camera);
                this.renderer.render(shapes, camera);
                this.renderer.renderUI(this.ui.getShapes());
                this.renderer.renderMinimap(shapes, camera);

                // Right now only considering the game loaded once we render once,
                // because of all our prerendering stuff!
                if (!this.hasRendered) {
                    this.hasRendered = true;
                    this.onGameLoaded();
                }

                this.stopped = this.lastInfo.stop;
            }
        };
    }

    onBlur() {
        this.focused = false;
    }

    onFocus() {
        this.focused = true;
    }

    /*
     * Start the game loop.
     */
    startLoop() {
        let step = this.createStepFunction();
        let nextFrame = () => {
            step();
            if (!this.stopped) {
                if (this.focused) {
                    window.requestAnimationFrame(nextFrame);
                }
            } else {
                console.warn('Stopped!');
            }
        };

        nextFrame();
    }
}

module.exports = { GameController };
