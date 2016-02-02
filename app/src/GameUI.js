
let _ = require('lodash');
let { RoundedRectangle, TextNode } = require('./Shapes');
let { Indicator, getIndicatorPos } = require('./Indicator');
let { distancePoints } = require('./Calc');
let GameConfig = require('./GameConfig');
let UI = GameConfig.UI;

function round(num) {
    return Math.round(num * 100) / 100;
}

class GameUI {
    constructor(targetPlanet) {
        this.box1 = new RoundedRectangle({
            x: 10, y: 10, name: 'upper',
            width: 200, height: 50,
            fillStyle: UI.BG_COLOR,
            alpha: UI.BG_ALPHA
        });

        this.landingInfoDisplayed = true;

        this.box2 = new RoundedRectangle({
            x: 10, y: 70, name: 'lower',
            width: 200, height: 75,
            fillStyle: UI.BG_COLOR,
            alpha: UI.BG_ALPHA
        });

        this.nodes = _.map([
            {
                x: UI.O_LEFT, y: UI.O_TOP,
                getText: (info) => {
                    return 'X: ' + Math.round(info.rocket.x);
                }
            },
            {
                x: UI.O_LEFT + UI.COLUMN, y: UI.O_TOP,
                getText: (info) => {
                    return 'Y: ' + Math.round(info.rocket.y);
                }
            },
            {
                x: UI.O_LEFT + (UI.COLUMN * 2), y: UI.O_TOP,
                getText: (info) => {
                    return 'Speed: ' + round(info.speed);
                }
            },
            {
                x: UI.O_LEFT, y: UI.O_TOP + UI.ROW,
                getText: (info) => {
                    return 'Rotation: ' + round(info.rocket.rotation);
                }
            },
            {
                x: UI.O_LEFT + (UI.COLUMN * 2), y: UI.O_TOP + UI.ROW,
                getText: (info) => {
                    return 'Fuel: ' + Math.round(info.rocket.getFuel()) + '%';
                },
                isCritical: (info) => {
                    return info.rocket.getFuel() <= 0;
                }
            },
            {
                x: UI.O_LEFT, y: UI.O_TOP_SECOND,
                showCloseToPlanet: true,
                getText: (info) => {
                    return 'Lateral speed: ' + round(info.lateral);
                },
                isCritical: (info) => {
                    return info.lateral >= GameConfig.LIMIT_LATERAL;
                }
            },
            {
                x: UI.O_LEFT, y: UI.O_TOP_SECOND + UI.ROW,
                showCloseToPlanet: true,
                getText: (info) => {
                    return 'Vertical speed: ' + round(info.vertical);
                },
                isCritical: (info) => {
                    return info.vertical >= GameConfig.LIMIT_VERTICAL;
                }
            },
            {
                x: UI.O_LEFT, y: UI.O_TOP_SECOND + (UI.ROW * 2),
                showCloseToPlanet: true,
                getText: (info) => {
                    return 'Landing angle: ' + round(info.angle);
                },
                isCritical: (info) => {
                    return info.angle >= GameConfig.LIMIT_ANGLE;
                }
            }
        ], (node) => {
            node.shape = new TextNode({
                x: node.x, y: node.y,
                fillStyle: UI.TEXT_COLOR,
                fontFamily: UI.FONT,
                fontSize: UI.TEXT_SIZE
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

    setLandingInfoDisplayed(value) {
        this.landingInfoDisplayed = value;
        this.box2.visible = value;
        _.each(_.filter(this.nodes, (node) => node.showCloseToPlanet), (node) => {
            node.shape.visible = value;
        });
    }

    update(info) {
        this.setLandingInfoDisplayed(info.closestPlanetDistance < GameConfig.SHOW_LANDING_INFO);

        _.each(this.nodes, (node) => {
            node.shape.setText(node.getText(info));
            if (node.isCritical) {
                if (node.isCritical(info)) {
                    node.shape.fillStyle = UI.WARN_COLOR;
                } else {
                    node.shape.fillStyle = UI.TEXT_COLOR;
                }
            }
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