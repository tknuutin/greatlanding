
let _ = require('lodash');
let { RoundedRectangle, TextNode } = require('shapes/Shapes');
let { Indicator, getIndicatorPos } = require('shapes/Indicator');
let { distancePoints } = require('math/Calc');
let GameConfig = require('config/GameConfig');
let { SCREEN, UI } = GameConfig;

function round(num) {
    return Math.round(num * 100) / 100;
}

class TopLeftUI {
    constructor() {
        this.box1 = new RoundedRectangle({
            x: 10, y: 10, name: 'upper',
            width: 200, height: 50,
            fillStyle: UI.BG_COLOR,
            alpha: UI.BG_ALPHA
        });

        this.landingInfoDisplayed = false;

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

        this.shapes = [
            this.box1, this.box2
        ].concat(_.map(this.nodes, (node) => node.shape));
    }

    update(info) {
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
    }

    setLandingInfoDisplayed(value) {
        this.landingInfoDisplayed = value;
        this.box2.visible = value;
        _.each(_.filter(this.nodes, (node) => node.showCloseToPlanet), (node) => {
            node.shape.visible = value;
        });
    }

    getShapes() {
        return this.shapes;
    }
}

class UIMessage {
    constructor() {
        this.box = new RoundedRectangle({
            x: 10, y: 300,
            width: 10, height: 90,
            fillStyle: UI.BG_COLOR,
            alpha: UI.BG_ALPHA
        });

        this.header = new TextNode({
            x: SCREEN.WIDTH / 2, y: 310,
            fillStyle: UI.TEXT_COLOR,
            fontFamily: UI.FONT,
            fontSize: 18, text: '',
            textAlign: 'center'
        });

        this.message = new TextNode({
            x: SCREEN.WIDTH / 2, y: 340,
            fillStyle: UI.TEXT_COLOR,
            fontFamily: UI.FONT,
            fontSize: 14, text: '',
            textAlign: 'center'
        });

        this.resetInfo = new TextNode({
            name: 'resetinfo',
            x: SCREEN.WIDTH / 2, y: 360,
            fillStyle: UI.TEXT_COLOR,
            fontFamily: UI.FONT,
            fontSize: 12,
            textAlign: 'center',
            text: 'Press space to try again'
        });

        this.shapes = [this.box, this.header, this.message, this.resetInfo];
        this.setVisible(false);
    }

    setVisible(value) {
        this.visible = value;
        _.each(this.shapes, (shape) => {
            shape.visible = value;
        });
    }

    setMessage(info) {
        this.showRestartTip = info.showRestartTip;
        this.header.setText(info.header);
        this.message.setText(info.message);

        let headerWidth = this.header.getWidth();
        let messageWidth = this.message.getWidth();
        let longer = Math.max(headerWidth, messageWidth);
        let margin = 15;
        this.box.x = ((SCREEN.WIDTH - longer) / 2) - margin;
        this.box.width = longer + margin * 2;
    }

    getShapes() {
        return this.shapes;
    }
}

class GameUI {
    constructor(targetPlanet) {
        this.indicators = [];
        this.topLeftUI = new TopLeftUI();
        this.message = new UIMessage();
        this.message.setVisible(false);
        this.shapes = this.topLeftUI.getShapes().concat(this.message.getShapes());
    }

    reset() {
        _.each(this.indicators, (ind) => {
            _.each(ind.getShapes(), (shape) => _.pull(this.shapes, shape));
        });
        this.indicators = [];

        this.topLeftUI.setLandingInfoDisplayed(true);
        this.message.setVisible(false);
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
        this.topLeftUI.setLandingInfoDisplayed(value);
    }

    update(info) {
        this.setLandingInfoDisplayed(info.closestPlanetDistance < GameConfig.SHOW_LANDING_INFO);

        this.topLeftUI.update(info);
        if (info.uiMessage) {
            this.message.setMessage(info.uiMessage);
            this.message.setVisible(true);
        }

        _.each(this.indicators, (indicator) => {
            indicator.update(getIndicatorPos(indicator, 700, 500, info.rocket), distancePoints(indicator.point, info.rocket));
        });
    }

    getShapes() {
        return this.shapes;
    }
}

module.exports = { GameUI };