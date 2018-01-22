import * as THREE from 'three';

import tileProvider from './tile-provider';

const loader = new THREE.TextureLoader();

class Tile {
    constructor(tileInfo, earthRadius) {
        this.zoom = tileInfo.z;
        this.row = tileInfo.row;
        this.col = tileInfo.col;

        // todo webMercatorToDegreeGeographic
        this.geometry = new THREE.SphereBufferGeometry(earthRadius, 32, 32, tileInfo.thetaStart, tileInfo.thetaLength, tileInfo.phiStart, tileInfo.phiLength);
        this.url = tileProvider.getTileUrl(this.zoom, this.row, this.col);

        var _this = this;
        loader.load(this.url, t => {
            _this.mesh = new THREE.Mesh(
                _this.geometry,
                new THREE.MeshPhongMaterial({
                    map: t,
                    shininess: 20,
                    side: THREE.DoubleSide
                })
            );
            _this.mesh.tileId = tileInfo.id;
        });
    }
};

export default Tile;