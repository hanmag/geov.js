import MathUtils from './MathUtils';
import * as THREE from 'three';

const Unit = 100;
const Radius = 6371;
export default {
    Unit: Unit,
    EarthRadius: Radius * Unit,
    // 经纬度坐标 转成 球面坐标
    geoToSphere: function (earthRadius, coordinates) {
        let x = coordinates[0] / 180 * MathUtils.PI + MathUtils.HALFPI;
        if (x > MathUtils.PI) x = -MathUtils.PI2 + x;
        const y = (90 - coordinates[1]) / 180 * MathUtils.PI;
        const spherical = new THREE.Spherical(earthRadius, y, x);
        spherical.makeSafe();
        return new THREE.Vector3().setFromSpherical(spherical);
    }
};