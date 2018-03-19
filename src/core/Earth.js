import * as THREE from 'three';
import EarthControls from 'earth-camera-controls';
import {
    isString
} from '../util/common';
import Size from '../geo/Size';
import Coordinate from '../geo/Coordinate';
import Browser from './Browser';
import Universe from './Universe';
import Layer from './Layer';
import {
    createEasyLayer
} from './BuildIn';

const Unit = 100;
const EarthRadius = 6371 * Unit;

/*!
 * contains code from maptalks.js
 * https://github.com/maptalks/maptalks.js
 * LICENSE : BSD 3
 * (c) maptalks.org
 *
 */
class Earth {

    constructor(container, options) {
        if (!options) {
            throw new Error('Invalid options when creating earth.');
        }

        const zoom = options['zoom'] ? options['zoom'] : 1;
        const maxZoom = options['maxZoom'] ? options['maxZoom'] : 19;
        const minZoom = options['minZoom'] ? options['minZoom'] : 1;
        const center = new Coordinate(options['center'] ? options['center'] : [100, 30]);
        const layers = options['layers'];
        const easyLayer = options['easyLayer'];

        this._radius = EarthRadius;
        this._loaded = false;

        this._layers = [];
        this._zoomLevel = maxZoom - zoom;
        this._maxLevel = maxZoom;
        this._minLevel = minZoom;
        this._center = center;

        this._initContainer(container);
        this._initRenderer();
        this._updateEarthSize(this._getContainerDomSize());

        const opt = {
            earth: this,
            galaxy: options['galaxy'] != undefined ? options['galaxy'] : true,
            atmosphere: options['atmosphere'] != undefined ? options['atmosphere'] : true,
            aurora: options['aurora'] != undefined ? options['aurora'] : true
        };
        this._universe = new Universe(opt);

        if (easyLayer) {
            this.addLayer(createEasyLayer());
        }

        if (layers) {
            this.addLayer(layers);
        }

        this._load();
    }

    _initContainer(container) {
        if (isString(container)) {
            this._containerDOM = document.getElementById(container);
            if (!this._containerDOM) {
                throw new Error('Invalid container when creating earth: \'' + container + '\'');
            }
        } else {
            this._containerDOM = container;
        }

        if (this._containerDOM.childNodes && this._containerDOM.childNodes.length > 0) {
            if (this._containerDOM.childNodes[0].className === 'geov-wrapper') {
                throw new Error('Container is already loaded with another earth instance, use earth.remove() to clear it.');
            }
        }

        // Wipe DOM
        this._containerDOM.innerHTML = '';
        // Add info space
        this._containerDOM.appendChild(this._infoElem = document.createElement('div'));
        this._infoElem.className = 'geov-info-msg';
        // Setup tooltip
        this._containerDOM.appendChild(this._toolTipElem = document.createElement('div'));
        this._toolTipElem.className = 'geov-tooltip';
    }

    _initRenderer() {
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }

        // Setup webgl renderer
        this._renderer = new THREE.WebGLRenderer({
            antialias: true
        });
        this._renderer.shadowMap.enabled = true;
        this._renderer.setClearColor(0x000000);
        this._renderer.setPixelRatio(window.devicePixelRatio);
        this._renderer.domElement.className += 'geov-wrapper';
        this._containerDOM.appendChild(this._renderer.domElement);

        // Setup scenes
        this._scene = new THREE.Scene();

        // Setup camera
        this._camera = new THREE.PerspectiveCamera();
        this._camera.near = Unit * 0.1;
        this._camera.far = this._radius * 100;

        // Add lights
        this._camera.add(new THREE.PointLight(0xffffff, 1, this._radius));
        this._scene.add(new THREE.AmbientLight(0xcccccc));

        // Add camera interaction
        this._controls = new EarthControls(this._camera, this._renderer.domElement, {
            maxZoom: this._maxLevel,
            minZoom: this._minLevel,
            zoom: this._zoomLevel,
            radius: this._radius
        });

