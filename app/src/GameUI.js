
let _ = require('lodash');
let { RoundedRectangle, TextNode } = require('./Shapes');
let { Indicator, getIndicatorPos } = require('./Indicator');
let { distancePoints } = require('./Calc');

const UI_BG_COLOR = '#2E2E2E';
const UI_BG_ALPHA = 0.9;

const UI_TEXT_COLOR = '#575757';
const UI_TEXT_STROKE = '#000'
// const UI_TEXT_COLOR = '#ff0055';
const UI_TEXT_SIZE = 14;
const UI_FONT = 'Play';

const O_LEFT = 15;
const O_TOP = 15;
const O_TOP_SECOND = 75;
const COLUMN = 55;
const ROW = 25;

function round(num) {
    return Math.round(num * 100) / 100;
}



class GameUI {
    constructor(targetPlanet) {
        this.box1 = new RoundedRectangle({
            x: 10, y: 10, name: 'upper',
            width: 200, height: 50,
            fillStyle: UI_BG_COLOR,
            alpha: UI_BG_ALPHA
        });

        this.box2 = new RoundedRectangle({
            x: 10, y: 70, name: 'lower',
            width: 200, height: 75,
            fillStyle: UI_BG_COLOR,
            alpha: UI_BG_ALPHA
        });

        this.nodes = _.map([
            {
                x: O_LEFT, y: O_TOP,
                getText: (info) => {
                    return 'X: ' + Math.round(info.rocket.x);
                }
            },
            {
                x: O_LEFT + COLUMN, y: O_TOP,
                getText: (info) => {
                    return 'Y: ' + Math.round(info.rocket.y);
                }
            },
            {
                x: O_LEFT + (COLUMN * 2), y: O_TOP,
                getText: (info) => {
                    return 'Speed: ' + round(info.speed);
                }
            },
            {
                x: O_LEFT, y: O_TOP + ROW,
                getText: (info) => {
                    return 'Rotation: ' + round(info.rocket.rotation);
                }
            },
            {
                x: O_LEFT, y: O_TOP_SECOND,
                getText: (info) => {
                    return 'Lateral speed: ' + round(info.lateral);
                }
            },
            {
                x: O_LEFT, y: O_TOP_SECOND + ROW,
                getText: (info) => {
                    return 'Vertical speed: ' + round(info.vertical);
                }
            },
            {
                x: O_LEFT, y: O_TOP_SECOND + (ROW * 2),
                getText: (info) => {
                    return 'Landing angle: ' + round(info.abgke);
                }
            }
        ], (node) => {
            node.shape = new TextNode({
                x: node.x, y: node.y,
                fillStyle: UI_TEXT_COLOR,
                fontFamily: UI_FONT,
                fontSize: UI_TEXT_SIZE
            });
            return node;
        });

        this.indicators = [];

        this.shapes = _.reduce(this.indicators, (result, indicator) => {
            return result.concat(indicator.getShapes());
        }, []).concat([
            this.box1, this.box2
        ]).concat(_.map(this.nodes, (node) => node.shape));
    }

    createIndicator(point, text) {
        let ind = new Indicator({
            point: point,
            text: text,
            offset: 50
        });
        this.indicators.push(ind);
        this.shapes = ind.getShapes().concat(this.shapes);
    }

    update(info) {
        _.each(this.nodes, (node) => {
            node.shape.setText(node.getText(info));
        });

        _.each(this.indicators, (indicator) => {
            indicator.update(getIndicatorPos(indicator, 700, 500, info.rocket), distancePoints(indicator.point, info.rocket));
        });
    }

    getShapes() {
        return this.shapes;
    }
}

module.exports = { GameUI };