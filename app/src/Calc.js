
function rads(deg) {
    return (Math.PI / 180) * deg;
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

module.exports = { rads, rotateAroundPoint };