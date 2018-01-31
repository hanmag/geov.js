import * as THREE from 'three';
import MathUtils from '../../util/MathUtils';
import tileGrid from './tile-grid';

let controls, tiles;
let tilesInScene = {};
let needUpdate = false,
    inControl = false;

let imageMesh;

function loadTiles(force) {
    if (!controls) return;

    if (force || (!needUpdate && !inControl)) {
        inControl = true;

        var zoom = controls.zoom;
        var coord = controls.coord;

        var result = tileGrid.getVisibleTiles(controls.earthRadius,
            Math.round(Math.min(Math.max(3, 20 - zoom)), 18),
            coord.y, coord.x + MathUtils.HALFPI,
            controls.pitch, controls.bearing);

        if (result) {
            if (tiles) {
                // 尚未加载完成 且 移出视野范围 的切片 停止加载
                tiles.forEach(tile => {
                    if (!tileGrid.isVisible(tile.id) && tile.state === 'loading') {
                        tile.abort();
                    }
                });
            }

            tiles = result;

            needUpdate = true;
        }

        inControl = false;
    }
}

export default {
    addToGlobe: function (STATE) {
        imageMesh = new THREE.Mesh(
            new THREE.SphereGeometry(STATE.radius * 0.99, 32, 32),
            new THREE.MeshBasicMaterial({
                color: 0x444444,
                side: THREE.DoubleSide
            })
        );

        controls = STATE.controls;
        controls.addEventListener('change', loadTiles);
        controls.addEventListener('end', () => loadTiles(true));
        STATE.layers.push(this);

        loadTiles();
        STATE.scene.add(imageMesh);
    },
    update: function (STATE) {
        if (!needUpdate) return;

        // add
        if (!tiles) return;
        let loadingCount = 0;
        tiles.forEach(tile => {
            if (tile.state === 'loading') {
                // when is loading ?
                loadingCount++;
            } else if (!tile.state) {
                tile.load();
                loadingCount++;
            }
        });

        if (loadingCount < tiles.length * 0.2) {
            tiles.forEach(tile => {
                if (!tilesInScene[tile.id] && tile.state === 'loaded') {
                    STATE.scene.add(tile.mesh);
                    tilesInScene[tile.id] = tile.mesh;
                }
            });
            // remove all unvisible tiles when 80% loaded
            Object.keys(tilesInScene).forEach(tileId => {
                if (!tileGrid.isVisible(tileId)) {
                    STATE.scene.remove(tilesInScene[tileId]);
                    delete tilesInScene[tileId];
                }
            });
        }

        needUpdate = loadingCount > 0;
        if (!needUpdate) {
            if (imageMesh.material.side == THREE.DoubleSide) {
                imageMesh.material.side = THREE.BackSide;
                imageMesh.material.needsUpdate = true;
            }
            console.log('complete', Object.keys(tilesInScene).length);
        }
    }
};