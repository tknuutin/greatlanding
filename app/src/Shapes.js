
let _ = require('lodash');

class Shape {
    constructor(opts = {}) {
        this.name = opts.name;
        this.x = opts.x;
        this.y = opts.y;
        this.fillStyle = opts.fillStyle;
        this.strokeStyle = opts.strokeStyle;
        this.rotation = opts.rotation !== undefined ? opts.rotation : 0;
        this.scaleX = opts.scaleX || 1;
        this.scaleY = opts.scaleY || 1;
        this.regX = opts.regX || 0;
        this.regY = opts.regY || 0;
        this.lineWidth = opts.lineWidth;
        this.alpha = opts.alpha !== undefined ? opts.alpha : 1;
        this.visible = true;
    }

    prerender(ctx) {
        ctx.save();
        ctx.translate(this.x - this.regX, this.y - this.regY);

        let needsRotate = this.rotation !== 0;
        let needsScale = (this.scaleX !== 1 || this.scaleY !== 1);
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

        ctx.globalAlpha = this.alpha;
    }

    postrender(ctx) {
        if (this.fillStyle) {
            ctx.fillStyle = this.fillStyle;
            ctx.fill();
        }

        if (this.strokeStyle) {
            ctx.lineWidth = this.lineWidth || 1;
            ctx.strokeStyle = this.strokeStyle;
            ctx.stroke();
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

class RoundedRectangle extends Rectangle {
    constructor(opts = {}) {
        super(opts);
        this.cornerRadius = opts.cornerRadius !== undefined ? opts.cornerRadius : 10;
        this.cornerRadius1 = opts.cornerRadius1 || this.cornerRadius;
        this.cornerRadius2 = opts.cornerRadius2 || this.cornerRadius;
        this.cornerRadius3 = opts.cornerRadius3 || this.cornerRadius;
        this.cornerRadius4 = opts.cornerRadius4 || this.cornerRadius;
    }

    render(ctx) {
        ctx.fillStyle = this.fillStyle;
        // console.log('this fillstyle', this.fillStyle, this.y);

        ctx.beginPath();
        let cornerRadius1 = this.cornerRadius1;
        let cornerRadius2 = this.cornerRadius2;
        let cornerRadius3 = this.cornerRadius3;
        let cornerRadius4 = this.cornerRadius4;

        ctx.moveTo(cornerRadius1, 0);
        ctx.lineTo(this.width - cornerRadius2, 0);
        ctx.arcTo(this.width, 0, this.width, cornerRadius2, cornerRadius2);
        ctx.lineTo(this.width, this.height - cornerRadius3);
        ctx.arcTo(this.width, this.height, this.width - cornerRadius3, this.height, cornerRadius3);
        ctx.lineTo(cornerRadius4, this.height);
        ctx.arcTo(0, this.height, 0, this.height - cornerRadius4, cornerRadius4);
        ctx.lineTo(0, cornerRadius1);
        ctx.arcTo(0, 0, cornerRadius1, 0, cornerRadius1);

        ctx.closePath();
    };
}

class TextNode extends Shape {
    constructor(opts = {}) {
        super(opts);

        this.text = opts.text;
        this.fontSize = opts.fontSize || 14;
        this.fontStyle = opts.fontStyle || 'normal';
        this.fontWeight = opts.fontWeight || 'normal';
        this.fontFamily = opts.fontFamily || 'sans-serif';
        this.formatted = this.fontStyle + ' ' + this.fontWeight + ' ' + this.fontSize + 'px ' + this.fontFamily;

        this.lineHeight = opts.lineHeight || (this.fontSize * 1.2);

        this.textAlign = opts.textAlign || 'left';
        this.textBaseline = opts.textBaseline || 'top';

        this.lines = [this.text];
    }

    setText(text) {
        this.lines[0] = text;
    }

    render(ctx) {
        ctx.font = this.formatted;
        ctx.textAlign = this.textAlign;
        ctx.textBaseline = this.textBaseline;
        ctx.fillStyle = this.fillStyle;
        ctx.strokeStyle = this.strokeStyle;

        _.each(this.lines, (line, i) => {
            if (this.fillStyle) {
                ctx.fillText(line, 0, i * (this.lineHeight));
            }
        });
    }

    postrender(ctx) {
        ctx.restore();
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

        this.cropX = 0;
        this.cropY = 0;
    }

    render(ctx) {
        ctx.beginPath();
        ctx.drawImage(this.img, this.cropX, this.cropY, this.naturalWidth, this.naturalHeight, 0, 0, this.width, this.height);
        ctx.closePath();
    }
}

module.exports = { Shape, Rectangle, Sprite, TextNode, RoundedRectangle };
