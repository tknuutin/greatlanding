
let _ = require('lodash');
let { Shape } = require('./Shapes');
let Calc = require('./Calc');

function createTemporaryCanvas(size) {
    let canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    return canvas;
}

function drawCircle(ctx, size) {
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2, true);
    ctx.closePath();
}

function drawCircleAndFill(ctx, size, color) {
    drawCircle(ctx, size);
    ctx.fillStyle = color;
    ctx.fill();
}

class Planet extends Shape {
    constructor(opts = {}) {
        super(opts);
        this.size = opts.size;
        this.regX = this.size / 2;
        this.regY = this.size / 2;
        this.atmsSize = opts.atmsSize;
        this.atmsColor = opts.atmsColor;
        this.atmsBegin = opts.atmsBegin;
        this._atms = null;
    }

    prerenderAtmosphere() {
        let atmsCanvas = createTemporaryCanvas(this.atmsSize);
        let aRadius = this.atmsSize / 2;
        let actx = atmsCanvas.getContext('2d');
        let aGrad = actx.createRadialGradient(aRadius, aRadius, 1, aRadius, aRadius, aRadius);
        let aColorString = this.atmsColor.join(',');
        aGrad.addColorStop(1, 'rgba(' + aColorString + ',0');
        aGrad.addColorStop(0.8, 'rgba(' + aColorString + ',1');
        aGrad.addColorStop(0, 'rgba(' + aColorString + ',1');
        drawCircleAndFill(actx, this.atmsSize, aGrad);

        let darkSize = this.atmsSize * 1.3;
        let darkRadius = darkSize / 2;
        let darkCanvas = createTemporaryCanvas(darkSize);
        let darkCtx = darkCanvas.getContext('2d');
        let darkGrad = darkCtx.createRadialGradient(darkRadius, darkRadius, 1, darkRadius, darkRadius, darkRadius);
        darkGrad.addColorStop(1, 'rgba(0,0,0,0');
        darkGrad.addColorStop(0.7, 'rgba(0,0,0,1');
        darkGrad.addColorStop(0, 'rgba(0,0,0,1');
        drawCircleAndFill(darkCtx, darkSize, darkGrad);

        this._atmsDarkSize = darkSize;
        this._atmsDark = darkCanvas;
        this._atms = atmsCanvas;
    }

    renderAtmosphere(ctx) {
        ctx.save();
        let darkSize = this._atmsDarkSize - this.size;
        let atmsDark = this._atmsDark;
        let atms = this._atms;
        ctx.translate(-darkSize / 2, -darkSize / 2);
        ctx.drawImage(atmsDark, 0, 0, atmsDark.width, atmsDark.height, 0, 0, atmsDark.width, atmsDark.height);
        ctx.translate(darkSize / 2, darkSize / 2);

        let atmsSize = this.atmsSize - this.size;
        ctx.translate(-atmsSize / 2, -atmsSize / 2);
        ctx.drawImage(atms, 0, 0, atms.width, atms.height, 0, 0, atms.width, atms.height);
        ctx.translate(atmsSize / 2, atmsSize / 2);
        ctx.restore();
    }

    collidesWith(rocket) {
        let collision = _.some(rocket.getPoints(), (point) => {
            let px = point.x + rocket.x;
            let py = point.y + rocket.y;
            return Calc.distance(px, py, this.x, this.y) <= (this.size / 2);
        });
        return collision;
    }

    render(ctx) {
        if (!this._atms) {
            this.prerenderAtmosphere();
        }
        this.renderAtmosphere(ctx);
        drawCircle(ctx, this.size);
    }
}

module.exports = { Planet };