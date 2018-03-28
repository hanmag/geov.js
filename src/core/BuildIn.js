import * as THREE from 'three';
import Layer from './Layer';
import GeoUtils from '../util/GeoUtils';

export function createEasyLayer(opt) {
    const layer = new Layer('easy-layer');
    layer._load = () => {
        let image = new THREE.Mesh();
        image.geometry = new THREE.SphereGeometry(GeoUtils.EarthRadius, 120, 120);
        image.material = new THREE.MeshPhongMaterial({
            bumpScale: 0.5,
            specular: new THREE.Color('grey'),
            shininess: 10
        });
        image.rotation.y = 3;

        const loader = new THREE.TextureLoader();
        loader.load(opt.baseURL, function (t) {
            t.anisotropy = 16;
            t.wrapS = t.wrapT = THREE.RepeatWrapping;
            image.material.map = t;
            loader.load(opt.bumpURL, function (t) {
                t.anisotropy = 16;
                t.wrapS = t.wrapT = THREE.RepeatWrapping;
                image.material.bumpMap = t;
                layer.earth._scene.add(image);
            });
        });
    };
    return layer;
}