

// Due to floating point inaccuracy, sometimes vector math results would be off
// a little - for example, after some angle calculation, Math.acos would be called
// with 1.00000000002 or such. Round if difference from limits is not big.
// I'm sure there's a better way to do this.
const EPSILON = 0.00000000000001;

function guardedAcos(inValue) {
    let value = null;
    if (inValue > 1 && (inValue - 1) < EPSILON) {
        value = 1;
    } else if (inValue < -1 && Math.abs(inValue + 1) > EPSILON) {
        value = -1;
    }
    return Math.acos(value);
}

function normals(v) {
    return [{ x: -v.y, y: v.x }, { x: v.y, y: -v.x}];
}

function add(v1, v2) {
    return {
        x: v1.x + v2.x, y: v1.y + v2.y
    };
}

function sub(v1, v2) {
    return {
        x: v1.x - v2.x, y: v1.y - v2.y
    };
}

function div(v1, scalar) {
    return {
        x: v1.x / scalar,
        y: v1.y / scalar
    };
}

function mul(v1, scalar) {
    return {
        x: v1.x * scalar,
        y: v1.y * scalar
    };
}

function unit(v) {
    return div(v, magnitude(v));
}

function magnitude(v) {
    return Math.sqrt(Math.pow(v.x, 2) + Math.pow(v.y, 2));
}

function dot(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y;
}

function angle(v1, v2) {
    // let temp = ;
    return guardedAcos(dot(v1, v2) / (magnitude(v1) * magnitude(v2)));
}

function project(v1, v2) {
    return magnitude(v1) * Math.cos(angle(v2, v1));
}

module.exports = {
    normals, add, sub, unit, magnitude, dot, angle, div, mul, project
};
