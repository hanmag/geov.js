import * as THREE from 'three';

const loader = new THREE.TextureLoader();

export default {
    addToGlobe: function (STATE) {
        const imageMesh = new THREE.Mesh(
            new THREE.SphereGeometry(STATE.radius, 128, 128),
            new THREE.MeshPhongMaterial({
                bumpScale: 0.5,
                specular: new THREE.Color('grey'),
                shininess: 10
            })
        );
        imageMesh.rotation.y = 3;
        imageMesh.receiveShadow = true;

        loader.load('textures/2_no_clouds_4k.jpg', function (t) {
            t.anisotropy = 16;
            t.wrapS = t.wrapT = THREE.RepeatWrapping;
            imageMesh.material.map = t;
            loader.load('textures/elev_bump_4k.jpg', function (t) {
                t.anisotropy = 16;
                t.wrapS = t.wrapT = THREE.RepeatWrapping;
                imageMesh.material.bumpMap = t;
                STATE.scene.add(imageMesh);
            });
        });
        STATE.layers.push(this);
    }
};