        // Add earth sphere
        this._earth = new THREE.Mesh();
        this._earth.geometry = new THREE.SphereGeometry(this._radius * 0.95, 100, 100);
        this._earth.material = new THREE.MeshBasicMaterial({
            color: 0x666666
        });
        this._earth.renderOrder = 20;
        this._scene.add(this._earth);

        let _this = this;
        // Kick-off renderer
        this._rafId = requestAnimationFrame(function animate() {
            // Frame cycle
            _this._layers.forEach(layer => {
                layer.update();
            });

            _this._controls.update();
            _this._universe.update(_this._controls);
            _this._renderer.render(_this._scene, _this._camera);

            requestAnimationFrame(animate);
        });
    }

    _updateEarthSize(eSize) {
        this.width = eSize['width'];
        this.height = eSize['height'];

        this._renderer.setSize(this.width, this.height);
        this._camera.aspect = this.width / this.height;
        this._camera.updateProjectionMatrix();
        this._controls.handleResize();

        return this;
    }

    _getContainerDomSize() {
        if (!this._containerDOM) {
            return null;
        }
        const containerDOM = this._containerDOM;
        let width, height;
        if (containerDOM.width && containerDOM.height) {
            width = containerDOM.width;
            height = containerDOM.height;
            if (Browser.retina) {
                width /= 2;
                height /= 2;
            }
        } else if (containerDOM.clientWidth && containerDOM.clientHeight) {
            width = parseInt(containerDOM.clientWidth, 0);
            height = parseInt(containerDOM.clientHeight, 0);
        } else {
            throw new Error('can not get size of container');
        }
        return new Size(width, height);
    }

    /**
     * Add a new layer on the top of the earth.
     * @param  {Layer|Layer[]} layer - one or more layers to add
     * @return {Earth} this
     */
    addLayer(layers) {
        if (!layers) {
            return this;
        }
        if (!Array.isArray(layers)) {
            return this.addLayer([layers]);
        }
        if (!this._layerCache) {
            this._layerCache = {};
        }

        for (let i = 0, len = layers.length; i < len; i++) {
            const layer = layers[i];
            const id = layer.getId();
            if (!id) {
                throw new Error('Invalid id for the layer: ' + id);
            }
            if (layer.getEarth() === this) {
                continue;
            }
            if (this._layerCache[id]) {
                throw new Error('Duplicate layer id in the earth: ' + id);
            }
            this._layerCache[id] = layer;
            layer._bindEarth(this, this._layers.length);
            this._layers.push(layer);
            if (this._loaded) {
                layer.load();
            }
        }

        return this;
    }

    /**
     * Remove a layer from the earth
     * @param  {String|String[]|Layer|Layer[]} layer - one or more layers or layer ids
     * @return {Earth} this
     * @fires Earth#removelayer
     */
    removeLayer(layers) {
        if (!layers) {
            return this;
        }
        if (!Array.isArray(layers)) {
            return this.removeLayer([layers]);
        }
        const removed = [];
        for (let i = 0, len = layers.length; i < len; i++) {
            let layer = layers[i];
            if (!(layer instanceof Layer)) {
                layer = this.getLayer(layer);
            }
            if (!layer) {
                continue;
            }
            const earth = layer.getEarth();
            if (!earth || earth !== this) {
                continue;
            }
            removed.push(layer);
            // todo
            // this._removeLayer(layer, this._layers);
            // if (this._loaded) {
            //     layer._doRemove();
            // }
            const id = layer.getId();
            if (this._layerCache) {
                delete this._layerCache[id];
            }
        }

        return this;
    }

    _load() {
        // this._resetMapStatus();
        // if (this.options['pitch']) {
        //     this.setPitch(this.options['pitch']);
        //     delete this.options['pitch'];
        // }
        // if (this.options['bearing']) {
        //     this.setBearing(this.options['bearing']);
        //     delete this.options['bearing'];
        // }
        this._layers.forEach(layer => layer.load());
        this._loaded = true;
    }
}

export default Earth;