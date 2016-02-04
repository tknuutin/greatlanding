
let _ = require('lodash');
let { GameController } = require('logic/GameController');
let { Renderer } = require('render/Renderer');
let { KeyboardTracker } = require('input/Trackers');
let { GameUI } = require('render/GameUI');

function startApp(opts) {
    let canvas = document.getElementById('gamecanvas');
    let { images } = opts;

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

    game.start();
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
            }, {})
        });
    });
};

