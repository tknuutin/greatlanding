
const DEFAULT_CONFIG = {
    LIMIT_ANGLE: 10,
    LIMIT_VERTICAL: 2,
    LIMIT_LATERAL: 1,

    FPS: 30,

    UI: {
        BG_COLOR: '#2E2E2E',
        UI_BG_ALPHA: 0.9,
        TEXT_COLOR: '#A8A8A8',
        WARN_COLOR: '#ff0000',
        TEXT_STROKE: '#000',
        TEXT_SIZE: 14,
        FONT: 'Play',
        O_LEFT: 15,
        O_TOP: 15,
        O_TOP_SECOND: 75,
        COLUMN: 55,
        ROW: 25
    },

    ROCKET: {
        WIDTH: 57,
        HEIGHT: 137.5,
        H_OFFSET: 5,
        FACTOR: 0.5,

        ENGINES: {
            MAIN: {
                THRUST: 0.5,
                ANGLE: 180,
                SCALE: 1,
                FORCE: 3
            },
            LEFT: {
                THRUST: 0.3,
                ANGLE: 270,
                SCALE: 0.5,
                FORCE: 2
            },
            RIGHT: {
                THRUST: 0.3,
                ANGLE: 90,
                SCALE: 0.5,
                FORCE: 2
            },
            REVERSE: {
                THRUST: 0.25,
                ANGLE: 0,
                SCALE: 0.5,
                FORCE: 2
            }
        },

        START_FUEL: 275
    },

    SCREEN: {
        WIDTH: 700,
        HEIGHT: 500
    },

    SHOW_LANDING_INFO: 2000
}

module.exports = DEFAULT_CONFIG;