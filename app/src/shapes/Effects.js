
let _ = require('lodash');
let { Shape, Sprite } = require('shapes/Shapes');

// Max size of a smoke effect circle
const MAX_GROW = 30;

// Min size of a smoke effect circle
const MIN_SIZE = 10;

// How long until a smoke effect is fully blowin'
const STARTUP_TIME = 100;

// How long for smoke to dissipate
const STOP_TIME = 100;

/*
 * Functionality for rendering a sprite from one sheet image file. Takes in an options object with properties
 * - cols: Columns in the spritesheet
 * - rows: Rows in the spritesheet
 * - frames: (Optional) Frames in the spritesheet, so that not all rows have to be full
 * - onEnded: A function fired when the spritesheet reaches the end of the frames.
 */
class SpriteSheet extends Sprite {
    constructor(opts = {}) {
        super(opts);
        this.cols = opts.cols;
        this.rows = opts.rows;
        this.frames = opts.frames || (this.cols * this.rows);
        this.currentFrame = 0;
        this.intervalId = null;
        this.onEnded = opts.onEnded;

        this.naturalWidth = this.width;
        this.naturalHeight = this.height;
    }

    /*
     * Set the frame position.
     * - inPos: Position on the sprite sheet as an integer starting from zero
     *   and increasing through the frames columns first, rows then.
     */
    setFrame(inPos) {
        let pos = inPos;
        if (inPos > this.frames) {
            pos = this.frames;
        }

        let column = pos % this.cols;
        let row = Math.floor(pos / this.cols);

        this.cropX = this.width * column;
        this.cropY = this.height * row;
        this.currentFrame = pos;
    }

    /*
     * Move to the next frame on the spritesheet.
     */
    nextFrame() {
        this.setFrame(this.currentFrame + 1);
    }

    /*
     * Update the sprite sheet as one step of the animation.
     */
    tick() {
        if (this.currentFrame >= this.frames) {
            clearInterval(this.intervalId);
            if (this.onEnded) {
                this.onEnded();
            }
        }
        else {
            this.nextFrame();
        }
    }

    /*
     * Start the animation.
     */
    start() {
        this.intervalId = setInterval(_.bind(this.tick, this), 33);
    }

    render(ctx) {
        super.render(ctx);
    }
}

/*
 * A engine smoke effect, makes white smoke effect in sort of a cone shape.
 * Takes in an options object with properties:
 * - angle: Angle in degrees where to fire the smoke.
 * - scale: Scaling number for the size of the smoke.
 * - force: Force in which the smoke is fired, how far away it goes from the engine
 * - img: Image instance for how to draw one smoke circle.
 */
class EngineSmoke extends Shape {
    constructor(opts = {}) {
        super(opts);
        this.angle = opts.angle;
        this.scale = opts.scale;
        this.force = opts.force;

        this.img = opts.img;

        this.on = false;
        this.evaporated = true;
        this.startTime = null;
        this.endTime = null;
        this.baseAlpha = 0.5;
        this.fillStyle = '#ffffff';

        this.particles = _.range(0, opts.numParticles || 10, 0);
    }

    /*
     * Start smoke effect.
     */
    start() {
        this.evaporated = false;
        this.on = true;
        this.endTime = null;
        this.startTime = Date.now();
    }

    /*
     * Stop smoke effect.
     */
    stop() {
        this.on = false;
        this.startTime = null;
        this.endTime = Date.now();
    }

    /*
     * Render a single circular smoke part.
     * - ctx: Canvas rendering context instance.
     * - size: Size of the circle
     * - pos: Position of the circle, distance from the engine basically
     */
    renderCircle(ctx, size, pos) {
        let y = -pos * this.force * 2;

        ctx.save();
        let alpha = this.baseAlpha + ((Math.random() - 1) / 4);
        ctx.globalAlpha = alpha;

        ctx.translate(-size / 2, y);
        ctx.beginPath();
        ctx.drawImage(this.img, 0, 0, this.img.width, this.img.height, 0, 0, size, size);
        ctx.closePath();
        ctx.restore();
    }

    prerender(ctx) {
        super.prerender(ctx);
    }

    render(ctx) {
        if (!this.evaporated) {
            ctx.rotate(this.angle * (Math.PI / 180));
            let particles = this.particles;

            let maxSize = MAX_GROW * this.scale;

            for (var i = 0; i < particles.length; i++) {
                let size = MIN_SIZE + i * (maxSize / particles.length);

                // If its on, keep drawing more of the circles or draw all of them
                if (this.on) {
                    let particleTime = i * (STARTUP_TIME / particles.length);
                    if ((Date.now() - this.startTime) > particleTime) {
                        this.renderCircle(ctx, size, i);
                    }
                // Else keep drawing less of them as they evaporate
                } else {
                    let particleTime = i * (STOP_TIME / particles.length);
                    if (this.endTime && !((Date.now() - this.endTime) > particleTime)) {
                        this.renderCircle(ctx, size, i);
                    }
                    else if (i === particles.length - 1) {
                        this.evaporated = true;
                    }
                }
            }
        }
    }
}

module.exports = { EngineSmoke, SpriteSheet };
