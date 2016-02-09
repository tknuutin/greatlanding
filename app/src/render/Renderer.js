
let _ = require('lodash');
let Calc = require('math/Calc');

// How slow the background moves compared to the camera.
const BG_MOVE_FACTOR = 8;

/*
 * The Canvas renderer instance. Takes in an options object with the following properties:
 * - canvas: A canvas HTML Node.
 * - width: Width of the canvas.
 * - height: Height of the canvas.
 * - background: An Image instance used for the tiled background of the canvas.
 */
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

    /*
     * Set the size of the canvas.
     */
    setSize(w, h) {
        this.width = w;
        this.height = h;
    }

    /*
     * Empty the canvas from any drawn pixels.
     */
    clear() {
        this.ctx.clearRect(0, 0, this.w, this.h);
    }

    /*
     * Render the moving tiled background.
     * - pos: The position of the camera.
     */
    renderBG(pos) {
        let x = pos.x / BG_MOVE_FACTOR;
        let y = pos.y / BG_MOVE_FACTOR;
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

    /*
     * Update the state of all game visual effects, for example
     * the dark umbras around Planets when you get close in the atmosphere.
     * - shapes: Array of shape instances. Parameter not used yet, will be in future
     * - info: Game state object
     * - camera: Camera position as x,y object
     */
    updateEffects(shapes, info, camera) {
        let planet = info.closestPlanet;
        let distance = Calc.distance(planet.x, planet.y, camera.x, camera.y) - (planet.size / 2);
        let darkLimit = planet.size / 10;
        let newAlpha = Math.max(Math.min((darkLimit - distance) / ((darkLimit / 3) * 2), 1), 0);
        planet.darkAlpha = newAlpha;
    }

    /*
     * Renders the given array of Shapes to the canvas, if they are visible.
     * - shapes: Array of shapes
     */
    renderShapes(shapes) {
        // TODO: add check whether the shapes are on scren or not.
        _.forEach(shapes, (shape) => {
            if (shape.visible) {
                shape.prerender(this.ctx);
                shape.render(this.ctx);
                shape.postrender(this.ctx);
            }
        });
    }

    /*
     * Renders the shapes from a given camera position.
     * - shapes: Array of shapes
     * - cameraPos: Camera position as x,y object
     */
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

    /*
     * Render UI shapes that are fixed on the screen and above
     * normal game shapes.
     * - uiShapes: Array of shapes
     */
    renderUI(uiShapes) {
        let ctx = this.ctx;
        ctx.save();
        this.renderShapes(uiShapes);
        ctx.restore();
    }

    renderMinimap(gameShapes, cameraPos) {
        let w = 100;
        let h = 100;
        let margin = 10;
        let ctx = this.ctx;
        let scale = 100;

        ctx.save();

        ctx.translate(this.width - margin - w, margin);

        ctx.strokeStyle = '#1A6D29';
        ctx.strokeRect(0, 0, w, h);

        ctx.beginPath();
        ctx.lineTo(w, 0);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.lineTo(0, 0)
        ctx.clip();

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w * 2, h * 2);

        ctx.scale(1 / scale, 1 / scale);
        ctx.translate(-cameraPos.x + (w / 2 * scale), -cameraPos.y + (h / 2 * scale));

        let shapes = _.filter(gameShapes, (shape) => shape.drawOnMinimap);
        _.each(shapes, (shape) => {
            shape.prerender(ctx);
            shape.renderMinimap(ctx);
            shape.postrenderMinimap(ctx);
        });

        ctx.restore();
    }
}

module.exports = { Renderer };
