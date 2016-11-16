/**
 * @author Wang Jue  / http://git.oschina.net/wangjue
 */

var V = V || {};

V.Globe = function (container, opts) {

    opts = opts || {};

    var imgDir = opts.imgDir || 'images/';

    var camera, renderer, scene, controls;

    var sphere;

    function init() {

        var width = container.offsetWidth || window.innerWidth,
            height = container.offsetHeight || window.innerHeight;

        // Earth params
        var radius = 0.5, segments = 32, rotation = 6;

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.z = 1.5;

        renderer = new THREE.WebGLRenderer();
        renderer.setSize(width, height);

        scene.add(new THREE.AmbientLight(0x333333));

        var light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(5, 3, 5);
        scene.add(light);

        sphere = new THREE.Mesh(
            new THREE.SphereGeometry(radius, segments, segments),
            new THREE.MeshPhongMaterial({
                map: THREE.ImageUtils.loadTexture(imgDir + '2_no_clouds_4k.jpg'),
                bumpMap: THREE.ImageUtils.loadTexture(imgDir + 'elev_bump_4k.jpg'),
                bumpScale: 0.005,
                specularMap: THREE.ImageUtils.loadTexture(imgDir + 'water_4k.png'),
                specular: new THREE.Color('grey')
            })
        );
        sphere.rotation.y = rotation;
        scene.add(sphere)

        controls = new THREE.TrackballControls(camera);

        container.appendChild(renderer.domElement);
    }

    function render() {
        controls.update();
        sphere.rotation.y += 0.0005;
        //clouds.rotation.y += 0.0005;
        renderer.render(scene, camera);
    }

    function animate() {
        requestAnimationFrame(animate);
        render();
    }

    init();

    this.animate = animate;

    return this;
};