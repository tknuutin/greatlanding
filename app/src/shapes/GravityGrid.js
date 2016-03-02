
let V = require('math/Vector');
let { applyGravity } = require('math/GravityUtil');

// In real-game-world distances, how spread apart are the points on the minimap grid?
const MINIMAP_POINT_SPREAD = 650;

// The amount of exaggeration on the minimap gravity for graphical effect.
const MINIMAP_G_FACTOR = 5000;

/*
 * Limit a point to not visually go "through" the planet if its too close to the gravity well.
 * Returns a point that at maximum is at the center of the planet.
 * - origin: The point without gravity affecting it.
 * - affected: The point with gravity effects.
 * - planet: The planet with the most gravitational impact on the point.
 */
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

/*
 * Convert a minimap visual point coordinate into a game world coordinate.
 * - point: Point object
 * - w: Width of the minimap.
 * - h: Height of the minimap.
 * - scale: Zoom out factor of the minimap.
 * - cameraPos: Point object for the camera position.
 */
function makeWorldPoint(point, w, h, scale, cameraPos) {
    return {
        x: point.x - ((w * scale) / 2) + cameraPos.x,
        y: point.y - ((h * scale) / 2) + cameraPos.y
    };
}

/*
 * Convert a world coordinate into a minimap visual coordinate.
 * - point: Point object
 * - w: Width of the minimap.
 * - h: Height of the minimap.
 * - scale: Zoom out factor of the minimap.
 * - cameraPos: Point object for the camera position.
 */
function makeVisualPoint(point, w, h, scale, cameraPos) {
    return {
        x: point.x + ((w * scale) / 2) - cameraPos.x,
        y: point.y + ((h * scale) / 2) - cameraPos.y
    };
}

/*
 * Render a line on the context.
 * - ctx: Rendering context instance.
 * - start: Start point object.
 * - end: End point object.
 */
function renderLine(ctx, start, end) {
    ctx.save();

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);

    ctx.stroke();
    ctx.restore();
}

/*
 * Apply gravity to a minimap point.
 * - pointWorld: A point object of the minimap point in the game world.
 * - pointVisual A point object of the minimap point in the minimap visual coordinates.
 * - planets: An array of Planet instances.
 * - w: Width of the minimap.
 * - h: Height of the minimap.
 * - scale: Zoom out factor of the minimap.
 * - cameraPos: A point object for the camera position.
 */
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

// How many extra grids on the sides we should draw to make sure there are no graphical oddities?
const MINIMAP_GRID_BUFFER = 3;

/*
 * Render the minimap gravity grid .
 * - ctx: The canvas rendering context instance.
 * - cameraPos: Camera position as an x, y object.
 * - w: Width of the minimap as a number.
 * - h: Height of the minimap as a number.
 * - scale: Zoom out factor of the minimap as a number.
 * - planets: An array of Planet instances in the game world.
 */
function renderMinimapGravityGrid(ctx, cameraPos, w, h, scale, planets) {
    ctx.save();

    let start = {
        x: -(MINIMAP_POINT_SPREAD * MINIMAP_GRID_BUFFER + cameraPos.x) % MINIMAP_POINT_SPREAD,
        y: -(MINIMAP_POINT_SPREAD * MINIMAP_GRID_BUFFER + cameraPos.y) % MINIMAP_POINT_SPREAD
    };

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0C3613';
    ctx.lineWidth = scale;  // To make the lines about 1 pixel in width.

    let colsAmount = ((w * scale) / MINIMAP_POINT_SPREAD) + MINIMAP_GRID_BUFFER;
    let rowsAmount = ((h * scale) / MINIMAP_POINT_SPREAD) + MINIMAP_GRID_BUFFER;

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

