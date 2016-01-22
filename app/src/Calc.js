
let V = require('./Vector');

function rads(deg) {
    return (Math.PI / 180) * deg;
}

function degs(rad) {
    return rad * (180 / Math.PI);
}

function clampRot(rot) {
    if (rot < 0) {
        return (rot % 360) + 360;
    }
    return rot % 360;
}

function rotateAroundPoint(rotation, rotationpoint, inPoint) {
    // http://stackoverflow.com/questions/3249083/is-this-how-rotation-about-a-point-is-done
    let point = {
        x: inPoint.x,
        y: inPoint.y
    };

    // Translate
    let translatedX = point.x - rotationpoint.x;
    let translatedY = point.y - rotationpoint.y;

    point.x = Math.cos(rotation) * translatedX - Math.sin(rotation) * translatedY;
    point.y = Math.sin(rotation) * translatedX + Math.cos(rotation) * translatedY;

    // Translate back
    point.x += rotationpoint.x;
    point.y += rotationpoint.y;

    return point;
}

function distance(x1, y1, x2, y2) {
    return Math.sqrt((y1 - y2) * (y1 - y2) + (x1 - x2) * (x1 - x2));
}

function getPlanetLateralSpeed(planet, rocket) {
    let planetToShip = V.sub(planet, rocket);
    let surfaceTangential = V.normals(planetToShip)[0];
    let lateral = V.project(rocket.move.v, surfaceTangential);
    return Math.abs(lateral);
}

function getPlanetVerticalSpeed(planet, rocket) {
    let planetToShip = V.sub(planet, rocket);
    return V.project(rocket.move.v, planetToShip);;
}

module.exports = {
    rads, degs,
    rotateAroundPoint,
    distance,
    getPlanetLateralSpeed, getPlanetVerticalSpeed,
    clampRot
};
