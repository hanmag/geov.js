import * as THREE from 'three';

const loader = new THREE.TextureLoader();
const imageMesh = new THREE.Mesh();
let visible = true;

export default {
    addToGlobe: function (STATE) {
        loader.load('textures/fair_clouds_4k.png', function (t) {
            imageMesh.geometry = new THREE.SphereGeometry(STATE.radius * 1.032, 128, 128);
            imageMesh.rotation.y = 3;
            imageMesh.material = new THREE.MeshPhongMaterial({
                transparent: true
            });
            t.anisotropy = 16;
            t.wrapS = t.wrapT = THREE.RepeatWrapping;
            imageMesh.material.map = t;
            imageMesh.material.needsUpdate = true;
        });

        STATE.layers.push(this);
    },
    update: function (STATE) {
        if (!imageMesh.geometry) return;

        imageMesh.material.opacity = (STATE.controls.zoom - 13) * 0.07;
        if (imageMesh.material.opacity < 0.1) {
            STATE.scene.remove(imageMesh);
            visible = false;
        } else {
            STATE.scene.add(imageMesh);
            visible = true;
        }
        imageMesh.rotation.y += 0.00001;
        imageMesh.rotation.x -= 0.00003;
    }
};