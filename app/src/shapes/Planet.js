
let _ = require('lodash');
let { Shape } = require('shapes/Shapes');
let { rads, distance } = require('math/Calc');

// All planets that have been prerendered in this session. Maybe
// need to empty this between map changes?
let CACHED_PRERENDER = {};

const PLANET_CIRCLES = [0.75, 1];
const PLANET_LINES = [0, 45, 90, 135];

/*
 * Get the hash string of a planet.
 */
function hashPlanet(planet) {
    return _.map([planet.size, planet.atmsSize, planet.atmsColor], (value) => {
        return value + '';
    }).join('_');
}

/*
 * Return a canvas element with the given size.
 * - side: Object with width and height properties.
 */
function createTemporaryCanvas(size) {
    let canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    return canvas;
}

/*
 * Draw a circle of a given size on the given context.
 */
function drawCircle(ctx, size) {
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2, true);
    ctx.closePath();
}

/*
 * Draw a filled circle with the given size and color to the context.
 */
function drawCircleAndFill(ctx, size, color) {
    drawCircle(ctx, size);
    ctx.fillStyle = color;
    ctx.fill();
}

function strokeCircle(ctx, size, color) {
    drawCircle(ctx, size);
    ctx.strokeStyle = color;
    ctx.stroke();
}

/*
 * A large planet shape with gravity, atmosphere, and other effects.
 */
class Planet extends Shape {
    constructor(opts = {}) {
        super(opts);

        // These are dumb
        this.isTarget = opts.isTarget;
        this.isBase = opts.isBase;

        this.size = opts.size;
        this.regX = this.size / 2;
        this.regY = this.size / 2;
        this.drawOnMinimap = true;

        // Atmosphere size
        this.atmsSize = opts.atmsSize;

        // Atmosphere color
        this.atmsColor = opts.atmsColor;

        // Cached pre-rendered atmosphere sprite
        this._atms = null;

        // Surface gravity
        this.gravity = opts.gravity;

        // Gravity max distance
        this.gravMaxDist = opts.gravMaxDist || 1200;

        // Colored portions of the surface.
        this.paints = [];

        this.hash = hashPlanet(this);

        // For a neat darkening effect near planets - the current
        // alpha of the black gradient circle.
        this.darkAlpha = 1;
    }

    /*
     * If this planet has not been prerendered yet on this page load,
     * prerender it on temporary canvases and save them. The processing time
     * to render a large gradient of the atmosphere can take a while,
     * so this is useful.
     */
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

            // The size and gradient of the large black darkening circle,
            // simulates the brightness of the planet's atmosphere washing out
            // stars and other space background stuff.
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

    /*
     * Render the atmosphere of a planet on a given context.
     */
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

    renderMinimapCircles(ctx) {
        ctx.save();
        drawCircleAndFill(ctx, this.size, '#000');

        _.each(PLANET_CIRCLES, (factor) => {
            let size = factor * this.size;
            let offset = (this.size - size) / 2;
            ctx.translate(offset, offset);
            strokeCircle(ctx, size, '#1A6D29');
            ctx.translate(-offset, -offset);
        });
        ctx.restore();
    }

    renderMinimapLines(ctx) {
        _.each(PLANET_LINES, (rot) => {
            ctx.save();

            ctx.translate(this.size / 2, this.size / 2);
            ctx.rotate(rads(rot));

            ctx.translate(0, -(this.size / 2));

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, this.size);
            ctx.closePath();

            ctx.strokeStyle = '#1A6D29';
            ctx.stroke();

            ctx.restore();
        });
    }

    renderMinimapPointers(ctx) {
        if (this.isTarget && this.landingPadPoint && this.landingPadVisible) {
            let point = this.landingPadPoint;

            ctx.save();

            ctx.translate(this.size / 2, this.size / 2);
            ctx.translate(-this.x, -this.y);
            ctx.translate(point.x, point.y);

            ctx.beginPath();
            ctx.strokeStyle = '#ff0000';
            ctx.fillStyle = '#000000';
            ctx.arc(0, 0, 200, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.stroke();
            ctx.fill();

            ctx.restore();
        }
    }

    renderMinimap(ctx) {
        ctx.lineWidth = 100;
        this.renderMinimapCircles(ctx);
        this.renderMinimapLines(ctx);
        this.renderMinimapPointers(ctx);
    }

    /*
     * Get the x,y point on the surface at a certain angle.
     * - angle: Angle in degrees
     */
    getSurfacePoint(angle) {
        let planetAngle = angle - 90;
        return {
            y: Math.sin(rads(planetAngle)) * (this.size / 2) + this.y,
            x: Math.cos(rads(planetAngle)) * (this.size / 2) + this.x
        };
    }

    /*
     * Add a colored portion of the planet surface.
     * - start: Start of the colored portion in degrees
     * - end: End of the colored portion in degrees
     * - color: Color as a hex string.
     */
    paintSurface(start, end, color, info) {
        let obj = {
            start, end, color, info
        };

        this.paints.push(obj);

        // A bit hacky, set info here to display the landing pad
        if (info && info.isLandingPad) {
            this.landingPadPoint = this.getSurfacePoint(obj.start + ((obj.end - obj.start) / 2));
            this.landingPadVisible = true;
            setInterval(() => {
                this.landingPadVisible = !this.landingPadVisible;
            }, 700);
        }
    }

    /*
     * Checks whether the Rocket collides with this planet. Returns a boolean.
     */
    collidesWith(rocket) {
        return _.some(rocket.getPoints(), (point) => {
            let px = point.x + rocket.x;
            let py = point.y + rocket.y;
            return distance(px, py, this.x, this.y) <= (this.size / 2);
        });
    }

    /*
     * Render all the colored painted portions of the planet surface on the context.
     */
    renderPaints(ctx) {
        let { size } = this;
        _.each(this.paints, ({ start, end, color }) => {
            ctx.save();
            ctx.beginPath();
            let paintStart = rads(start - 90);
            let paintStop = rads(end - 90);
            ctx.arc(size / 2, size / 2, size / 2, paintStart, paintStop, false);
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