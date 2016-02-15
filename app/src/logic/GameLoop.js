
class GameLoop {
    constructor({ renderer, logicUpdate, logicAnalyze, onRendered }) {
        this.gameLogic = null;
        this.renderer = renderer;
        this.logicUpdate = logicUpdate;
        this.logicAnalyze = logicAnalyze;
        this.onRendered = onRendered;

        this.hasRendered = false;
        this.loopActive = false;

        this.focused = true;
    }

    /*
     * Game logic tick. Delegates calls to other game logic classes and handles graceful crashing.
     */
    logicUpdate() {
        try {
            this.logicUpdate();
            // let info = this.gameLogic.analyze();
            let info = this.logicAnalyze(info);

            if (info.stop) {
                this.stop = true;
            }

            if (info.nextLevel) {
                this.waitNextLevelCommand = true;
            }

            this.lastInfo = info;
        } catch (e) {
            console.error(e.stack);
            this.stopped = true;
        }
    }

    setFocused(value) {
        this.focused = value;
        if (value && !this.loopActive) {
            this.startLoop();
        }
    }

    renderUpdate() {
        let rocket = this.shapeManager.getRocket();
        if (rocket) {
            this.ui.update(this.lastInfo);
        }

        let shapes = this.shapeManager.getShapes();
        let camera = rocket ? {
            x: rocket.x, y: rocket.y
        } : { x: 0, y: 0 };

        this.renderer.updateEffects(shapes, this.lastInfo, camera);
        this.renderer.render(shapes, camera);
        this.renderer.renderUI(this.ui.getShapes());
        this.renderer.renderMinimap(shapes, camera);

        // Right now only considering the game loaded once we render once,
        // because of all our prerendering stuff!
        if (!this.hasRendered) {
            this.hasRendered = true;
            this.onRendered();
        }
    }

    /*
     * Creates the function for the game loop. Returns a function that will
     * run the game logic as many times as we should since last time the function was ran,
     * then renders the state.
     *
     * Forces game logic to run at FPS. Render steps may be skipped but will be caught up
     * in a weird jerk if needed, that might need to be refactored?
     *
     * Modified from: http://nokarma.org/2011/02/02/javascript-game-development-the-game-loop/
     */
    createStepFunction() {
        // Current number of logic loops done without a render.
        let loops = 0;

        // The amount of time between each render.
        let timeBetweenSteps = 1000 / FPS;

        // Max amount of render frames we can skip before we need to a render no matter what.
        let maxFrameSkip = 1000;

        // When the next game step should happen.
        let nextGameStep = (new Date()).getTime();

        return () => {
            loops = 0;

            while ((new Date()).getTime() > nextGameStep && loops < maxFrameSkip && this.focused) {
                this.logicUpdate();
                nextGameStep += timeBetweenSteps;
                loops++;
            }

            if (loops) {
                this.renderUpdate();
                this.stopped = this.lastInfo.stop;
            }
        };
    }

    /*
     * Start the game loop.
     */
    startLoop() {
        this.loopActive = true;
        let step = this.createStepFunction();
        let nextFrame = () => {
            step();
            if (!this.stopped) {
                if (this.focused) {
                    window.requestAnimationFrame(nextFrame);
                } else {
                    this.loopActive = false;
                }
            } else {
                console.warn('Stopped!');
            }
        };

        nextFrame();
    }
}

module.exports = { GameLoop };
