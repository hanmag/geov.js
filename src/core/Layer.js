class Layer {

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

    _bindEarth(earth, zIndex) {
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
    getEarth() {
        if (this.earth) {
            return this.earth;
        }
        return null;
    }

    load() {

    }

    update() {

    }
}

export default Layer;