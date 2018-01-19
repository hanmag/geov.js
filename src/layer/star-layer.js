import * as THREE from 'three';

const loader = new THREE.TextureLoader();
const imageMesh = new THREE.Mesh();

export default {
    addToGlobe: function (STATE) {
        imageMesh.geometry = new THREE.SphereGeometry(STATE.radius * 3, 50, 50);
        imageMesh.material = new THREE.MeshBasicMaterial({
            side: THREE.BackSide
        });

        loader.load('textures/galaxy_starfield.png', function (t) {
            t.anisotropy = 16;
            t.wrapS = t.wrapT = THREE.RepeatWrapping;
            imageMesh.material.map = t;
            STATE.scene.add(imageMesh);
        });

        STATE.layers.push(this);
    }
};