// tile grid system
const PI = 3.141592653589793;
const PI2 = PI * 2;

function getTileInfo(zoom, size, row, col, phiLength, thetaLength) {
    row = (row + size) % size;
    col = (col + size) % size;
    return {
        id: zoom + '-' + col + '-' + row,
        z: zoom,
        col: col,
        row: row,
        phiStart: row * (PI / size),
        phiLength: phiLength,
        thetaStart: col * (PI2 / size),
        thetaLength: thetaLength
    };
}

export default {
    getTileInfoBySpherical: function (level, phi, theta) {
        var zoom = Math.round(level);
        var size = Math.pow(2, zoom);
        while (theta < 0)
            theta += PI2;
        theta = theta % PI2;
        var x = Math.floor(theta / (PI2 / size));
        var y = Math.floor(phi / (PI / size));
        var tileId = zoom + '-' + x + '-' + y;
        return {
            id: tileId,
            z: zoom,
            col: x,
            row: y,
            phiStart: y * (PI / size),
            phiLength: PI / size,
            thetaStart: x * (PI2 / size),
            thetaLength: PI2 / size
        };
    },
    getTilesByRange: function (tileInfo, range) {
        var zoom = tileInfo.z;
        var size = Math.pow(2, zoom);
        var dx = PI2 / size;
        var dy = PI / size;
        var dcol = Math.ceil(range / dx);
        var drow = Math.ceil(range / dy);
        var tiles = [];
        for (var row = 0; row <= drow; row++) {
            for (var col = 0; col <= dcol; col++) {
                tiles.push(getTileInfo(zoom, size, tileInfo.row + row, tileInfo.col + col, tileInfo.phiLength, tileInfo.thetaLength));
                if (col > 0) {
                    tiles.push(getTileInfo(zoom, size, tileInfo.row + row, tileInfo.col - col, tileInfo.phiLength, tileInfo.thetaLength));
                }
                if (row > 0) {
                    tiles.push(getTileInfo(zoom, size, tileInfo.row - row, tileInfo.col + col, tileInfo.phiLength, tileInfo.thetaLength));
                }
                if (col > 0 && row > 0) {
                    tiles.push(getTileInfo(zoom, size, tileInfo.row - row, tileInfo.col - col, tileInfo.phiLength, tileInfo.thetaLength));
                }
            }
        }

        return tiles;
    }
};