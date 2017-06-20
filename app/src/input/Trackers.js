
/*
 * Various user input and environment trackers. Just keyboard for now.
 */

// Constants for keycodes on sane people browsers.
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
    T: 84,
    SPACE: 32
};

function fireInput(func) {
    if (func) {
        func();
    }
}

/*
 * A tracker for the app key strokes. Fires callbacks when it notices a specific key.
 * Object properties:
 * - callbacks: An object with several callback functions like on(Forward/Backward/Left/Right)(Down/Up).
 */
class KeyboardTracker {
    constructor(callbacks) {
        this.callbacks = callbacks.inputs;

        document.addEventListener('keydown', (evt) => this.onKeyDown(evt));
        document.addEventListener('keyup', (evt) => this.onKeyUp(evt));
    }

    /*
     * React to a key down event. Fires appropriate callbacks.
     */
    onKeyDown(evt) {
        switch (evt.keyCode) {
            case KEYS.W:
                fireInput(this.callbacks.onForwardDown);
                break;
            case KEYS.A:
                fireInput(this.callbacks.onLeftDown);
                break;
            case KEYS.S:
                fireInput(this.callbacks.onReverseDown);
                break;
            case KEYS.D:
                fireInput(this.callbacks.onRightDown);
                break;
            default:
                break;
        }
    }

    /*
     * React to a key up event. Fires appropriate callbacks.
     */
    onKeyUp(evt) {
        switch (evt.keyCode) {
            case KEYS.W:
                fireInput(this.callbacks.onForwardUp);
                break;
            case KEYS.A:
                fireInput(this.callbacks.onLeftUp);
                break;
            case KEYS.S:
                fireInput(this.callbacks.onReverseUp);
                break;
            case KEYS.D:
                fireInput(this.callbacks.onRightUp);
                break;
            case KEYS.SPACE:
                fireInput(this.callbacks.onSpace);
                break;
            case KEYS.T:
                fireInput(this.callbacks.onKey('T'));
                break;
            default:
                break;
        }
    }
}

module.exports = { KeyboardTracker, KEYS }