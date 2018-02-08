import * as THREE from 'three';
import MathUtils from '../../util/MathUtils';
import GeoUtils from '../../util/GeoUtils';
import tileProvider from './tile-provider';

const loader = new THREE.TextureLoader();
const origin = new THREE.Vector3(0, 0, 0);
const pointMaterial = new THREE.MeshBasicMaterial({
    color: 0xdd5555,
    side: THREE.BackSide
});
const lineMaterial = new THREE.LineBasicMaterial({
    color: 0xaaaaaa,
    side: THREE.FrontSide
});
const shapeMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    side: THREE.DoubleSide
});

// todo:  vectortile  rastertile  extend tile
// todo:  tile factory 对tilegrid屏蔽切片类型
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

        // this.url = tileProvider.getBingTileUrl(this.zoom, this.row, this.col);
        // this.type = 'raster-tile';
        this.url = tileProvider.getMapzenTileUrl(this.zoom, this.row, this.col);
        this.type = 'vector-tile';
        // this.load();
    }
    load() {
        if (this.state) return;

        if (!this.request) {
            this.request = new XMLHttpRequest();
            this.request.timeout = 10000; // time in milliseconds
        }

        const _this = this;
        this.state = 'loading';
        this.request.open('GET', this.url, true);
        this.request.responseType = this.type == 'raster-tile' ? 'blob' : 'json';
        this.request.onload = function () {
            if (_this.type == 'raster-tile') {
                const blob = this.response;
                const img = document.createElement('img');
                img.onload = function (e) {
                    window.URL.revokeObjectURL(img.src); // 清除释放

                    _this.heightSegments = Math.max(12 - _this.zoom, 5);
                    _this.widthSegments = _this.zoom < 5 ? 12 : 3;
                    _this.geometry = new THREE.SphereBufferGeometry(_this.radius, _this.widthSegments, _this.heightSegments, _this.col * _this.width, _this.width, _this.phiStart, _this.height);

                    if (_this.zoom < 12 && _this.row > 0 && _this.row < _this.size - 1) {
                        _this.geometry.removeAttribute('uv');
                        const _mphiStart = Math.tan(_this.phiStart - MathUtils.HALFPI) / 2;
                        const _mphiEnd = Math.tan(_this.phiStart + _this.height - MathUtils.HALFPI) / 2;
                        const quad_uvs = [];
                        for (let heightIndex = 0; heightIndex <= _this.heightSegments; heightIndex++) {
                            const _phi = _this.phiStart + (heightIndex / _this.heightSegments * _this.height);
                            const _mphi = Math.tan(_phi - MathUtils.HALFPI) / 2;
                            const _y = (_mphiEnd - _mphi) / (_mphiEnd - _mphiStart);
                            for (let widthIndex = 0; widthIndex <= _this.widthSegments; widthIndex++) {
                                quad_uvs.push(widthIndex / _this.widthSegments);
                                quad_uvs.push(_y);
                            }
                        }
                        _this.geometry.addAttribute('uv', new THREE.BufferAttribute(new Float32Array(quad_uvs), 2));
                    }
                    _this.texture = new THREE.Texture();
                    _this.texture.image = img;
                    _this.texture.format = THREE.RGBFormat;
                    _this.texture.needsUpdate = true;

                    _this.material = new THREE.MeshLambertMaterial({
                        map: _this.texture,
                        side: THREE.FrontSide
                    });
                    _this.mesh = new THREE.Mesh(
                        _this.geometry,
                        _this.material
                    );
                    _this.mesh.tileId = _this.id;
                    _this.state = 'loaded';
                };

                img.src = window.URL.createObjectURL(blob);
            } else if (_this.type == 'vector-tile') {
                const group = new THREE.Group();
                const layers = this.response;
                for (const layerName in layers) {
                    if (layers.hasOwnProperty(layerName)) {
                        const layer = layers[layerName];
                        if (layer.type != 'FeatureCollection') {
                            console.warn('layer.type', layer.type);
                            continue;
                        }

                        if (layer.features.length == 0) continue;

                        layer.features.forEach(feature => {
                            if (feature.geometry.type == 'Point') {
                                if (feature.properties.kind != 'country')
                                    return;
                                const geometry = new THREE.CircleBufferGeometry(36, 16);
                                const mesh = new THREE.Mesh(geometry, pointMaterial);
                                const position = GeoUtils.geoToSphere(_this.radius, feature.geometry.coordinates);
                                mesh.position.x = position.x;
                                mesh.position.y = position.y;
                                mesh.position.z = position.z;
                                mesh.lookAt(origin);
                                group.add(mesh);
                            } else if (feature.geometry.type == 'LineString') {
                                const geometry = new THREE.Geometry();
                                feature.geometry.coordinates.forEach(p => {
                                    geometry.vertices.push(
                                        GeoUtils.geoToSphere(_this.radius, p)
                                    );
                                });

                                const line = new THREE.Line(geometry, lineMaterial);
                                group.add(line);
                            } else if (feature.geometry.type == 'Polygon') {
                                // 多边形曲面生成算法
                                // 1、判断是否为凹多边形，分解为一个或多个凸多边形。
                                // 2、三角化凸多边形，使用three.js中shapeutil提供的三角化方法。
                                // 3、在每个三角形中随机生成点，生成点的个数与三角形面积成正比，生成算法：矩形随机点=>两边中心点对称映射。
                                // 4、对每个三角形的所有点分别使用Delaunay三角剖分算法。
                                // 5、合并多个三角形、合并多个凸多边形。
                                // 6、得到所有三角面及其顶点。

                                // feature.geometry.coordinates.forEach(coord => {
                                //     const geometry = new THREE.Geometry();
                                //     coord.forEach(p => {
                                //         geometry.vertices.push(
                                //             GeoUtils.geoToSphere(_this.radius, p)
                                //         );
                                //     });

                                //     for (var i = 0; i < coord.length; i++) {
                                //         geometry.faces.push(new THREE.Face3(i, (i + 1) % coord.length, (i + 2) % coord.length));
                                //     }

                                //     const mesh = new THREE.Mesh(geometry, shapeMaterial);
                                //     group.add(mesh);
                                // });
                            }
                        });
                    }
                }


                _this.mesh = group;
                _this.mesh.tileId = _this.id;
                _this.state = 'loaded';
            }
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