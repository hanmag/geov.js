// Version 0.0.0 geov - https://github.com/hanmag/geov.js#readme
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.geov = global.geov || {})));
}(this, (function (exports) { 'use strict';

function __$styleInject(css, returnValue) {
  if (typeof document === 'undefined') {
    return returnValue;
  }
  css = css || '';
  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.type = 'text/css';
  head.appendChild(style);
  
  if (style.styleSheet){
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
  return returnValue;
}

var Layer = class {

    constructor(id) {
        this.setId(id);
    }

    /**
     * Get the layer id
     * @returns {String} id
     */
    getId() {
        return this._id;
    }

    /**
     * Set a new id to the layer
     * @param {String} id - new layer id
     * @return {Layer} this
     */
    setId(id) {
        if (id) {
            id = id + '';
        }
        this._id = id;
        return this;
    }

    /**
     * Adds itself to earth.
     * @param {Earth} earth - earth added to
     * @return {Layer} this
     */
    addTo(earth) {
        earth.addLayer(this);
        return this;
    }

    /**
     * Remove itself from the earth added to.
     * @returns {Layer} this
     */
    remove() {
        if (this.earth) {
            this.earth.removeLayer(this);
        }
        return this;
    }

    /**
     * Set a z-index to the layer
     * @param {Number} zIndex - layer's z-index
     * @return {Layer} this
     */
    setZIndex(zIndex) {
        this._zIndex = zIndex;
        if (this.earth) {
            // this.earth._sortLayersByZIndex();
        }
        return this;
    }

    /**
     * Get the layer's z-index
     * @return {Number}
     */
    getZIndex() {
        return this._zIndex;
    }
};

exports.Layer = Layer;

Object.defineProperty(exports, '__esModule', { value: true });

typeof console !== 'undefined' && console.log('geov 0.0.0');

})));
