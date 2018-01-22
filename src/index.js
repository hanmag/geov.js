import './assets/css/geov.css';

import * as THREE from 'three';
import MapControls from 'map-camera-controls';

import atomLayer from './layers/atom-layer';
import cloudLayer from './layers/cloud-layer';
import imageLayer from './layers/image-layer';
import starLayer from './layers/star-layer';
import tileLayer from './layers/tileLayer/tile-layer';

const GEOV = {
    resizeCanvas: resizeCanvas
};

// Holds component state
const STATE = Object.assign({}, {}, {
    radius: 6371,
    zoom: 18.7,
    layers: [],
    initialized: false
});

function comp(nodeElement, options = {}) {
    initStatic(nodeElement, options);
    resizeCanvas();

    setupGlobe();

    return GEOV;
}

function initStatic(nodeElement, options) {
    STATE.domNode = nodeElement;
    // Wipe DOM
    nodeElement.innerHTML = '';

    // Add info space
    nodeElement.appendChild(STATE.infoElem = document.createElement('div'));
    STATE.infoElem.className = 'geov-info-msg';

    // Setup tooltip
    nodeElement.appendChild(STATE.toolTipElem = document.createElement('div'));
    STATE.toolTipElem.className = 'geov-tooltip';

    // Capture mouse coords on move
    const raycaster = new THREE.Raycaster();
    const mousePos = new THREE.Vector2();
    mousePos.x = -2; // Initialize off canvas
    mousePos.y = -2;
    nodeElement.addEventListener("mousemove", ev => {
        // update the mouse pos
        const offset = getOffset(nodeElement),
            relPos = {
                x: ev.pageX - offset.left,
                y: ev.pageY - offset.top
            };
        mousePos.x = (relPos.x / STATE.width) * 2 - 1;
        mousePos.y = -(relPos.y / STATE.height) * 2 + 1;

        // Move tooltip
        STATE.toolTipElem.style.top = (relPos.y - 40) + 'px';
        STATE.toolTipElem.style.left = (relPos.x - 50) + 'px';

        function getOffset(el) {
            const rect = el.getBoundingClientRect(),
                scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
                scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            return {
                top: rect.top + scrollTop,
                left: rect.left + scrollLeft
            };
        }
    }, false);

    // Setup webgl renderer
    STATE.renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    STATE.renderer.shadowMap.enabled = true;
    STATE.renderer.setClearColor(0x000000);
    STATE.renderer.setPixelRatio(window.devicePixelRatio);

    nodeElement.appendChild(STATE.renderer.domElement);
    // Handle click events on nodes
    STATE.renderer.domElement.addEventListener("click", ev => {
        if (options.onClick) {
            raycaster.setFromCamera(mousePos, STATE.camera);
            const intersects = raycaster.intersectObjects(STATE.webglScene.children)
                .filter(o => o.object.vdata); // Check only objects with data (nodes)
            if (intersects.length) {
                options.onClick(intersects[0].object.vdata);
            }
        }
    }, false);

    // Setup scenes
    STATE.scene = new THREE.Scene();

    // Setup camera
    STATE.camera = new THREE.PerspectiveCamera();
    STATE.camera.near = 0.1;
    STATE.camera.far = 1000000000;

    // Add lights
    STATE.camera.add(new THREE.PointLight(0xffffff, 1, STATE.radius));
    STATE.scene.add(new THREE.AmbientLight(0xcccccc));

    // Add camera interaction
    STATE.controls = new MapControls(STATE.camera, STATE.renderer.domElement, STATE);
    STATE.controls.maxZoom = 19;

    // Kick-off renderer
    (function animate() {
        // Update tooltip
        raycaster.setFromCamera(mousePos, STATE.camera);
        const intersects = raycaster.intersectObjects(STATE.scene.children)
            .filter(o => o.object.name); // Check only objects with labels
        STATE.toolTipElem.textContent = intersects.length ? intersects[0].object.name : '';

        // Frame cycle
        STATE.layers.forEach(layer => {
            if (layer.update)
                layer.update(STATE);
        });

        STATE.controls.update();
        STATE.renderer.render(STATE.scene, STATE.camera);

        requestAnimationFrame(animate);
    })();

    STATE.initialized = true;
};

function setupGlobe() {
    tileLayer.addToGlobe(STATE);
    // imageLayer.addToGlobe(STATE);
    cloudLayer.addToGlobe(STATE);
    atomLayer.addToGlobe(STATE);
    starLayer.addToGlobe(STATE);
}

function resizeCanvas() {
    if (STATE.domNode.offsetWidth && STATE.domNode.offsetHeight) {
        STATE.width = STATE.domNode.offsetWidth;
        STATE.height = STATE.domNode.offsetHeight;
    }
    if (STATE.width && STATE.height) {
        STATE.renderer.setSize(STATE.width, STATE.height);
        STATE.camera.aspect = STATE.width / STATE.height;
        STATE.camera.updateProjectionMatrix();
        STATE.controls.handleResize();
    }
}

export default comp;