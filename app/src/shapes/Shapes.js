
let _ = require('lodash');

/*
 * Generic shape superclass. Takes in an options object.
 * - name: Name of the shape as string. For debug.
 * - x: X coordinate in the game map.
 * - y: Y coordinate in the game map.
 * - fillStyle: Fill color of the shape as hex string.
 * - strokeStyle: Stroke color of the shape as hex string.
 * - rotation: Rotation of the shape as degrees.
 * - scaleX: The X scaling factor of the shape. Must be larger than 0.
 * - scaleY: The Y scaling factor of the shape. Must be larger than 0.
 * - regX: The offset to the X registration point. For example, a centered
 *   shape will have a regX of width/2.
 * - regY: The offset to the Y registration point.
 * - lineWidth: Width of the stroke line.
 * - alpha: The transparency amount of the shape, between 0 and 1.
 * - visible: Is this shape displayed?
 */
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
        this.visible = opts.visible !== undefined ? opts.visible : true;
    }

    /*
     * Initialize the context for drawing this shape, for example
     * scale and rotation.
     */
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

    /*
     * Do common draw processes such as fill and de-initialize the draw context.
     */
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

/*
 * A simple rectangle with a width and height. Subclasses Shape.
 */
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

/*
 * A rectangle with rounded edges. Subclases Rectangle.
 * - cornerRadius: The corner radius for all corners.
 * - cornerRadius1: The top left corner radius. Overrides cornerRadius if given.
 * - cornerRadius2: The top right corner radius. Overrides cornerRadius if given.
 * - cornerRadius3: The bottom right corner radius. Overrides cornerRadius if given.
 * - cornerRadius4: The bottom left corner radius. Overrides cornerRadius if given.
 */
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
    }
}

/*
 * Measure the pixel width of a given rendered string with a given font.
 */
function measureText(text, fontString) {
    let span = document.createElement('span');
    span.style.font = fontString;
    span.style.whiteSpace = 'nowrap';
    span.style.position = 'absolute';
    span.innerHTML = text;
    span.style.visibility = 'hidden';
    span.style.overflow = 'hidden';
    document.body.appendChild(span);
    let w = span.offsetWidth;
    document.body.removeChild(span);

    return w;
}

/*
 * A text node rendered on the canvas. Subclasses Shape.
 * - text: Text displayed.
 * - fontSize: Size of the rendered font
 * - fontStyle: Weight of the rendered font.
 * - fontFamily: The font family.
 * - textAlign: Alignment of the text.
 * - textBaseLine: The vertical text baseline.
 */
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

    /*
     * Calculate the current width of the rendered text.
     */
    getWidth() {
        return measureText(this.lines[0], this.formatted);
    }

    /*
     * Set the text of this TextNode.
     */
    setText(text) {
        this.text = text;

        // Only support single line textnodes for now.
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

/*
 * A generic image rendered on the canvas. Subclasses Shape.
 * - width: Width of the rendered image.
 * - height: Height of the rendered image.
 * - img: Image instance.
 */
class Sprite extends Shape {
    constructor(opts = {}) {
        super(opts);
        this.width = opts.width;
        this.height = opts.height;
        this.img = opts.img;

        this.naturalWidth = this.img.width;
        this.naturalHeight = this.img.height;

        // Do this later
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
