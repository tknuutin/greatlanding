
let _ = require('lodash');
let { Shape, Sprite } = require('./Shapes');

const MAX_GROW = 30;
const MIN_SIZE = 10;
const STARTUP_TIME = 100;
const STOP_TIME = 100;

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

    nextFrame(pos) {
        this.setFrame(this.currentFrame + 1);
    }

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

    start() {
        this.intervalId = setInterval(_.bind(this.tick, this), 33);
    }

    render(ctx) {
        super.render(ctx);
    }
}

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

    start() {
        this.evaporated = false;
        this.on = true;
        this.endTime = null;
        this.startTime = Date.now();
    }

    stop() {
        this.on = false;
        this.startTime = null;
        this.endTime = Date.now();
    }

    renderCircle(ctx, size, pos) {
        // console.log('render circle')
        let y = -pos * this.force * 2;

        ctx.save();
        // ctx.fillStyle = this.fillStyle;
        let alpha = this.baseAlpha + ((Math.random() - 1) / 4);
        ctx.globalAlpha = alpha;
        // console.log('alpha', alpha, size);

        ctx.translate(-size / 2, y);
        ctx.beginPath();
        // size = size / 1.5;  // bleurgh?
        ctx.drawImage(this.img, 0, 0, this.img.width, this.img.height, 0, 0, size, size);
        // ctx.drawImage(this.img, 0, 0, 100, 100, 0, 0, 100, 100);
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

            // console.log('RENDER');
            for (var i = 0; i < particles.length; i++) {
                let size = MIN_SIZE + i * (maxSize / particles.length);
                if (this.on) {
                    let particleTime = i * (STARTUP_TIME / particles.length);
                    if ((Date.now() - this.startTime) > particleTime) {
                        this.renderCircle(ctx, size, i);
                    }
                }
                else {
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