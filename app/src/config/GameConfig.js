
/*
 * Default game configuration object.
 */
const DEFAULT_CONFIG = {
    // Limit for how tilted the rocket can be compared from the vector to the center of the planet when landing.
    LIMIT_ANGLE: 10,

    // Limit for the vertical speed compared to the planet surface when landing.
    LIMIT_VERTICAL: 2,

    // Limit for the lateral speed from the planet surface when landing.
    LIMIT_LATERAL: 1,

    FPS: 30,

    UI: {
        // UI element background color and alpha.
        BG_COLOR: '#2E2E2E',
        UI_BG_ALPHA: 0.9,

        // Normal text and warning text colors.
        TEXT_COLOR: '#A8A8A8',
        WARN_COLOR: '#ff0000',

        // Stroked text outline color.
        TEXT_STROKE: '#000',

        // Other text properties.
        TEXT_SIZE: 14,
        FONT: 'Play',

        // UI positioning offsets. Used to make a crude grid system.
        O_LEFT: 15,
        O_TOP: 15,
        O_TOP_SECOND: 75,
        COLUMN: 55,
        ROW: 25
    },

    // Configs for various rocket properties.
    ROCKET: {
        // Rocket logical size.
        WIDTH: 57,
        HEIGHT: 137.5,

        // Offset for the rocket vertical mid-point from the center. Needed
        // because of how the sprite looks - midpoint should be roughly where
        // it looks like the central mass point is.
        H_OFFSET: 5,

        // Factor of how big the rocket should be scaled from its normal size.
        FACTOR: 0.5,

        // Engine power values.
        ENGINES: {
            MAIN: {
                // How much the rocket accelerates forward on each engine tick,
                // and how much it uses fuel.
                THRUST: 0.4,
                // The angle on the rocket where it is fired.
                ANGLE: 180,

                // Size of the smoke effect.
                SCALE: 1,

                // The force in which the smoke is fired from the engine.
                FORCE: 3
            },
            LEFT: {
                THRUST: 0.22,
                ANGLE: 270,
                SCALE: 0.5,
                FORCE: 2
            },
            RIGHT: {
                THRUST: 0.22,
                ANGLE: 90,
                SCALE: 0.5,
                FORCE: 2
            },
            REVERSE: {
                THRUST: 0.175,
                ANGLE: 0,
                SCALE: 0.5,
                FORCE: 2
            }
        },

        // Amount of fuel at the start of the game. Should probably be by-map value?
        START_FUEL: 275
    },

    // Screen size.
    SCREEN: {
        WIDTH: 700,
        HEIGHT: 500
    },

    // The distance when to show landing info when nearing a planet.
    // Should maybe be a factor of gravity max distance?
    SHOW_LANDING_INFO: 2000
}

module.exports = DEFAULT_CONFIG;