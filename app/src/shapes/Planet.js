
let _ = require('lodash');
let { Shape } = require('shapes/Shapes');
let { rads, distance } = require('math/Calc');

// All planets that have been prerendered in this session. Maybe
// need to empty this between map changes?
let CACHED_PRERENDER = {};

function hashPlanet(planet) {
    return _.map([planet.size, planet.atmsSize, planet.atmsColor], (value) => {
        return value + '';
    }).join('_');
}

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

        // These are dumb
        this.isTarget = opts.isTarget;
        this.isBase = opts.isBase;

        this.size = opts.size;
        this.regX = this.size / 2;
        this.regY = this.size / 2;
        this.atmsSize = opts.atmsSize;
        this.atmsColor = opts.atmsColor;
        this.atmsBegin = opts.atmsBegin;
        this._atms = null;
        this.gravity = opts.gravity;
        this.gravMaxDist = opts.gravMaxDist || 1200;
        this.paints = [];
        this.hash = hashPlanet(this);

        this.darkAlpha = 1;
    }

    prerenderAtmosphere() {
        if (!CACHED_PRERENDER[this.hash]) {
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
            darkGrad.addColorStop(0.75, 'rgba(0,0,0,1');
            darkGrad.addColorStop(0, 'rgba(0,0,0,1');
            drawCircleAndFill(darkCtx, darkSize, darkGrad);

            CACHED_PRERENDER[this.hash] = {
                atms: atmsCanvas,
                darkSize: darkSize,
                dark: darkCanvas
            };

            this.prerendered = true;
        }

        this._atmsDarkSize = CACHED_PRERENDER[this.hash].darkSize;
        this._atmsDark = CACHED_PRERENDER[this.hash].dark;
        this._atms = CACHED_PRERENDER[this.hash].atms;
    }

    renderAtmosphere(ctx) {
        ctx.save();
        let darkSize = this._atmsDarkSize - this.size;
        let atmsDark = this._atmsDark;
        let atms = this._atms;

        ctx.save();
        ctx.translate(-darkSize / 2, -darkSize / 2);
        ctx.globalAlpha = this.darkAlpha;
        ctx.drawImage(atmsDark, 0, 0, atmsDark.width, atmsDark.height, 0, 0, atmsDark.width, atmsDark.height);
        ctx.restore();

        let atmsSize = this.atmsSize - this.size;
        ctx.translate(-atmsSize / 2, -atmsSize / 2);
        ctx.drawImage(atms, 0, 0, atms.width, atms.height, 0, 0, atms.width, atms.height);
        ctx.translate(atmsSize / 2, atmsSize / 2);
        ctx.restore();
    }

    getSurfacePoint(angle) {
        let planetAngle = angle - 90;
        return {
            y: Math.sin(rads(planetAngle)) * (this.size / 2) + this.y,
            x: Math.cos(rads(planetAngle)) * (this.size / 2) + this.x
        };
    }

    paintSurface(start, end, color) {
        this.paints.push({
            start, end, color
        })
    }

    collidesWith(rocket) {
        let collision = _.some(rocket.getPoints(), (point) => {
            let px = point.x + rocket.x;
            let py = point.y + rocket.y;
            return distance(px, py, this.x, this.y) <= (this.size / 2);
        });
        return collision;
    }

    renderPaints(ctx) {
        let { size } = this;
        _.each(this.paints, ({ start, end, color }) => {
            ctx.save();
            ctx.beginPath();
            let paintStart = rads(start - 90);
            let paintStop = rads(end - 90);
            ctx.arc(size / 2, size / 2, size / 2, paintStart, paintStop, false);
            // ctx.arc(size / 2, size / 2, size / 2, paintStop, paintStart, true);
            // ctx.closePath();
            ctx.lineWidth = 6;
            ctx.strokeStyle = color;
            ctx.stroke();
            ctx.restore();
        })
    }

    render(ctx) {
        if (!this._atms) {
            this.prerenderAtmosphere();
        }
        ctx.save();
        this.renderAtmosphere(ctx);
        drawCircle(ctx, this.size);
        ctx.restore();
    }

    postrender(ctx) {
        super.postrender(ctx);

        this.prerender(ctx);
        this.renderPaints(ctx);
        ctx.restore();
    }
}

module.exports = { Planet };