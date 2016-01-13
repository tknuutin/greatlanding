
class Rectangle {
    constructor(opts = {}) {
        this.x = opts.x;
        this.y = opts.y;
        this.width = opts.width;
        this.height = opts.height;
        this.fillStyle = opts.fillStyle;
    }

    prerender(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
    }

    render(ctx) {
        ctx.beginPath();
        ctx.rect(0, 0, this.width, this.height);
        ctx.closePath();
    }

    postrender(ctx) {
        if (this.fillStyle) {
            ctx.fillStyle = this.fillStyle;
            ctx.fill();
        }

        ctx.restore();
    }
}

module.exports = { Rectangle };
