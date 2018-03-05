class Coordinate {
    /**
     * @param {Number} x - x value
     * @param {Number} y - y value
     */
    constructor(x, y) {
        if (x && y) {
            /**
             * @property {Number} x - value on X-Axis or longitude in degrees
             */
            this.x = +(x);
            /**
             * @property {Number} y - value on Y-Axis or Latitude in degrees
             */
            this.y = +(y);
        } else if (Array.isArray(x)) {
            //数组
            this.x = +(x[0]);
            this.y = +(x[1]);
        } else if (x['x'] && x['y']) {
            //对象
            this.x = +(x['x']);
            this.y = +(x['y']);
        }
        if (this._isNaN()) {
            throw new Error('coordinate is NaN');
        }
    }

    /**
     * Returns a copy of the coordinate
     * @return {Coordinate} copy
     */
    copy() {
        return new Coordinate(this.x, this.y);
    }

    /**
     * Compare with another coordinate to see whether they are equal.
     * @param {Coordinate} c - coordinate to compare
     * @return {Boolean}
     */
    equals(c) {
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
    _isNaN() {
        return isNaN(this.x) || isNaN(this.y);
    }

    /**
     * Convert the coordinate to a number array [x, y]
     * @return {Number[]} number array
     */
    toArray() {
        return [this.x, this.y];
    }

    /**
     * Formats coordinate number using fixed-point notation.
     * @param  {Number} n The number of digits to appear after the decimal point
     * @return {Coordinate}   fixed coordinate
     */
    toFixed(n) {
        return new Coordinate(this.x.toFixed(n), this.y.toFixed(n));
    }

    /**
     * Convert the coordinate to a json object {x : .., y : ..}
     * @return {Object} json
     */
    toJSON() {
        return {
            x: this.x,
            y: this.y
        };
    }
}

export default Coordinate;