
let _ = require('lodash');
let Calc = require('math/Calc');

class Renderer {
    constructor(options = {}) {
        this.id = null;
        this.requested = false;
        this.ctx = options.canvas.getContext('2d');
        this.setSize(options.width, options.height);
        this.bg = options.background;

        this.count = 0;
        this.logging = false;
    }

    setSize(w, h) {
        this.width = w;
        this.height = h;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.w, this.h);
    }

    renderBG(pos) {
        let factor = 8;
        let x = pos.x / factor;
        let y = pos.y / factor;
        let bgw = this.bg.width;
        let bgh = this.bg.height;
        let ctx = this.ctx;

        let bgOffsetX = (x % bgw) + this.width;
        let bgOffsetY = (y % bgh) + this.height;

        let tilesX = Math.max(this.width / bgw, 3);
        let tilesY = Math.max(this.height / bgh, 3);

        let drawBg = _.partial(_.bind(ctx.drawImage, ctx), this.bg, 0, 0, bgw, bgh, 0, 0, bgw, bgh);

        ctx.translate(-bgOffsetX, -bgOffsetY);
        for (let i = 0; i < (tilesX + 1); i++) {
            for (let j = 0; j < (tilesY + 1); j++) {
                ctx.translate(bgw * i, bgh * j);
                drawBg();
                ctx.translate(-(bgw * i), -(bgh * j));
            }
        }
        ctx.translate(bgOffsetX, bgOffsetY);
    }

    updateEffects(shapes, info, rocket, camera) {
        let planet = info.closestPlanet;
        let distance = Calc.distance(planet.x, planet.y, camera.x, camera.y) - (planet.size / 2);
        let darkLimit = planet.size / 10;
        let newAlpha = Math.max(Math.min((darkLimit - distance) / ((darkLimit / 3) * 2), 1), 0);
        planet.darkAlpha = newAlpha;
    }

    renderShapes(shapes) {
        _.forEach(shapes, (shape) => {
            if (shape.visible) {
                shape.prerender(this.ctx);
                shape.render(this.ctx);
                shape.postrender(this.ctx);
            }
        });
    }

    render(shapes, cameraPos) {
        if (this.logging) {
            this.count++;
        }

        let ctx = this.ctx;

        this.clear();
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.save();
        this.renderBG(cameraPos);

        ctx.translate(-cameraPos.x + (this.width / 2), -cameraPos.y + (this.height / 2));
        this.renderShapes(shapes);
        ctx.restore();
    }

    logFps() {
        this.logging = true;
        setInterval(() => {
            console.log('FPS:', this.count);
            this.count = 0;
        }, 1000);
    }

    renderUI(shapes) {
        let ctx = this.ctx;
        ctx.save();
        this.renderShapes(shapes);
        ctx.restore();
    }
}

module.exports = { Renderer };
