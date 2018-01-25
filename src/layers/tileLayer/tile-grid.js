import MathUtils from '../../util/MathUtils';
import tileCache from './tile-cache';
import Tile from './tile';

let lastTile, lastTiles, lastRange = 0;

// 正常球面纬度 转换为 墨卡托投影球面纬度
// -PI/2 < phi < PI/2
function geoToWebmercatorDegreePhi(phi) {
    return Math.atan(2 * phi);
}

// 墨卡托投影球面纬度 转换为 正常球面纬度
// -atan(PI) < phi < atan(PI)
function webmercatorToGeoDegreePhi(phi) {
    if (phi < -MathUtils.MAXPHI) return -MathUtils.HALFPI + 0.00001;
    if (phi > MathUtils.MAXPHI) return MathUtils.HALFPI - 0.00001;
    return Math.tan(phi) / 2;
}

function genTile(radius, zoom, size, col, row, width) {
    var tileId = zoom + '-' + col + '-' + row;
    var tile = tileCache.get(tileId);
    if (!tile) {
        tile = new Tile(radius, zoom, size, col, row, width);
        tileCache.add(tile);
    }

    return tile;
}

function getTile(radius, zoom, phi, theta) {
    while (theta < 0)
        theta += MathUtils.PI2;
    theta = theta % MathUtils.PI2;

    phi -= MathUtils.HALFPI;
    phi = webmercatorToGeoDegreePhi(phi) + MathUtils.HALFPI;

    var size = Math.pow(2, zoom);
    var unit = MathUtils.PI / size;
    var col = Math.floor(theta / (2 * unit));
    var row = Math.floor(phi / unit);
    var width = 2 * unit;

    return genTile(radius, zoom, size, col, row, width);
}

function reviseRowAndCol(size, row, col) {
    var size2 = size * 2;
    var sizeh = Math.floor(size / 2);
    if (row < 0) {
        row = -1 - row;
        col += sizeh;
    }
    row = (row + size2) % size2;
    if (row > size - 1) {
        row = size2 - row - 1;
        col += sizeh;
    }
    col = (col + size2) % size;

    return [row, col];
}

function getRoundTiles(tile, range) {
    const offsetY = Math.abs(tile.row / tile.size - 0.5) * 10;
    const roundSize = Math.floor((tile.zoom < 5 ? tile.zoom + 3 : 4 + offsetY) * range);
    const tiles = [],
        tileIds = [];
    for (let dr = 0; dr < roundSize; dr++) {
        for (let dc = 0; dc < roundSize; dc++) {
            let row_col = reviseRowAndCol(tile.size, tile.row + dr, tile.col + dc);
            let t = genTile(tile.radius, tile.zoom, tile.size, row_col[1], row_col[0], tile.width);
            if (tileIds.indexOf(t.id) < 0) {
                tileIds.push(t.id);
                tiles.push(t);
            }

            if (dc > 0) {
                row_col = reviseRowAndCol(tile.size, tile.row + dr, tile.col - dc);
                t = genTile(tile.radius, tile.zoom, tile.size, row_col[1], row_col[0], tile.width);
                if (tileIds.indexOf(t.id) < 0) {
                    tileIds.push(t.id);
                    tiles.push(t);
                }
            }
            if (dr > 0) {
                row_col = reviseRowAndCol(tile.size, tile.row - dr, tile.col + dc);
                t = genTile(tile.radius, tile.zoom, tile.size, row_col[1], row_col[0], tile.width);
                if (tileIds.indexOf(t.id) < 0) {
                    tileIds.push(t.id);
                    tiles.push(t);
                }
            }
            if (dc > 0 && dr > 0) {
                row_col = reviseRowAndCol(tile.size, tile.row - dr, tile.col - dc);
                t = genTile(tile.radius, tile.zoom, tile.size, row_col[1], row_col[0], tile.width);
                if (tileIds.indexOf(t.id) < 0) {
                    tileIds.push(t.id);
                    tiles.push(t);
                }
            }
        }
    }
    console.log(tile.zoom, roundSize, tiles.length, tileCache.size());
    return tiles;
}

export default {
    getVisibleTiles: function (radius, zoom, phi, theta, range) {
        if (this.using) return false;
        this.using = true;

        var tile = getTile(radius, zoom, phi, theta);
        if (lastTile && lastTile.id === tile.id && Math.abs(lastRange - range) < 0.1) {
            this.using = false;
            return false;
        }
        lastTile = tile;
        lastRange = range;

        var tiles = getRoundTiles(tile, range);
        lastTiles = tiles;

        this.using = false;
        return tiles;
    },
    isVisible: function (tileId) {
        return lastTiles && lastTiles.find(tile => tile.id === tileId);
    }
};