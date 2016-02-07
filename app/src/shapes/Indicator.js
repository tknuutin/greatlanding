
let _ = require('lodash');
let { linesIntersect } = require('math/Calc');
let V = require('math/Vector');
let { Shape, TextNode } = require('shapes/Shapes');

// Margin for the indicator from the edges of the screen.
const MARGIN = 40;

/*
 * Get the point on the UI border where an indicator should be drawn to properly point
 * to the Indicator's target point. Returns an object with x,y properties.
 * - indicator: Indicator instance
 * - screenW: Screen width
 * - screenH: Screen height
 * - cameraPos: An object with x,y properties for where the camera is in the game
 */
function getIndicatorBorderPoint(indicator, screenW, screenH, cameraPos) {
    let x = 0;
    let y = 0;

    let toTarget = V.mul(V.sub(indicator.point, cameraPos), 1000);

    let borders = [
        { x: MARGIN, y: MARGIN, tX: screenW - MARGIN, tY: MARGIN },
        { x: screenW - MARGIN, y: MARGIN, tX: screenW - MARGIN, tY: screenH - MARGIN },
        { x: screenW - MARGIN, y: screenH - MARGIN, tX: MARGIN, tY: screenH - MARGIN },
        { x: MARGIN, y: screenH - MARGIN, tX: MARGIN, tY: MARGIN }
    ];

    _.each(borders, (line) => {
        let center = { x: screenW / 2, y: screenH / 2 };
        let arrow = {
            x: center.x, y: center.y, tX: toTarget.x + center.x, tY: toTarget.y + center.y
        };
        let result = linesIntersect(arrow.x, arrow.y, arrow.tX, arrow.tY, line.x, line.y, line.tX, line.tY);
        if (result.intersects) {
            x = result.x;
            y = result.y;
            return false;  // terminate loop
        }
    });

    return { x, y };
}

/*
 * Get the point on the UI where an indicator should be drawn to. The point
 * can be on screen, in which case the indicator will be drawn over the target point.
 * - indicator: Indicator instance
 * - screenW: Screen width
 * - screenH: Screen height
 * - cameraPos: An object with x,y properties for where the camera is in the game
 */
function getIndicatorPos(indicator, screenW, screenH, cameraPos) {
    let target = indicator.point;
    let onScreen = (
        (Math.abs(target.x - cameraPos.x) <= (screenW / 2 - MARGIN)) &&
        (Math.abs(target.y - cameraPos.y) <= (screenH / 2 - MARGIN))
    );

    if (!onScreen) {
        return getIndicatorBorderPoint(indicator, screenW, screenH, cameraPos);
    }

    let screen = V.sub(cameraPos, { x: screenW / 2, y: screenH / 2 });
    return V.sub(target, screen);
}

/*
 * An indicator diamond shape, signifies a point of interest.
 * Takes in an object with width and height.
 */
class IndicatorShape extends Shape {
    constructor(opts) {
        super(opts);
        this.width = opts.width;
        this.height = opts.height;
    }

    render(ctx) {
        ctx.translate(-this.width / 2, this.height / 2);
        let h = this.height;
        let w = this.width;
        ctx.beginPath();
        ctx.lineTo(w / 2, -h / 2);
        ctx.lineTo(w, 0);
        ctx.lineTo(w / 2, h / 2);
        ctx.lineTo(0, 0);
        ctx.closePath();
    }
}

/*
 * Functionality to make an UI indicator that points to a point of interest in the game
 * If the target is off screen, the indicator will be on the border of the UI pointing the
 * direction. If the target is on screen, the indicator will be over the target.
 * Fades as you get really close to the target. Takes an options object:
 * - point: An object with x,y properties
 * - text: Text to display on the indicator, the name of the point for example
 * - offset: Offset to account for the text. TODO: Should center text instead.
 */
class Indicator {
    constructor({ point, text, offset }) {
        this.point = point;
        this.text = text;
        this.textOffset = offset;

        this.lines = new IndicatorShape({
            x: 0, y: 0,
            width: 30, height: 15,
            strokeStyle: '#e5e5e5',
            lineWidth: 4
        });

        this.textNode = new TextNode({
            x: 0, y: 0,
            fillStyle: '#e5e5e5',
            fontSize: 14,
            fontFamily: 'Play',
            text: text
        });
    }

    /*
     * Update the position and graphics of the indicator.
     * - pos: Object with x,y properties, moves the indicator to this position.
     * - distance: Distance to the target.
     */
    update(pos, distance) {
        this.lines.x = pos.x;
        this.lines.y = pos.y;
        this.textNode.x = pos.x - this.textOffset;
        this.textNode.y = pos.y + this.lines.height;

        this.textNode.setText(this.text + ' (' + Math.round(distance / 10) + 'km)');

        let alphaUpper = 400;
        let alphaLower = 200;

        let alpha = 1
        if (distance < alphaUpper) {
            if (distance < alphaLower) {
                alpha = 0;
            } else {
                alpha = (distance - alphaLower) / alphaLower;
            }
        }

        this.textNode.alpha = alpha;
        this.lines.alpha = alpha;
    }

    getShapes() {
        return [this.lines, this.textNode];
    }
}

module.exports = { Indicator, getIndicatorPos };
