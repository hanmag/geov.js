// 切片缓存
const TILE_CACHE = {};
// 切片访问队列，记录切片访问次序
let TILEID_QUEUE = [];
// 最大可维护切片数量
const MAX_TILE_SIZE = 1000;

// 更新最近访问列表顺序
function moveToEnd(tileId) {
    const index = TILEID_QUEUE.find(ele => {
        return ele === tileId;
    });
    TILEID_QUEUE = TILEID_QUEUE.concat(TILEID_QUEUE.splice(index, 1));
}

// 添加新的切片，删除最早访问的部分切片
function addToQueue(tileId) {
    TILEID_QUEUE.push(tileId);
    if (TILEID_QUEUE.length > MAX_TILE_SIZE) {
        for (let index = 0; index < MAX_TILE_SIZE * 0.3; index++) {
            const id = TILEID_QUEUE.shift();
            TILE_CACHE[id].dispose();
            delete TILE_CACHE[id];
        }
    }
}

export default {
    get: function (tileId) {
        const tile = TILE_CACHE[tileId];
        if (tile) {
            moveToEnd(tileId);
        }
        return tile;
    },
    add: function (tile) {
        addToQueue(tile.id);
        TILE_CACHE[tile.id] = tile;
    },
    size: function () {
        return TILEID_QUEUE.length;
    }
};