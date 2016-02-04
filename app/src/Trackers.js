
const KEYS = {
    BACKSPACE: 8,
    SHIFT: 16,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    ESC: 27,
    W: 87,
    A: 65,
    S: 83,
    D: 68,
    SPACE: 32
};

class KeyboardTracker {
    constructor(callbacks) {
        this.callbacks = callbacks;

        document.addEventListener('keydown', (evt) => this.onKeyDown(evt));
        document.addEventListener('keyup', (evt) => this.onKeyUp(evt));
    }

    onKeyDown(evt) {
        switch (evt.keyCode) {
            case KEYS.W:
                this.callbacks.onForwardDown();
                break;
            case KEYS.A:
                this.callbacks.onLeftDown();
                break;
            case KEYS.S:
                this.callbacks.onReverseDown();
                break;
            case KEYS.D:
                this.callbacks.onRightDown();
                break;
            default:
                break;
        }
    }

    onKeyUp(evt) {
        switch (evt.keyCode) {
            case KEYS.W:
                this.callbacks.onForwardUp();
                break;
            case KEYS.A:
                this.callbacks.onLeftUp();
                break;
            case KEYS.S:
                this.callbacks.onReverseUp();
                break;
            case KEYS.D:
                this.callbacks.onRightUp();
                break;
            case KEYS.SPACE:
                this.callbacks.onSpace();
            default:
                break;
        }
    }
}

module.exports = { KeyboardTracker, KEYS }