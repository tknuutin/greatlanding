
let _ = require('lodash');

class RenderLoop {
    constructor(options = {}) {
        this.id = null;
        this.requested = false;
        this.ctx = options.canvas.getContext('2d');
        this.setSize(options.width, options.height);
        this.fetchShapes = options.fetchShapes;
    }

    setSize(w, h) {
        this.width = w;
        this.height = h;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.w, this.h);
    }

    _secretRender() {
        if (this.requested) {
            this.requested = false;
            this.clear();
            this.ctx.save();
            _.forEach(this.fetchShapes(), (shape) => {
                shape.prerender(this.ctx);
                shape.render(this.ctx);
                shape.postrender(this.ctx);
            });
            this.ctx.restore();
        }
    }

    render() {
        this.requested = true;
    }

    start() {
        this.id = setInterval(_.bind(this._secretRender, this), 33);
    }

    stop() {
        clearInterval(this.id);
    }
}

module.exports = { RenderLoop };
