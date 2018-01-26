import MathUtils from '../../util/MathUtils';
import tileCache from './tile-cache';
import Tile from './tile';

let lastVisibleExtent, visibleTiles;
const EPS = 0.001;

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

// 根据视线视角计算可视切片
function getRoundTiles(tile, pitch, bearing) {
    const offsetY = Math.abs(tile.row / tile.size - 0.5) * 10;
    const pitchRatio = 270 / (270 - pitch);
    // 靠近高纬度、倾斜角大的情况下，可视切片数量大
    const roundSize = Math.floor(
        (tile.zoom < 4 ? tile.zoom + 3 : 4 + offsetY) * pitchRatio
    );

    const centerRow = Math.round(tile.row + Math.cos(bearing) * (pitchRatio - 1) * tile.zoom * tile.zoom * 0.05),
        centerCol = Math.round(tile.col + Math.sin(bearing) * (pitchRatio - 1) * tile.zoom * tile.zoom * 0.05);
    const tiles = [],
        tileIds = [];
    for (let dr = 0; dr < roundSize; dr++) {
        for (let dc = 0; dc < roundSize; dc++) {
            if (tiles.length > 100 * pitchRatio) break;
            let row_col = reviseRowAndCol(tile.size, centerRow + dr, centerCol + dc);
            let _id = tile.zoom + '-' + row_col[1] + '-' + row_col[0];
            if (tileIds.indexOf(_id) < 0) {
                let t = genTile(tile.radius, tile.zoom, tile.size, row_col[1], row_col[0], tile.width);
                tileIds.push(t.id);
                tiles.push(t);
            }

            if (dc > 0) {
                row_col = reviseRowAndCol(tile.size, centerRow + dr, centerCol - dc);
                _id = tile.zoom + '-' + row_col[1] + '-' + row_col[0];
                if (tileIds.indexOf(_id) < 0) {
                    let t = genTile(tile.radius, tile.zoom, tile.size, row_col[1], row_col[0], tile.width);
                    tileIds.push(t.id);
                    tiles.push(t);
                }
            }
            if (dr > 0) {
                row_col = reviseRowAndCol(tile.size, centerRow - dr, centerCol + dc);
                _id = tile.zoom + '-' + row_col[1] + '-' + row_col[0];
                if (tileIds.indexOf(_id) < 0) {
                    let t = genTile(tile.radius, tile.zoom, tile.size, row_col[1], row_col[0], tile.width);
                    tileIds.push(t.id);
                    tiles.push(t);
                }
            }
            if (dc > 0 && dr > 0) {
                row_col = reviseRowAndCol(tile.size, centerRow - dr, centerCol - dc);
                _id = tile.zoom + '-' + row_col[1] + '-' + row_col[0];
                if (tileIds.indexOf(_id) < 0) {
                    let t = genTile(tile.radius, tile.zoom, tile.size, row_col[1], row_col[0], tile.width);
                    tileIds.push(t.id);
                    tiles.push(t);
                }
            }
        }
    }
    console.log(tile.zoom, tile.row, tile.col, centerRow, centerCol, roundSize, tiles.length, pitchRatio);
    return tiles;
}

export default {
    getVisibleTiles: function (radius, zoom, phi, theta, pitch, bearing) {
        var tile = getTile(radius, zoom, phi, theta);

        if (lastVisibleExtent && tile.id === lastVisibleExtent.id &&
            Math.abs(pitch - lastVisibleExtent.pitch) < EPS &&
            Math.abs(bearing - lastVisibleExtent.bearing) < EPS) {
            return false;
        }

        lastVisibleExtent = {
            id: tile.id,
            pitch: pitch,
            bearing: bearing
        };

        visibleTiles = getRoundTiles(tile, pitch, bearing);
        return visibleTiles;
    },
    isVisible: function (tileId) {
        return visibleTiles && visibleTiles.find(tile => tile.id === tileId);
    }
};