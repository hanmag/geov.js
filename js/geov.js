/**
 * @author Wang Jue  / http://git.oschina.net/wangjue
 */

var V = V || {};

V.Globe = function (containerId, opts) {

    if (!Detector.webgl) {
        Detector.addGetWebGLMessage();
        return;
    }

    opts = opts || {
        imgDir: 'images/',
        type: 'earth'
    };

    var imgDir = opts.imgDir;

    var container = document.getElementById(containerId);

    var camera, renderer = new THREE.WebGLRenderer(), scene = new THREE.Scene(), controls;

    var earthMeshGroup = new THREE.Group();
    earthMeshGroup.name = 'earthMeshGroup';

    var sphere, clouds, stars;

    function init() {

        var width = container.offsetWidth || window.innerWidth,
            height = container.offsetHeight || window.innerHeight;

        // Earth Params
        var radius = 0.5, segments = 32, rotation = 3;

        // Earth Mesh Textures
        var mapTexture, bumpMapTexture, specularMapTexture, cloudsTexture, starsTexture;

        camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
        camera.position.z = 1.5;

        renderer.setSize(width, height);
        renderer.setClearColor(0x000000);
        renderer.setPixelRatio(window.devicePixelRatio);

        scene.add(new THREE.AmbientLight(0x555555));

        var light = new THREE.DirectionalLight(0xffffff, 0.6);
        light.position.set(1, 1, 2).normalize();
        scene.add(light);

        var createSphere = _.after(3, function () {
            sphere = new THREE.Mesh(
                new THREE.SphereGeometry(radius, segments, segments),
                new THREE.MeshPhongMaterial({
                    map: mapTexture,
                    bumpMap: bumpMapTexture,
                    bumpScale: 0.005,
                    specularMap: specularMapTexture,
                    specular: new THREE.Color('grey'),
                    shininess: 10
                })
            );
            sphere.rotation.y = rotation;
            earthMeshGroup.add(sphere);
        });

        var createClouds = _.after(1, function () {
            clouds = new THREE.Mesh(
                new THREE.SphereGeometry(radius * 1.02, segments, segments),
                new THREE.MeshPhongMaterial({
                    map: cloudsTexture,
                    transparent: true
                })
            );
            clouds.rotation.y = rotation;
            earthMeshGroup.add(clouds);
        });

        var createStars = _.after(1, function () {
            stars = new THREE.Mesh(
                new THREE.SphereGeometry(radius * 100, segments * 2, segments * 2),
                new THREE.MeshBasicMaterial({
                    map: starsTexture,
                    side: THREE.BackSide
                })
            );
            earthMeshGroup.add(stars);
        });

        var loader = new THREE.TextureLoader();
        loader.load(imgDir + '2_no_clouds_4k.jpg', function (texture) {
            mapTexture = texture;
            createSphere();
        });
        loader.load(imgDir + 'elev_bump_4k.jpg', function (texture) {
            bumpMapTexture = texture;
            createSphere();
        });
        loader.load(imgDir + 'water_4k.png', function (texture) {
            specularMapTexture = texture;
            createSphere();
        });
        loader.load(imgDir + 'fair_clouds_4k.png', function (texture) {
            cloudsTexture = texture;
            createClouds();
        });
        loader.load(imgDir + 'galaxy_starfield.png', function (texture) {
            starsTexture = texture;
            createStars();
        });

        controls = new THREE.TrackballControls(camera);
        controls.minDistance = 0.8;
        controls.maxDistance = 3.0;
        controls.noPan = true;

        container.appendChild(renderer.domElement);

        stats = new Stats();
        container.appendChild(stats.dom);

        window.addEventListener('resize', onWindowResize, false);
        document.addEventListener('keydown', onKeyDown, false);
    }

    function onWindowResize(event) {
        camera.aspect = container.offsetWidth / container.offsetHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.offsetWidth, container.offsetHeight);
    }

    function onKeyDown(event) {
        controls.reset();
    }

    function render() {
        applyOptions();

        controls.update();
        if (clouds !== undefined)
            clouds.rotation.y += 0.0002;
        renderer.render(scene, camera);
    }

    function applyOptions() {
        setMeshGroup();
    }

    function setMeshGroup() {
        var meshGroup;
        switch (opts.type) {
            case "earth":
                meshGroup = earthMeshGroup;
                break;
            default:
                console.log("Sorry, we are out of " + opts.type + ".");
                return;
        }

        for (var i = 0; i < scene.children.length; i++) {
            if (scene.children[i].name === meshGroup.name) {
                return;
            } else if (scene.children[i].Type !== 'Group') {
                continue;
            } else {
                scene.children[i] = meshGroup;
                return;
            }
        }

        scene.add(meshGroup);
    }

    function animate() {
        requestAnimationFrame(animate);

        stats.begin();
        render();
        stats.end();
    }

    init();
    animate();

    return this;
};