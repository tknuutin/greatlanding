
let V = require('math/Vector');
let { applyGravity } = require('math/GravityUtil');

const MINIMAP_POINT_SPREAD = 650;
const MINIMAP_G_FACTOR = 5000;

function limitGravityLine(origin, affected, planet) {
    let result = { x: affected.x, y: affected.y };
    if (origin.x < planet.x && affected.x > planet.x) {
        result.x = planet.x;
    }
    if (origin.x > planet.x && affected.x < planet.x) {
        result.x = planet.x;
    }

    if (origin.y < planet.y && affected.y > planet.y) {
        result.y = planet.y;
    }
    if (origin.y > planet.y && affected.y < planet.y) {
        result.y = planet.y;
    }
    return result;
}

function makeWorldPoint(point, w, h, scale, cameraPos) {
    return {
        x: point.x - ((w * scale) / 2) + cameraPos.x,
        y: point.y - ((h * scale) / 2) + cameraPos.y
    };
}

function makeVisualPoint(point, w, h, scale, cameraPos) {
    return {
        x: point.x + ((w * scale) / 2) - cameraPos.x,
        y: point.y + ((h * scale) / 2) - cameraPos.y
    };
}

function renderLine(ctx, start, end) {
    ctx.save();

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);

    ctx.stroke();
    ctx.restore();
}

function applyMinimapGravity(pointWorld, pointVisual, planets, w, h, scale, cameraPos) {
    let visual = { x: pointVisual.x, y: pointVisual.y };
    let gravityDominator = planets[0];
    let gravity = null;
    for (let k = planets.length - 1; k >= 0; k--) {
        let g = applyGravity(planets[k], pointWorld);
        let gMag = V.magnitude(g);
        if (gravity === null || gravity < gMag) {
            gravityDominator = planets[k];
            gravity = gMag;
        }
        visual.x += g.x * MINIMAP_G_FACTOR;
        visual.y += g.y * MINIMAP_G_FACTOR;
    }

    let visualWorldPoint = makeWorldPoint(visual, w, h, scale, cameraPos);
    return limitGravityLine(pointWorld, visualWorldPoint, gravityDominator);
}

function renderMinimapGravityGrid(ctx, cameraPos, w, h, scale, planets) {
    ctx.save();

    let start = {
        x: -(MINIMAP_POINT_SPREAD * 3 + cameraPos.x) % MINIMAP_POINT_SPREAD,
        y: -(MINIMAP_POINT_SPREAD * 3 + cameraPos.y) % MINIMAP_POINT_SPREAD
    };

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0C3613';
    ctx.lineWidth = 100;

    let colsAmount = ((w * scale) / MINIMAP_POINT_SPREAD) + 6;
    let rowsAmount = ((h * scale) / MINIMAP_POINT_SPREAD) + 6;

    let columns = [];

    for (let i = 0; i < colsAmount; i++) {
        if (!columns[i]) {
            columns.push([]);
        }

        for (let j = 0; j < rowsAmount; j++) {
            let pointVisual = {
                x: start.x + i * MINIMAP_POINT_SPREAD,
                y: start.y + j * MINIMAP_POINT_SPREAD
            };

            let pointWorld = makeWorldPoint(pointVisual, w, h, scale, cameraPos);
            let finalWorldPoint = applyMinimapGravity(pointWorld, pointVisual, planets, w, h, scale, cameraPos);
            let finalVisual = makeVisualPoint(finalWorldPoint, w, h, scale, cameraPos);

            columns[i].push(finalVisual);

            // look for the point next to this point
            if (columns[i - 1] && columns[i - 1][j]) {
                renderLine(ctx, columns[i - 1][j], finalVisual);
            }

            // look for the point above this point
            if (columns[i] && columns[i][j - 1]) {
                renderLine(ctx, columns[i][j - 1], finalVisual);
            }
        }
    }
    ctx.restore();
}

module.exports = { renderMinimapGravityGrid };

