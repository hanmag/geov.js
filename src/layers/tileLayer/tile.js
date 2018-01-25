import * as THREE from 'three';
import MathUtils from '../../util/MathUtils';
import tileProvider from './tile-provider';

const loader = new THREE.TextureLoader();

class Tile {
    constructor(radius, zoom, size, col, row, width) {
        this.id = zoom + '-' + col + '-' + row;
        this.radius = radius;
        this.zoom = zoom;
        this.size = size;
        this.row = row;
        this.col = col;
        this.width = width;

        this.phiStart = row === 0 ? 0 : MathUtils.HALFPI + Math.atan(((2 * row / size) - 1) * MathUtils.PI);
        this.height = row === size - 1 ? MathUtils.PI - this.phiStart :
            MathUtils.HALFPI + Math.atan(((2 * (row + 1) / size) - 1) * MathUtils.PI) - this.phiStart;

        this.url = tileProvider.getBingTileUrl(this.zoom, this.row, this.col);
        // this.load();
    }
    load() {
        if (this.state) return;

        if (!this.request) {
            this.request = new XMLHttpRequest();
            this.request.timeout = 5000; // time in milliseconds
        }

        var _this = this;
        this.state = 'loading';
        this.request.open('GET', this.url, true);
        this.request.responseType = 'blob';
        this.request.onload = function () {
            var blob = this.response;
            var img = document.createElement('img');
            img.onload = function (e) {
                window.URL.revokeObjectURL(img.src); // 清除释放

                _this.geometry = new THREE.SphereBufferGeometry(_this.radius, 16, 16, _this.col * _this.width, _this.width, _this.phiStart, _this.height);
                _this.texture = new THREE.Texture();
                _this.texture.image = img;
                _this.texture.format = THREE.RGBFormat;
                _this.texture.needsUpdate = true;

                _this.material = new THREE.MeshLambertMaterial({
                    map: _this.texture,
                    side: THREE.DoubleSide
                });
                _this.mesh = new THREE.Mesh(
                    _this.geometry,
                    _this.material
                );
                _this.mesh.tileId = _this.id;
                _this.state = 'loaded';
            };

            img.src = window.URL.createObjectURL(blob);
        };
        this.request.ontimeout = function () {
            _this.state = null;
            console.warn(_this.id, 'time out');
        };
        this.request.onerror = function () {
            _this.state = null;
        };
        this.request.send();
    }
    abort() {
        if (this.request) {
            this.request.abort();
            this.request = null;
        }
        this.state = null;
    }
    dispose() {
        this.abort();
        if (this.geometry)
            this.geometry.dispose();
        this.geometry = null;
        if (this.material) {
            this.material.dispose();
            this.texture.dispose();
            this.material = null;
            this.texture = null;
        }
        // this.mesh.dispose();
        this.mesh = null;
    }
};

export default Tile;