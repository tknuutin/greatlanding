
class Shape {
    constructor(opts = {}) {
        this.name = opts.name;
        this.x = opts.x;
        this.y = opts.y;
        this.fillStyle = opts.fillStyle;
        this.rotation = opts.rotation !== undefined ? opts.rotation: 0;
        this.scaleX = 1;
        this.scaleY = 1;
        this.regX = opts.regX || 0;
        this.regY = opts.regY ||0;
        this.alpha = 1;
    }

    prerender(ctx) {
        ctx.save();
        ctx.translate(this.x - this.regX, this.y - this.regY);

        var needsRotate = this.rotation !== 0;
        var needsScale = (this.scaleX !== 1 || this.scaleY !== 1);
        if (needsRotate || needsScale) {
            ctx.translate(this.regX, this.regY);
            if (needsRotate) {

                ctx.rotate(this.rotation * (Math.PI / 180));
            }
            if (needsScale) {
                ctx.scale(this.scaleX, this.scaleY);
            }
            ctx.translate((-this.regX / this.scaleX), (-this.regY / this.scaleY));
        }

        // Multiply by parent alpha to achieve compounding alpha effect
        ctx.globalAlpha = this.alpha;
    }

    postrender(ctx) {
        if (this.fillStyle) {
            ctx.fillStyle = this.fillStyle;
            ctx.fill();
        }

        ctx.restore();
    }
}

class Rectangle extends Shape {
    constructor(opts = {}) {
        super(opts);
        this.width = opts.width;
        this.height = opts.height;
    }

    render(ctx) {
        ctx.beginPath();
        ctx.rect(0, 0, this.width, this.height);
        ctx.closePath();
    }
}

class Sprite extends Shape {
    constructor(opts = {}) {
        super(opts);
        this.width = opts.width;
        this.height = opts.height;
        this.img = opts.img;

        this.naturalWidth = this.img.width;
        this.naturalHeight = this.img.height;
    }

    render(ctx) {
        ctx.beginPath();
        ctx.drawImage(this.img, 0, 0, this.naturalWidth, this.naturalHeight, 0, 0, this.width, this.height);
        ctx.closePath();
    }
}

module.exports = { Shape, Rectangle, Sprite };
