import * as THREE from 'three';

import atomVertexShaderSource from '../shaders/atom.vertex.glsl';
import atomFragmentShaderSource from '../shaders/atom.fragment.glsl';

const customMesh = new THREE.Mesh();

export default {
    addToGlobe: function (STATE) {
        customMesh.geometry = new THREE.SphereGeometry(STATE.radius * 1.028, 128, 128);
        customMesh.material = new THREE.ShaderMaterial({
            uniforms: {},
            vertexShader: atomVertexShaderSource,
            fragmentShader: atomFragmentShaderSource,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true
        });

        setTimeout(() => {
            STATE.scene.add(customMesh);
            STATE.layers.push(this);
        }, 500);
    }
};