import Tile from './tile';

const cache = {};

export default {
    use: function (tileInfo) {
        var tile = cache[tileInfo.id];
        if (tile) return tile;
        cache[tileInfo.id] = new Tile(tileInfo, this.earthRadius);
        return cache[tileInfo.id];
    }
};