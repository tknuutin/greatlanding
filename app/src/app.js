
/*
 * App entry point. Preloads images and initializes the game, UI, and input.
 */
let _ = require('lodash');
let { GameController } = require('logic/GameController');
let { Renderer } = require('render/Renderer');
let { KeyboardTracker } = require('input/Trackers');
let { GameUI } = require('render/GameUI');

/*
 * Start app by instantiating renderer, UI, and game controller. Takes in an object.
 * Object properties:
 * - canvas: A canvas HTML node
 * - images: Array of objects that describe preloaded images
 */
function startApp(opts) {
    let { canvas, images } = opts;

    let renderer = new Renderer({
        background: images['spacebg.jpg'],
        canvas,
        width: 700, height: 500
    });

    let game = new GameController({
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
        onLeftUp: game.keyInputs.onLeftUp,
        onSpace: game.keyInputs.onSpace
    });

    game.startLoop();
}

const ASSET_PATH = 'public/assets/img/';

/*
 * Preloads images and return a promise that resolves with an array of objects with the Image and path string.
 */
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
            img.src = ASSET_PATH + path;
        });
    }));
}



/*
 * On window load, start application.
 */
window.onload = function onAppLoad() {
    preloadImages([
        'rocket.png',
        'cloud.png',
        'spacebg.jpg',
        'explosion.png'
    ]).then((images) => startApp({
        images: _.reduce(images, (imageMap, value) => {
            imageMap[value.path] = value.img;
            return imageMap;
        }, {}),
        canvas: document.getElementById('gamecanvas')
    }));
};

