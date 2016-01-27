
let _ = require('lodash');
let { linesIntersect } = require('./Calc');
let V = require('./Vector');
let { Shape, TextNode } = require('./Shapes');

const MARGIN = 40;

function getIndicatorPos(indicator, screenW, screenH, cameraPos) {
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

class IndicatorShape extends Shape {
    constructor(opts) {
        super(opts);
        this.width = opts.width;
        this.height = opts.height;
    }

    render(ctx) {
        ctx.translate(0, this.height / 2);
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

class Indicator {
    constructor({ point, text }) {
        this.point = point;

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

    update(pos) {
        this.lines.x = pos.x;
        this.lines.y = pos.y;
        this.textNode.x = pos.x;
        this.textNode.y = pos.y + this.lines.height;
    }

    getShapes() {
        return [this.lines, this.textNode];
    }
}

module.exports = { Indicator, getIndicatorPos };
