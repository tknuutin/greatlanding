
let V = require('math/Vector');

/*
 * Converts degrees to radians.
 */
function rads(deg) {
    return (Math.PI / 180) * deg;
}

/*
 * Converts radians to degrees.
 */
function degs(rad) {
    return rad * (180 / Math.PI);
}

/*
 * Clamps a rotational degree value between 0 and 360.
 */
function clampRot(rot) {
    if (rot < 0) {
        return (rot % 360) + 360;
    }
    return rot % 360;
}

/*
 * Checks if two lines intersect. Returns an object with an "intersects" boolean,
 * and x,y values of the possible intersection.
 */
function linesIntersect(line1StartX, line1StartY, line1EndX, line1EndY, line2StartX, line2StartY, line2EndX, line2EndY) {
    // if the lines intersect, the result contains the x and y of the intersection (treating the lines as infinite)
    // and booleans for whether line segment 1 or line segment 2 contain the point
    let denominator;
    let a;
    let b;
    let numerator1;
    let numerator2;
    let result = {
        x: null,
        y: null,
    };
    denominator = ((line2EndY - line2StartY) * (line1EndX - line1StartX)) - ((line2EndX - line2StartX) * (line1EndY - line1StartY));
    if (denominator === 0) {
        return result;
    }
    a = line1StartY - line2StartY;
    b = line1StartX - line2StartX;
    numerator1 = ((line2EndX - line2StartX) * a) - ((line2EndY - line2StartY) * b);
    numerator2 = ((line1EndX - line1StartX) * a) - ((line1EndY - line1StartY) * b);
    a = numerator1 / denominator;
    b = numerator2 / denominator;

    // if we cast these lines infinitely in both directions, they intersect here:
    result.x = line1StartX + (a * (line1EndX - line1StartX));
    result.y = line1StartY + (a * (line1EndY - line1StartY));

    // if line1 and line2 are segments, they intersect if both of the above are true
    if ((a > 0 && a < 1) && (b > 0 && b < 1) ||
        // also intersects if we hit any of the endpoints
        (line1StartX === result.x && line1StartY === result.y) ||
        (line1EndX === result.x && line1EndY === result.y) ||
        (line2StartX === result.x && line2StartY === result.y) ||
        (line2EndX === result.x && line2EndY === result.y)){

        result.intersects = true;
    }
    else {
        result.intersects = false;
    }
    return result;
};

/*
 * Rotate a point around another point. Returns an object with x,y properties.
 * - rotation: Amount to rotate, in radians
 * - rotationPoint: Point to rotate around, object with x,y properties
 * - inPoint: Point to rotate, object with x,y properties
 */
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

/*
 * Returns the distance between two points.
 */
function distance(x1, y1, x2, y2) {
    return Math.sqrt((y1 - y2) * (y1 - y2) + (x1 - x2) * (x1 - x2));
}

function distancePoints(p1, p2) {
    return distance(p1.x, p1.y, p2.x, p2.y);
}

/*
 * Get the lateral speed of a rocket compared to the planet's surface.
 * Returns a Number.
 * - planet: Planet instance
 * - rocket: Rocket instance
 */
function getPlanetLateralSpeed(planet, rocket) {
    if (V.magnitude(rocket.move.v) === 0) {
        return 0;
    }

    let planetToShip = V.sub(planet, rocket);
    let surfaceTangential = V.normals(planetToShip)[0];
    let lateral = V.project(rocket.move.v, surfaceTangential);
    return Math.abs(lateral);
}

/*
 * Get the vertical speed of a rocket compared to the planet's surface.
 * Returns a Number.
 * - planet: Planet instance
 * - rocket: Rocket instance
 */
function getPlanetVerticalSpeed(planet, rocket) {
    if (V.magnitude(rocket.move.v) === 0) {
        return 0;
    }

    let planetToShip = V.sub(planet, rocket);
    return V.project(rocket.move.v, planetToShip);
}

module.exports = {
    rads, degs,
    rotateAroundPoint,
    distance, distancePoints,
    getPlanetLateralSpeed, getPlanetVerticalSpeed,
    clampRot,
    linesIntersect
};
