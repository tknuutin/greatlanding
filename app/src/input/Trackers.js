
/*
 * Various user input and environment trackers. Just keyboard for now.
 */

// Constants for keycodes on sane people browsers.
const KEYS = {
    BACKSPACE: 8,
    SHIFT: 16,
    LEFT: 37,
    UP: 38,
    ENTER: 13,
    RIGHT: 39,
    DOWN: 40,
    ESC: 27,
    W: 87,
    A: 65,
    S: 83,
    D: 68,
    SPACE: 32
};

/*
 * A tracker for the app key strokes. Fires callbacks when it notices a specific key.
 * Object properties:
 * - callbacks: An object with several callback functions like on(Forward/Backward/Left/Right)(Down/Up).
 */
class KeyboardTracker {
    constructor(callbacks) {
        this.callbacks = callbacks;

        document.addEventListener('keydown', (evt) => this.onKeyDown(evt));
        document.addEventListener('keyup', (evt) => this.onKeyUp(evt));
    }

    /*
     * React to a key down event. Fires appropriate callbacks.
     */
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

    /*
     * React to a key up event. Fires appropriate callbacks.
     */
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

            case KEYS.ENTER:
                this.callbacks.onEnter();
            default:
                break;
        }
    }
}

module.exports = { KeyboardTracker, KEYS }