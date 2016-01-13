
let _ = require('lodash');
let { Rectangle } = require('./Shapes');
let { RenderLoop } = require('./RenderLoop');

class Game {
    constructor() {
        this.shapes = [];

        this.addShape(new Rectangle({
            x: 0, y: 0,
            width: 500, height: 400,
            fillStyle: '#e5e5e5'
        }));

        this.addShape(new Rectangle({
            x: 10, y: 10,
            width: 50, height: 50,
            fillStyle: '#ff0055'
        }));
    }

    getShapes() {
        return this.shapes;
    }

    addShape(shape) {
        this.shapes.push(shape);
    }
}

function startApp() {
    let canvas = document.getElementById('gamecanvas');
    let game = new Game();
    window.myGame = game;

    let renderLoop = new RenderLoop({
        canvas,
        width: 500, height: 400,
        fetchShapes: _.bind(game.getShapes, game)
    });

    renderLoop.start();
    console.log('started!');
    renderLoop.render();
    console.log('rendered!')
};

window.onload = function onAppLoad(){
    startApp();
};

