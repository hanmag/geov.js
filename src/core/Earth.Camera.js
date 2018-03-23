import Earth from './Earth';
import MathUtils from '../util/MathUtils';

Earth.prototype.setBearing = function (bearing) {
    console.log(bearing);
}

Earth.prototype.getBearing = function () {
    return Math.round(this._controls.bearing * 1e2) / 1e2;
}

Earth.prototype.setPitch = function (bearing) {}

Earth.prototype.getPitch = function () {
    return Math.round(this._controls.pitch * 1e2) / 1e2;
}

Earth.prototype.setZoom = function (bearing) {}

Earth.prototype.getZoom = function () {
    const delta = Math.round((this._controls.maxZoom - this._controls.zoom) * 1e1) / 1e1;
    return delta < 2 ? 0 : delta - 1;
}

Earth.prototype.setRadian = function (bearing) {}

Earth.prototype.getRadian = function () {
    const coord = this._controls.coord.clone();
    coord.x += MathUtils.HALFPI;
    return coord;
}