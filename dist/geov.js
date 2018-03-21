// Version 0.0.3 geov.js - https://github.com/hanmag/geov.js#readme
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('three')) :
	typeof define === 'function' && define.amd ? define(['exports', 'three'], factory) :
	(factory((global.geov = global.geov || {}),global.THREE));
}(this, (function (exports,THREE) { 'use strict';

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

var EarthControls = EarthControls = function (object, domElement, options) {

    var PI = 3.141592653589793;
    var HALFPI = PI / 2;
    var PI2 = PI * 2;

    var _this = this;
    var STATE = {
        NONE: -1,
        ROTATE: 0,
        ZOOM: 1,
        PAN: 2
    };

    this.object = object;
    this.domElement = (domElement !== undefined) ? domElement : document;

    // API

    this.enabled = true;

    this.screen = {
        left: 0,
        top: 0,
        width: 0,
        height: 0
    };

    this.rotateSpeed = 1.0;
    this.zoomSpeed = 1.0;
    this.panSpeed = 1.0;

    this.noRotate = false;
    this.noZoom = false;
    this.noPan = false;

    this.dynamicDampingFactor = 0.2;

    options = (function (opt) {
        return opt || {};
    })(options);
    this.earthRadius = (options.radius !== undefined) ? options.radius : 6371;
    this.coord = (options.coord !== undefined) ? new THREE.Vector2(options.coord[0], options.coord[1]) : new THREE.Vector2(0, HALFPI);
    this.zoom = (options.zoom !== undefined) ? options.zoom : 10;
    this.pitch = (options.pitch !== undefined) ? options.pitch : 0;
    this.bearing = (options.bearing !== undefined) ? options.bearing : 0;

    this.coordEnd = this.coord.clone();
    this.zoomEnd = this.zoom;
    this.pitchEnd = this.pitch;
    this.bearingEnd = this.bearing;

    this.minZoom = (options.minZoom !== undefined) ? options.minZoom : 1;
    this.maxZoom = (options.maxZoom !== undefined) ? options.maxZoom : 18;
    this.globeZoom = 10;
    this.maxPitch = 80;

    var EPS = 0.000001;
    var PITCHEPS = 0.000001;

    var _state = STATE.NONE,
        _dragPrev = new THREE.Vector2(),
        _dragCurr = new THREE.Vector2();


    // events

    var changeEvent = {
        type: 'change'
    };

    // methods

    var dispatchEvent = function (type) {
        if (type === 'end' && !changeEvent.type)
            return;

        changeEvent.type = type;
        _this.dispatchEvent(changeEvent);

        if (type === 'end')
            changeEvent.type = null;
    };

    this.jumpTo = function (cameraOpts) {
        validateOptions(cameraOpts);
        this.coordEnd = (cameraOpts.coord !== undefined) ? new THREE.Vector2(cameraOpts.coord[0], cameraOpts.coord[1]) : _this.coordEnd;
        this.zoomEnd = (cameraOpts.zoom !== undefined) ? cameraOpts.zoom : _this.zoomEnd;
        this.pitchEnd = (cameraOpts.pitch !== undefined) ? cameraOpts.pitch : _this.pitchEnd;
        this.bearingEnd = (cameraOpts.bearing !== undefined) ? cameraOpts.bearing : _this.bearingEnd;
    };

    this.handleResize = function () {

        if (this.domElement === document) {

            this.screen.left = 0;
            this.screen.top = 0;
            this.screen.width = window.innerWidth;
            this.screen.height = window.innerHeight;

        } else {

            var box = this.domElement.getBoundingClientRect();
            // adjustments come from similar code in the jquery offset() function
            var d = this.domElement.ownerDocument.documentElement;
            this.screen.left = box.left + window.pageXOffset - d.clientLeft;
            this.screen.top = box.top + window.pageYOffset - d.clientTop;
            this.screen.width = box.width;
            this.screen.height = box.height;

        }

    };

    var getMouseOnScreen = (function () {

        var vector = new THREE.Vector2();

        return function getMouseOnScreen(pageX, pageY) {

            vector.set(
                (pageX - _this.screen.left) / _this.screen.width,
                (pageY - _this.screen.top) / _this.screen.height
            );

            return vector;

        };

    }());

    var getRotateOffset = function (delta) {
        var speed = Math.pow(2, _this.zoom - 1) * _this.rotateSpeed * 0.0001;
        return delta.clone().rotateAround(new THREE.Vector2(0, 0), -_this.bearing).multiplyScalar(speed);
    };

    var getEyeVector = function (target) {
        var zoomDistance = Math.pow(1.71, _this.zoom - 1) * _this.earthRadius * 0.0001;
        var origin = new THREE.Vector3().setFromSpherical(target);
        target.phi -= EPS;
        var normal = new THREE.Vector3().setFromSpherical(target).sub(origin).normalize();
        normal.applyAxisAngle(origin.clone().normalize(), _this.bearing + PI);
        if (_this.pitch < PITCHEPS)
            _this.pitch = PITCHEPS;
        var eye0 = origin.normalize().multiplyScalar(Math.tan((90 - _this.pitch) / 180 * PI));
        return eye0.clone().add(normal).normalize().multiplyScalar(zoomDistance);
    };
    // listeners

    var mousedown = function (event) {

        if (_this.enabled === false) return;

        event.preventDefault();
        event.stopPropagation();

        if (_state === STATE.NONE) {

            _state = event.button;

        }

        if ((_state === STATE.ROTATE && !_this.noRotate) ||
            (_state === STATE.ZOOM && !_this.noZoom) ||
            (_state === STATE.PAN && !_this.noPan)) {

            _dragCurr.copy(getMouseOnScreen(event.pageX, event.pageY));
            _dragPrev.copy(_dragCurr);

        }

        document.addEventListener('mousemove', mousemove, false);
        document.addEventListener('mouseup', mouseup, false);

    };

    var mousemove = function (event) {

        if (_this.enabled === false) return;

        event.preventDefault();
        event.stopPropagation();

        _dragCurr.copy(getMouseOnScreen(event.pageX, event.pageY));

        var _dragDelta = _dragCurr.clone().sub(_dragPrev);

        _dragPrev.copy(_dragCurr);

        if (_state === STATE.ROTATE && !_this.noRotate) {

            if (Math.abs(_dragDelta.y) < 0.01 && Math.abs(_dragDelta.x) > 0.02)
                _dragDelta.y = 0;
            if (Math.abs(_dragDelta.x) < 0.01 && Math.abs(_dragDelta.y) > 0.02)
                _dragDelta.x = 0;
            var offset = getRotateOffset(_dragDelta);
            _this.coordEnd.x = _this.coord.x - offset.x;
            _this.coordEnd.y = THREE.Math.clamp(_this.coord.y - offset.y, 0, PI);

        } else if (_state === STATE.ZOOM && !_this.noZoom) {

            _this.zoomEnd = THREE.Math.clamp(_this.zoom + (_dragDelta.y * _this.zoomSpeed * 32), _this.minZoom, _this.maxZoom);

            if (_this.zoomEnd > _this.globeZoom) {
                _this.bearingEnd = 0;
            }

        } else if (_state === STATE.PAN && !_this.noPan) {

            if (_this.zoom < _this.globeZoom) {
                if ((Math.abs(_dragDelta.y) > 0.05 && Math.abs(_dragDelta.x) > 0.05) ||
                    (Math.abs(_dragDelta.y) < Math.abs(_dragDelta.x))) {
                    if (_dragCurr.y < 0.5)
                        _this.bearingEnd = _this.bearing + (_dragDelta.x * _this.panSpeed * 24);
                    else
                        _this.bearingEnd = _this.bearing - (_dragDelta.x * _this.panSpeed * 24);
                }
            } else {
                _this.bearingEnd = 0;
            }

            if ((Math.abs(_dragDelta.y) > 0.05 && Math.abs(_dragDelta.x) > 0.05) ||
                (Math.abs(_dragDelta.x) < Math.abs(_dragDelta.y)))
                _this.pitchEnd = THREE.Math.clamp(_this.pitch - (_dragDelta.y * _this.panSpeed * 320), 0, _this.maxPitch);

        }

    };

    var mouseup = function (event) {

        if (_this.enabled === false) return;

        event.preventDefault();
        event.stopPropagation();

        _state = STATE.NONE;

        document.removeEventListener('mousemove', mousemove);
        document.removeEventListener('mouseup', mouseup);

    };

    var mousewheel = function (event) {

        if (_this.enabled === false) return;

        event.preventDefault();
        event.stopPropagation();

        switch (event.deltaMode) {

            case 2:
                // Zoom in pages
                _this.zoomEnd = THREE.Math.clamp(_this.zoom + (event.deltaY * 0.025 * _this.zoomSpeed * 32), _this.minZoom, _this.maxZoom);
                break;

            case 1:
                // Zoom in lines
                _this.zoomEnd = THREE.Math.clamp(_this.zoom + (event.deltaY * 0.01 * _this.zoomSpeed * 32), _this.minZoom, _this.maxZoom);
                break;

            default:
                // undefined, 0, assume pixels
                _this.zoomEnd = THREE.Math.clamp(_this.zoom + (event.deltaY * 0.00025 * _this.zoomSpeed * 32), _this.minZoom, _this.maxZoom);
                break;

        }

        if (_this.zoomEnd > _this.globeZoom) {
            _this.bearingEnd = 0;
        }

    };

    var contextmenu = function (event) {

        if (_this.enabled === false) return;

        event.preventDefault();

    };

    this.dispose = function () {

        this.domElement.removeEventListener('contextmenu', contextmenu, false);
        this.domElement.removeEventListener('mousedown', mousedown, false);
        this.domElement.removeEventListener('wheel', mousewheel, false);

        document.removeEventListener('mousemove', mousemove, false);
        document.removeEventListener('mouseup', mouseup, false);
    };

    this.domElement.addEventListener('contextmenu', contextmenu, false);
    this.domElement.addEventListener('mousedown', mousedown, false);
    this.domElement.addEventListener('wheel', mousewheel, false);

    this.handleResize();

    this.update = function () {

        var dampingFactor = _this.dynamicDampingFactor;
        var deltaCoord = _this.coordEnd.clone().sub(_this.coord);
        var deltaZoom = _this.zoomEnd - _this.zoom;
        var deltaBearing = _this.bearingEnd - _this.bearing;
        var deltaPitch = _this.pitchEnd - _this.pitch;
        if (
            Math.abs(deltaCoord.x) > EPS ||
            Math.abs(deltaCoord.y) > EPS ||
            Math.abs(deltaZoom) > EPS ||
            Math.abs(deltaBearing) > EPS ||
            Math.abs(deltaPitch) > EPS
        ) {
            _this.coord.x += deltaCoord.x * dampingFactor;
            _this.coord.y += deltaCoord.y * dampingFactor;
            _this.zoom += deltaZoom * dampingFactor;
            _this.bearing += deltaBearing * dampingFactor;
            _this.pitch += deltaPitch * dampingFactor;

            _this.needsUpdate = true;
        } else {
            while (_this.coordEnd.x < 0) _this.coordEnd.x += PI2;
            _this.coordEnd.x = _this.coordEnd.x % PI2;
            _this.coord.copy(_this.coordEnd);
            _this.zoom = _this.zoomEnd;
            while (_this.bearingEnd < 0) _this.bearingEnd += PI2;
            _this.bearing = _this.bearingEnd = _this.bearingEnd % PI2;
            _this.pitch = _this.pitchEnd;
        }

        if (!_this.needsUpdate) {
            dispatchEvent('end');
            return;
        }

        var target = new THREE.Spherical(_this.earthRadius, _this.coord.y, _this.coord.x);
        target.makeSafe();
        var targetPos = new THREE.Vector3().setFromSpherical(target);

        var eye = getEyeVector(target);
        _this.object.position.copy(targetPos.clone().add(eye));

        if (_this.pitch < PITCHEPS)
            _this.pitch = PITCHEPS;
        var targetUp = targetPos.clone().normalize().multiplyScalar(eye.length() / Math.cos(_this.pitch / 180 * PI));
        _this.object.up = targetUp.sub(eye).normalize();

        _this.object.lookAt(targetPos);

        dispatchEvent('change');
        _this.needsUpdate = false;
    };

    // force an update at start
    this.needsUpdate = true;
    this.update();
};

EarthControls.prototype = Object.create(THREE.EventDispatcher.prototype);

var EarthControls$1 = EarthControls;

/**
 * Check whether the object is a string
 * @param {Object} obj
 * @return {Boolean}
 * @memberOf Util
 */
function isString(obj) {
    if (!obj) {
        return false;
    }
    return typeof obj === 'string' || obj.constructor !== null && obj.constructor === String;
}

/**
 * Whether val is a number and not a NaN.
 * @param  {Object}  val - val
 * @return {Boolean}
 * @memberOf Util
 */
function isNumber(val) {
    return typeof val === 'number' && !isNaN(val);
}

/**
 * Whether a number is an integer
 * @param  {Number}  n
 * @return {Boolean}
 * @memberOf Util
 */

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

/**
 * Represents a size.
 * @category basic types
 */

var Size = function () {

    /**
     * @param {Number} width - width value
     * @param {Number} height - height value
     */
    function Size(width, height) {
        classCallCheck(this, Size);

        if (isNumber(width) && isNumber(height)) {
            /**
             * @property {Number} width - width
             */
            this.width = width;
            /**
             * @property {Number} height - height
             */
            this.height = height;
        } else if (isNumber(width['width'])) {
            this.width = width.width;
            this.height = width.height;
        } else if (Array.isArray(width)) {
            this.width = width[0];
            this.height = width[1];
        }
    }

    /**
     * Returns a copy of the size
     * @return {Size} copy
     */


    createClass(Size, [{
        key: 'copy',
        value: function copy() {
            return new Size(this['width'], this['height']);
        }

        /**
         * Returns the result of addition of another size.
         * @param {Size} size - size to add
         * @return {Size} result
         */

    }, {
        key: 'add',
        value: function add(x, y) {
            var w = void 0,
                h = void 0;
            if (x instanceof Size) {
                w = this.width + x.width;
                h = this.height + x.height;
            } else {
                w = this.width + x;
                h = this.height + y;
            }
            return new Size(w, h);
        }

        /**
         * Compare with another size to see whether they are equal.
         * @param {Size} size - size to compare
         * @return {Boolean}
         */

    }, {
        key: 'equals',
        value: function equals(size) {
            return this['width'] === size['width'] && this['height'] === size['height'];
        }

        /**
         * Returns the result of multiplication of the current size by the given number.
         * @param {Number} ratio - ratio to multi
         * @return {Size} result
         */

    }, {
        key: 'multi',
        value: function multi(ratio) {
            return new Size(this['width'] * ratio, this['height'] * ratio);
        }
    }, {
        key: '_multi',
        value: function _multi(ratio) {
            this['width'] *= ratio;
            this['height'] *= ratio;
            return this;
        }
    }, {
        key: '_round',
        value: function _round() {
            this['width'] = Math.round(this['width']);
            this['height'] = Math.round(this['height']);
            return this;
        }

        /**
         * Converts the size object to an array [width, height]
         * @return {Number[]}
         */

    }, {
        key: 'toArray',
        value: function toArray$$1() {
            return [this['width'], this['height']];
        }

        /**
         * Convert the size object to a json object {width : .., height : ..}
         * @return {Object} json
         */

    }, {
        key: 'toJSON',
        value: function toJSON() {
            return {
                'width': this['width'],
                'height': this['height']
            };
        }
    }]);
    return Size;
}();

var Coordinate = function () {
    /**
     * @param {Number} x - x value
     * @param {Number} y - y value
     */
    function Coordinate(x, y) {
        classCallCheck(this, Coordinate);

        if (x && y) {
            /**
             * @property {Number} x - value on X-Axis or longitude in degrees
             */
            this.x = +x;
            /**
             * @property {Number} y - value on Y-Axis or Latitude in degrees
             */
            this.y = +y;
        } else if (Array.isArray(x)) {
            //数组
            this.x = +x[0];
            this.y = +x[1];
        } else if (x['x'] && x['y']) {
            //对象
            this.x = +x['x'];
            this.y = +x['y'];
        }
        if (this._isNaN()) {
            throw new Error('coordinate is NaN');
        }
    }

    /**
     * Returns a copy of the coordinate
     * @return {Coordinate} copy
     */


    createClass(Coordinate, [{
        key: 'copy',
        value: function copy() {
            return new Coordinate(this.x, this.y);
        }

        /**
         * Compare with another coordinate to see whether they are equal.
         * @param {Coordinate} c - coordinate to compare
         * @return {Boolean}
         */

    }, {
        key: 'equals',
        value: function equals(c) {
            if (!(c instanceof Coordinate)) {
                return false;
            }
            return this.x === c.x && this.y === c.y;
        }

        /**
         * Whether the coordinate is NaN
         * @return {Boolean}
         * @private
         */

    }, {
        key: '_isNaN',
        value: function _isNaN() {
            return isNaN(this.x) || isNaN(this.y);
        }

        /**
         * Convert the coordinate to a number array [x, y]
         * @return {Number[]} number array
         */

    }, {
        key: 'toArray',
        value: function toArray$$1() {
            return [this.x, this.y];
        }

        /**
         * Formats coordinate number using fixed-point notation.
         * @param  {Number} n The number of digits to appear after the decimal point
         * @return {Coordinate}   fixed coordinate
         */

    }, {
        key: 'toFixed',
        value: function toFixed(n) {
            return new Coordinate(this.x.toFixed(n), this.y.toFixed(n));
        }

        /**
         * Convert the coordinate to a json object {x : .., y : ..}
         * @return {Object} json
         */

    }, {
        key: 'toJSON',
        value: function toJSON() {
            return {
                x: this.x,
                y: this.y
            };
        }
    }]);
    return Coordinate;
}();

var Browser = {};

var ua = navigator.userAgent.toLowerCase();
var doc = document.documentElement;
var ie = 'ActiveXObject' in window;
var webkit = ua.indexOf('webkit') !== -1;
var phantomjs = ua.indexOf('phantom') !== -1;
var android23 = ua.search('android [23]') !== -1;
var chrome = ua.indexOf('chrome') !== -1;
var gecko = ua.indexOf('gecko') !== -1 && !webkit && !window.opera && !ie;
var mobile = typeof orientation !== 'undefined' || ua.indexOf('mobile') !== -1;
var msPointer = !window.PointerEvent && window.MSPointerEvent;
var pointer = window.PointerEvent && navigator.pointerEnabled || msPointer;
var ie3d = ie && 'transition' in doc.style;
var webkit3d = 'WebKitCSSMatrix' in window && 'm11' in new window.WebKitCSSMatrix() && !android23;
var gecko3d = 'MozPerspective' in doc.style;
var opera12 = 'OTransition' in doc.style;
var any3d = (ie3d || webkit3d || gecko3d) && !opera12 && !phantomjs;

var chromeVersion = 0;
if (chrome) {
    chromeVersion = ua.match(/chrome\/([\d.]+)/)[1];
}

var touch = !phantomjs && (pointer || 'ontouchstart' in window || window.DocumentTouch && document instanceof window.DocumentTouch);

var webgl = void 0;
try {
    var canvas = document.createElement('canvas');
    var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    webgl = gl && gl instanceof WebGLRenderingContext;
} catch (err) {
    webgl = false;
}

Browser = {
    ie: ie,
    ielt9: ie && !document.addEventListener,
    edge: 'msLaunchUri' in navigator && !('documentMode' in document),
    webkit: webkit,
    gecko: gecko,
    android: ua.indexOf('android') !== -1,
    android23: android23,
    chrome: chrome,
    chromeVersion: chromeVersion,
    safari: !chrome && ua.indexOf('safari') !== -1,
    phantomjs: phantomjs,

    ie3d: ie3d,
    webkit3d: webkit3d,
    gecko3d: gecko3d,
    opera12: opera12,
    any3d: any3d,

    mobile: mobile,
    mobileWebkit: mobile && webkit,
    mobileWebkit3d: mobile && webkit3d,
    mobileOpera: mobile && window.opera,
    mobileGecko: mobile && gecko,

    touch: !!touch,
    msPointer: !!msPointer,
    pointer: !!pointer,

    retina: (window.devicePixelRatio || window.screen.deviceXDPI / window.screen.logicalXDPI) > 1,

    language: navigator.browserLanguage ? navigator.browserLanguage : navigator.language,
    ie9: ie && document.documentMode === 9,
    ie10: ie && document.documentMode === 10,

    webgl: webgl
};

var Browser$1 = Browser;

var auroraVertexShaderSource = "varying vec3 vNormal;void main(){vNormal=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}";

var auroraFragmentShaderSource = "varying vec3 vNormal;void main(){float intensity=pow(1.32-dot(vNormal,vec3(0,0,1.0)),8.0);if(intensity>12.0)intensity=intensity*0.06;else if(intensity>3.0)intensity=9.0/intensity;gl_FragColor=vec4(0.3,0.5,1.0,0.3)*intensity;}";

var Universe = function () {
    function Universe(opt) {
        classCallCheck(this, Universe);

        if (!opt.earth) {
            throw new Error('Can not build a Universe without Earth.');
        }

        this.earth = opt.earth;
        this._comps = new THREE.Group();
        var _this = this;

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

    createClass(Universe, [{
        key: 'update',
        value: function update(controls) {
            if (this.atmosphere) {
                var _opacity = (controls.zoom - 13) * 0.09;
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
    }]);
    return Universe;
}();

var Layer = function () {
    function Layer(id) {
        classCallCheck(this, Layer);

        this.setId(id);
    }

    /**
     * Get the layer id
     * @returns {String} id
     */


    createClass(Layer, [{
        key: 'getId',
        value: function getId() {
            return this._id;
        }

        /**
         * Set a new id to the layer
         * @param {String} id - new layer id
         * @return {Layer} this
         */

    }, {
        key: 'setId',
        value: function setId(id) {
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

    }, {
        key: 'addTo',
        value: function addTo(earth) {
            earth.addLayer(this);
            return this;
        }

        /**
         * Remove itself from the earth added to.
         * @returns {Layer} this
         */

    }, {
        key: 'remove',
        value: function remove() {
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

    }, {
        key: 'setZIndex',
        value: function setZIndex(zIndex) {
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

    }, {
        key: 'getZIndex',
        value: function getZIndex() {
            return this._zIndex;
        }
    }, {
        key: '_bindEarth',
        value: function _bindEarth(earth, zIndex) {
            if (!earth) {
                return;
            }
            this.earth = earth;
            this.setZIndex(zIndex);
        }

        /**
         * Get the earth that the layer added to
         * @returns {Earth}
         */

    }, {
        key: 'getEarth',
        value: function getEarth() {
            if (this.earth) {
                return this.earth;
            }
            return null;
        }
    }, {
        key: 'load',
        value: function load() {}
    }, {
        key: 'update',
        value: function update() {}
    }]);
    return Layer;
}();

function createEasyLayer(opt) {
    var layer = new Layer('easy-layer');
    layer.load = function () {
        var image = new THREE.Mesh();
        image.geometry = new THREE.SphereGeometry(layer.earth._radius, 120, 120);
        image.material = new THREE.MeshPhongMaterial({
            bumpScale: 0.5,
            specular: new THREE.Color('grey'),
            shininess: 10
        });
        image.rotation.y = 3;

        var loader = new THREE.TextureLoader();
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

var Unit = 100;
var EarthRadius = 6371 * Unit;

/*!
 * contains code from maptalks.js
 * https://github.com/maptalks/maptalks.js
 * LICENSE : BSD 3
 * (c) maptalks.org
 *
 */

var Earth = function () {
    function Earth(container, options) {
        classCallCheck(this, Earth);

        if (!options) {
            throw new Error('Invalid options when creating earth.');
        }

        var zoom = options['zoom'] ? options['zoom'] : 1;
        var maxZoom = options['maxZoom'] ? options['maxZoom'] : 19;
        var minZoom = options['minZoom'] ? options['minZoom'] : 1;
        var center = new Coordinate(options['center'] ? options['center'] : [100, 30]);
        var layers = options['layers'];
        var easyLayer = options['easyLayer'];

        this._radius = EarthRadius;
        this._loaded = false;

        this._layers = [];
        this._zoomLevel = maxZoom - zoom;
        this._maxLevel = maxZoom;
        this._minLevel = minZoom;
        this._center = center;

        this._initContainer(container);
        this._initRenderer();
        this._updateEarthSize(this._getContainerDomSize());

        this._universe = new Universe({
            earth: this,
            galaxyURL: options['galaxy'] != undefined ? options['galaxy'] : 'textures/galaxy_starfield.png',
            atmosphereURL: options['atmosphere'] != undefined ? options['atmosphere'] : 'textures/fair_clouds_4k.png',
            aurora: options['aurora'] != undefined ? options['aurora'] : true
        });

        if (easyLayer) {
            this.addLayer(createEasyLayer({
                baseURL: options['baseURL'] != undefined ? options['baseURL'] : 'textures/2_no_clouds_4k.jpg',
                bumpURL: options['bumpURL'] != undefined ? options['bumpURL'] : 'textures/elev_bump_4k.jpg'
            }));
        }

        if (layers) {
            this.addLayer(layers);
        }

        this._load();
    }

    createClass(Earth, [{
        key: '_initContainer',
        value: function _initContainer(container) {
            if (isString(container)) {
                this._containerDOM = document.getElementById(container);
                if (!this._containerDOM) {
                    throw new Error('Invalid container when creating earth: \'' + container + '\'');
                }
            } else {
                this._containerDOM = container;
            }

            if (this._containerDOM.childNodes && this._containerDOM.childNodes.length > 0) {
                if (this._containerDOM.childNodes[0].className === 'geov-wrapper') {
                    throw new Error('Container is already loaded with another earth instance, use earth.remove() to clear it.');
                }
            }

            // Wipe DOM
            this._containerDOM.innerHTML = '';
            // Add info space
            this._containerDOM.appendChild(this._infoElem = document.createElement('div'));
            this._infoElem.className = 'geov-info-msg';
            // Setup tooltip
            this._containerDOM.appendChild(this._toolTipElem = document.createElement('div'));
            this._toolTipElem.className = 'geov-tooltip';
        }
    }, {
        key: '_initRenderer',
        value: function _initRenderer() {
            if (this._rafId) {
                cancelAnimationFrame(this._rafId);
                this._rafId = null;
            }

            // Setup webgl renderer
            this._renderer = new THREE.WebGLRenderer({
                antialias: true
            });
            this._renderer.shadowMap.enabled = true;
            this._renderer.setClearColor(0x000000);
            this._renderer.setPixelRatio(window.devicePixelRatio);
            this._renderer.domElement.className += 'geov-wrapper';
            this._containerDOM.appendChild(this._renderer.domElement);

            // Setup scenes
            this._scene = new THREE.Scene();

            // Setup camera
            this._camera = new THREE.PerspectiveCamera();
            this._camera.near = Unit * 0.1;
            this._camera.far = this._radius * 100;

            // Add lights
            this._camera.add(new THREE.PointLight(0xffffff, 1, this._radius));
            this._scene.add(new THREE.AmbientLight(0xcccccc));

            // Add camera interaction
            this._controls = new EarthControls$1(this._camera, this._renderer.domElement, {
                maxZoom: this._maxLevel,
                minZoom: this._minLevel,
                zoom: this._zoomLevel,
                radius: this._radius
            });

            // Add earth sphere
            this._earth = new THREE.Mesh();
            this._earth.geometry = new THREE.SphereGeometry(this._radius * 0.97, 100, 100);
            this._earth.material = new THREE.MeshBasicMaterial({
                color: 0x555555
            });
            this._earth.renderOrder = 20;
            this._scene.add(this._earth);

            var _this = this;
            // Kick-off renderer
            this._rafId = requestAnimationFrame(function animate() {
                // Frame cycle
                _this._layers.forEach(function (layer) {
                    layer.update();
                });

                _this._controls.update();
                _this._universe.update(_this._controls);
                _this._renderer.render(_this._scene, _this._camera);

                requestAnimationFrame(animate);
            });
        }
    }, {
        key: '_updateEarthSize',
        value: function _updateEarthSize(eSize) {
            this.width = eSize['width'];
            this.height = eSize['height'];

            this._renderer.setSize(this.width, this.height);
            this._camera.aspect = this.width / this.height;
            this._camera.updateProjectionMatrix();
            this._controls.handleResize();

            return this;
        }
    }, {
        key: '_getContainerDomSize',
        value: function _getContainerDomSize() {
            if (!this._containerDOM) {
                return null;
            }
            var containerDOM = this._containerDOM;
            var width = void 0,
                height = void 0;
            if (containerDOM.width && containerDOM.height) {
                width = containerDOM.width;
                height = containerDOM.height;
                if (Browser$1.retina) {
                    width /= 2;
                    height /= 2;
                }
            } else if (containerDOM.clientWidth && containerDOM.clientHeight) {
                width = parseInt(containerDOM.clientWidth, 0);
                height = parseInt(containerDOM.clientHeight, 0);
            } else {
                throw new Error('can not get size of container');
            }
            return new Size(width, height);
        }

        /**
         * Add a new layer on the top of the earth.
         * @param  {Layer|Layer[]} layer - one or more layers to add
         * @return {Earth} this
         */

    }, {
        key: 'addLayer',
        value: function addLayer(layers) {
            if (!layers) {
                return this;
            }
            if (!Array.isArray(layers)) {
                return this.addLayer([layers]);
            }
            if (!this._layerCache) {
                this._layerCache = {};
            }

            for (var i = 0, len = layers.length; i < len; i++) {
                var layer = layers[i];
                var id = layer.getId();
                if (!id) {
                    throw new Error('Invalid id for the layer: ' + id);
                }
                if (layer.getEarth() === this) {
                    continue;
                }
                if (this._layerCache[id]) {
                    throw new Error('Duplicate layer id in the earth: ' + id);
                }
                this._layerCache[id] = layer;
                layer._bindEarth(this, this._layers.length);
                this._layers.push(layer);
                if (this._loaded) {
                    layer.load();
                }
            }

            return this;
        }

        /**
         * Remove a layer from the earth
         * @param  {String|String[]|Layer|Layer[]} layer - one or more layers or layer ids
         * @return {Earth} this
         * @fires Earth#removelayer
         */

    }, {
        key: 'removeLayer',
        value: function removeLayer(layers) {
            if (!layers) {
                return this;
            }
            if (!Array.isArray(layers)) {
                return this.removeLayer([layers]);
            }
            var removed = [];
            for (var i = 0, len = layers.length; i < len; i++) {
                var layer = layers[i];
                if (!(layer instanceof Layer)) {
                    layer = this.getLayer(layer);
                }
                if (!layer) {
                    continue;
                }
                var earth = layer.getEarth();
                if (!earth || earth !== this) {
                    continue;
                }
                removed.push(layer);
                // todo
                // this._removeLayer(layer, this._layers);
                // if (this._loaded) {
                //     layer._doRemove();
                // }
                var id = layer.getId();
                if (this._layerCache) {
                    delete this._layerCache[id];
                }
            }

            return this;
        }
    }, {
        key: '_load',
        value: function _load() {
            // this._resetMapStatus();
            // if (this.options['pitch']) {
            //     this.setPitch(this.options['pitch']);
            //     delete this.options['pitch'];
            // }
            // if (this.options['bearing']) {
            //     this.setBearing(this.options['bearing']);
            //     delete this.options['bearing'];
            // }
            this._layers.forEach(function (layer) {
                return layer.load();
            });
            this._loaded = true;
        }
    }]);
    return Earth;
}();

var PI = 3.141592653589793;
var PI2 = PI * 2;
var HALFPI = PI / 2;
var MAXPHI = 1.2626272556789115; // Math.atan(PI)

var MathUtils = {
    PI: PI,
    PI2: PI2,
    HALFPI: HALFPI,
    MAXPHI: MAXPHI,
    numerationSystemTo10: function numerationSystemTo10(numSys, strNum) {
        var sum = 0;
        for (var i = 0; i < strNum.length; i++) {
            var level = strNum.length - 1 - i;
            var key = parseInt(strNum[i]);
            sum += key * Math.pow(numSys, level);
        }
        return sum;
    }
};

Earth.prototype.setBearing = function (bearing) {
    console.log(bearing);
};

Earth.prototype.getBearing = function () {
    return Math.round(this._controls.bearing * 1e2) / 1e2;
};

Earth.prototype.setPitch = function (bearing) {};

Earth.prototype.getPitch = function () {
    return Math.round(this._controls.pitch * 1e2) / 1e2;
};

Earth.prototype.setZoom = function (bearing) {};

Earth.prototype.getZoom = function () {
    return Math.round((this._controls.maxZoom - this._controls.zoom) * 1e1) / 1e1;
};

Earth.prototype.setRadian = function (bearing) {};

Earth.prototype.getRadian = function () {
    var coord = this._controls.coord.clone();
    coord.x += MathUtils.HALFPI;
    return coord;
};

var GeoUtils = {
    // 经纬度坐标 转成 球面坐标
    geoToSphere: function geoToSphere(earthRadius, coordinates) {
        var x = coordinates[0] / 180 * MathUtils.PI + MathUtils.HALFPI;
        if (x > MathUtils.PI) x = -MathUtils.PI2 + x;
        var y = (90 - coordinates[1]) / 180 * MathUtils.PI;
        var spherical = new THREE.Spherical(earthRadius, y, x);
        spherical.makeSafe();
        return new THREE.Vector3().setFromSpherical(spherical);
    }
};

exports.Earth = Earth;
exports.Layer = Layer;
exports.MathUtils = MathUtils;
exports.GeoUtils = GeoUtils;

Object.defineProperty(exports, '__esModule', { value: true });

typeof console !== 'undefined' && console.log('geov.js 0.0.3');

})));
