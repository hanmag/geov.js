import * as THREE from 'three';
import auroraVertexShaderSource from '../shaders/aurora.vertex.glsl';
import auroraFragmentShaderSource from '../shaders/aurora.fragment.glsl';
import starsVertexShaderSource from '../shaders/stars.vertex.glsl';
import starsFragmentShaderSource from '../shaders/stars.fragment.glsl';
import sparkImage from '../textures/spark1.png';

const sparkTexture = new THREE.Texture(sparkImage);
sparkTexture.needsUpdate = true;
const starsMaterial = new THREE.ShaderMaterial({
    uniforms: {
        texture: {
            value: sparkTexture
        }
    },
    vertexShader: starsVertexShaderSource,
    fragmentShader: starsFragmentShaderSource,
    blending: THREE.AdditiveBlending,
    depthTest: true,
    transparent: true,
    vertexColors: true
});

class Universe {
    constructor(opt) {
        if (!opt.earth) {
            throw new Error('Can not build a Universe without Earth.');
        }

        this.earth = opt.earth;
        this._comps = new THREE.Group();
        this._radius = this.earth._radius;
        let _this = this;

        if (opt.galaxy) {
            // stars
            const starsGeometry = new THREE.BufferGeometry();
            const positions = [];
            const colors = [];
            const sizes = [];
            const particles = 50000;
            for (var i = 0; i < particles; i++) {
                positions.push((Math.random() * 2 - 1) * this._radius);
                positions.push((Math.random() * 2 - 1) * this._radius);
                positions.push((Math.random() * 2 - 1) * this._radius);
                const random = Math.random() * 0.6;
                colors.push(random, random, random);
                sizes.push(10);
            }
            starsGeometry.addAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            starsGeometry.addAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
            starsGeometry.addAttribute('size', new THREE.Float32BufferAttribute(sizes, 1).setDynamic(true));

            const stars = new THREE.Points(starsGeometry, starsMaterial);
            stars.rotation.x = Math.random() * 6;
            stars.rotation.y = Math.random() * 6;
            stars.rotation.z = Math.random() * 6;
            stars.scale.setScalar(200);
            stars.matrixAutoUpdate = false;
            stars.updateMatrix();
            _this._comps.add(stars);
        }

        if (opt.atmosphereURL) {
            _this.atmosphere = new THREE.Mesh();
            _this.atmosphere.geometry = new THREE.SphereGeometry(_this.earth._radius * 1.032, 50, 50);
            _this.atmosphere.rotation.y = 3;
            _this.atmosphere.material = new THREE.MeshPhongMaterial({
                transparent: true
            });

            new THREE.TextureLoader().load(opt.atmosphereURL, function (t) {
                t.anisotropy = 16;
                t.wrapS = t.wrapT = THREE.RepeatWrapping;
                _this.atmosphere.material.map = t;
                _this.atmosphere.material.needsUpdate = true;
                _this.atmosphere.renderOrder = 10;
                _this._comps.add(_this.atmosphere);
            });
        }

        if (opt.aurora) {
            _this.aurora = new THREE.Mesh();
            _this.aurora.geometry = new THREE.SphereGeometry(_this.earth._radius * 1.036, 130, 130);
            _this.aurora.material = new THREE.ShaderMaterial({
                vertexShader: auroraVertexShaderSource,
                fragmentShader: auroraFragmentShaderSource,
                side: THREE.BackSide,
                blending: THREE.AdditiveBlending,
                transparent: true
            });
            _this._comps.add(_this.aurora);
        }

        this.earth._scene.add(this._comps);
    }

    update() {
        if (this.atmosphere) {
            const _opacity = (6 - this.earth.getZoom()) * 0.08;
            if (_opacity < 0.1 && this.atmosphere.material.opacity >= 0.1) {
                this._comps.remove(this.atmosphere);
            } else if (_opacity >= 0.1 && this.atmosphere.material.opacity < 0.1) {
                this._comps.add(this.atmosphere);
            }

            this.atmosphere.material.opacity = _opacity;
            this.atmosphere.rotation.y += 0.00002;
            this.atmosphere.rotation.x -= 0.00004;
        }
    }
}

export default Universe;