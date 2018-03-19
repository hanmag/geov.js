import * as THREE from 'three';
import Layer from './Layer';

export function createEasyLayer() {
    const layer = new Layer('easy-layer');
    layer.load = () => {
        let image = new THREE.Mesh();
        image.geometry = new THREE.SphereGeometry(layer.earth._radius, 120, 120);
        image.material = new THREE.MeshPhongMaterial({
            bumpScale: 0.5,
            specular: new THREE.Color('grey'),
            shininess: 10
        });
        image.rotation.y = 3;

        const loader = new THREE.TextureLoader();
        loader.load('textures/2_no_clouds_4k.jpg', function (t) {
            t.anisotropy = 16;
            t.wrapS = t.wrapT = THREE.RepeatWrapping;
            image.material.map = t;
            loader.load('textures/elev_bump_4k.jpg', function (t) {
                t.anisotropy = 16;
                t.wrapS = t.wrapT = THREE.RepeatWrapping;
                image.material.bumpMap = t;
                layer.earth._scene.add(image);
            });
        });
    };
    return layer;
}