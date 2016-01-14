
let _ = require('lodash');

class Renderer {
    constructor(options = {}) {
        this.id = null;
        this.requested = false;
        this.ctx = options.canvas.getContext('2d');
        this.setSize(options.width, options.height);

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

    render(shapes) {
        if (this.logging) {
            this.count++;
        }

        this.clear();
        this.ctx.save();
        _.forEach(shapes, (shape) => {
            shape.prerender(this.ctx);
            shape.render(this.ctx);
            shape.postrender(this.ctx);
        });
        this.ctx.restore();
    }

    logFps() {
        this.logging = true;
        setInterval(() => {
            console.log('FPS:', this.count);
            this.count = 0;
        }, 1000);
    }
}

module.exports = { Renderer };
