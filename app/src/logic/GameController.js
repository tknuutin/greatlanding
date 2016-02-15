
let _ = require('lodash');

let { GameLogic } = require('logic/GameLogic');
let { ShapeManager } = require('logic/ShapeManager');
let { InputMediator } = require('input/InputMediator');
let { GameLoop } = require('logic/GameLoop');
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
        this.onGameLoading = opts.onGameLoading;
        this.onGameLoaded = opts.onGameLoaded;


        this.waitNextLevelCommand = false;

        this.ui = opts.ui;

        let shapeMgr = new ShapeManager(opts.images);
        this.gameLogic = null;
        this.initializer = new GameInitializer();
        this.shapeManager = shapeMgr;

        this.loop = new GameLoop({
            renderer: opts.renderer,
            report: this.onGameStep.bind(this),
            onRendered: this.onRendered.bind(this)
        });

        window.onfocus = this.onFocus.bind(this);
        window.onblur = this.onBlur.bind(this);

        if (this.record) {
            setInterval(() => {
                this.count = 0;
            }, 1000);
        }

        this.keyInputs = InputMediator.getDefaultBinds(this.shapeManager, this);
        this.init();
    }

    onRendered() {
        this.onGameLoaded();
    }

    onGameStep() {
        
    }

    nextMap() {
        if (this.mapNum + 1 < MAPS.length) {
            this.mapNum++;
            this.onGameLoading();
            this.reset();
            this.hasRendered = false;
            this.init();
        } else {
            this.
        }
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
        });
    }

    onBlur() {
        this.loop.setFocused(false);
    }

    onFocus() {
        this.loop.setFocused(true);
    }

    start() {
        this.loop.startLoop();
    }
}

module.exports = { GameController };
