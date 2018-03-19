import * as THREE from 'three';
import auroraVertexShaderSource from '../shaders/aurora.vertex.glsl';
import auroraFragmentShaderSource from '../shaders/aurora.fragment.glsl';

class Universe {
    constructor(opt) {
        if (!opt.earth) {
            throw new Error('Can not build a Universe without Earth.');
        }

        this.earth = opt.earth;
        this._comps = new THREE.Group();
        let _this = this;

        if (opt.galaxyURL) {
            _this.galaxy = new THREE.Mesh();
            _this.galaxy.geometry = new THREE.SphereGeometry(_this.earth._radius * 10, 20, 20);
            _this.galaxy.material = new THREE.MeshBasicMaterial({
                side: THREE.BackSide
            });

            new THREE.TextureLoader().load(opt.galaxyURL, function (t) {
                t.anisotropy = 16;
                t.wrapS = t.wrapT = THREE.RepeatWrapping;
                _this.galaxy.material.map = t;
                _this._comps.add(_this.galaxy);
            });
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
                uniforms: {},
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

    update(controls) {
        if (this.atmosphere) {
            const _opacity = (controls.zoom - 13) * 0.09;
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