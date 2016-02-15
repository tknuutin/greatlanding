
let _ = require('lodash');

function getDefaultBinds(shapeMgr, controller) {
    return _.chain({
        onForwardDown: (rocket) => {
            rocket.sendSignalToEngine(rocket.engines.main, true);
        },
        onForwardUp: (rocket) => {
            rocket.sendSignalToEngine(rocket.engines.main, false);
        },
        onReverseDown: (rocket) => {
            rocket.sendSignalToEngine(rocket.engines.reverse1, true);
            rocket.sendSignalToEngine(rocket.engines.reverse2, true);
        },
        onReverseUp: (rocket) => {
            rocket.sendSignalToEngine(rocket.engines.reverse1, false);
            rocket.sendSignalToEngine(rocket.engines.reverse2, false);
        },
        onRightDown: (rocket) => {
            rocket.sendSignalToEngine(rocket.engines.left, true);
        },
        onRightUp: (rocket) => {
            rocket.sendSignalToEngine(rocket.engines.left, false);
        },
        onLeftDown: (rocket) => {
            rocket.sendSignalToEngine(rocket.engines.right, true);
        },
        onLeftUp: (rocket) => {
            rocket.sendSignalToEngine(rocket.engines.right, false);
        }
    }).reduce((result, func, key) => {
        result[key] = () => func(shapeMgr.getRocket());
        return result;
    }, {}).merge({
        onSpace: () => {
            controller.reset();
            controller.init();
        },
        onEnter: () => {
            if (controller.waitNextLevelCommand) {
                controller.waitNextLevelCommand = false;
                controller.nextMap();
            }
        }
    }).value();
}

module.exports = { getDefaultBinds };
