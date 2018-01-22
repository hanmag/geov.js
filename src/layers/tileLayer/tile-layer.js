import tileGrid from './tile-grid';
import tileCache from './tile-cache';

let controls;
let tiles = [];

function loadTiles() {
    if (!controls) return;

    var zoom = controls.zoom;
    var coord = controls.coord;
    var tileInfo = tileGrid.getTileInfoBySpherical(Math.max(2, 20 - zoom), coord.y, coord.x);
    var range = controls.getVisibleExtent();
    var tileInfos = tileGrid.getTilesByRange(tileInfo, range);
    tiles = [];
    tileInfos.forEach(tileInfo => {
        tiles.push(tileCache.use(tileInfo));
    });
}

export default {
    addToGlobe: function (STATE) {
        STATE.controls.addEventListener('change', loadTiles);
        controls = STATE.controls;
        tileCache.earthRadius = controls.earthRadius;
        STATE.layers.push(this);

        loadTiles();
    },
    update: function (STATE) {
        // add update remove
        tiles.forEach(tile => {
            if (!tile.inUse && tile.mesh) {
                STATE.scene.add(tile.mesh);
                tile.inUse = true;
            }
        });
        // todo
    }
};