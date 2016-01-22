
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
    }
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
    return Math.acos((dot(v1, v2)) / (magnitude(v1) * magnitude(v2)));
}

function project(v1, v2) {
    return magnitude(v1) * Math.cos(angle(v2, v1));
}

module.exports = {
    normals, add, sub, unit, magnitude, dot, angle, div, mul, project
};