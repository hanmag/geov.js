import * as THREE from 'three';

const loader = new THREE.TextureLoader();
const imageMesh = new THREE.Mesh();

export default {
    addToGlobe: function (STATE) {
        imageMesh.geometry = new THREE.SphereGeometry(STATE.radius * 1.032, 128, 128);
        imageMesh.material = new THREE.MeshPhongMaterial({
            side: THREE.DoubleSide,
            transparent: true
        });
        imageMesh.rotation.y = 3;

        loader.load('textures/fair_clouds_4k.png', function (t) {
            t.anisotropy = 16;
            t.wrapS = t.wrapT = THREE.RepeatWrapping;
            imageMesh.material.map = t;
            STATE.scene.add(imageMesh);
        });

        STATE.layers.push(this);
    },
    update: function (STATE) {
        imageMesh.material.opacity = (STATE.controls.zoom - 13) * 0.07;
        if (imageMesh.material.opacity < 0.1) imageMesh.material.opacity = 0;
        imageMesh.rotation.y += 0.00001;
        imageMesh.rotation.x -= 0.00003;
    }
};