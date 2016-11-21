/**
 * @author Wang Jue  / http://git.oschina.net/wangjue
 */

var V = V || {};

V.Globe = function (containerId, opts, callback) {

    if (!Detector.webgl) {
        Detector.addGetWebGLMessage();
        return;
    }

    var Shaders = {
        'atmosphere': {
            uniforms: {},
            vertexShader: [
                'varying vec3 vNormal;',
                'void main() {',
                'vNormal = normalize( normalMatrix * normal );',
                'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
                '}'
            ].join('\n'),
            fragmentShader: [
                'varying vec3 vNormal;',
                'void main() {',
                'float intensity = pow( 0.8 - dot( vNormal, vec3( 0, 0, 1.0 ) ), 12.0 );',
                'gl_FragColor = vec4( 0.3, 0.5, 1.0, 0.5 ) * intensity;',
                '}'
            ].join('\n')
        }
    };

    var container = document.getElementById(containerId);

    var Components = {
        ambientLight: new THREE.AmbientLight(0x999999),
        directionalLight: new THREE.DirectionalLight(0xffffff, 0.7),
        perspectiveCamera: new THREE.PerspectiveCamera(45, container.offsetWidth / container.offsetHeight, 0.1, 1000),
        orthographicCamera: new THREE.OrthographicCamera(container.offsetWidth / - 2, container.offsetWidth / 2, container.offsetHeight / 2, container.offsetHeight / - 2, 0, 1000),
        earthSphere: undefined, earthSphere2: undefined,
        cloudSphere: undefined, cloudSphere2: undefined,
        oceanSphere: undefined,
        galaxy: undefined,
        atomsphere: undefined,
        initialize: function () {
            // Earth Params
            var radius = 50, segments = 64, rotation = 3, mapWidth = 2000, mapHeight = 1000;

            Components.directionalLight.position.set(100, 100, 200);
            Components.directionalLight.castShadow = true;
            Components.perspectiveCamera.position.z = 150;
            Components.orthographicCamera.position.x = 0;
            Components.orthographicCamera.position.y = -10;
            Components.orthographicCamera.position.z = 50;

            // 3d Mesh
            Components.earthSphere = new THREE.Mesh(
                new THREE.SphereGeometry(radius, segments, segments),
                new THREE.MeshPhongMaterial({
                    bumpScale: 0.5,
                    specular: new THREE.Color('grey'),
                    shininess: 10
                })
            );
            Components.earthSphere.rotation.y = rotation;
            Components.earthSphere.castShadow = true;
            Components.earthSphere.receiveShadow = true;

            // 3d earth mesh
            Components.earthSphere2 = new THREE.Mesh(
                new THREE.SphereGeometry(radius, segments, segments),
                new THREE.MeshPhongMaterial({
                    bumpScale: 0.5,
                    specular: new THREE.Color('grey'),
                    shininess: 10
                })
            );
            Components.earthSphere2.rotation.y = rotation;

            // 3d cloud mesh
            Components.cloudSphere = new THREE.Mesh(
                new THREE.SphereGeometry(radius * 1.18, segments, segments),
                new THREE.MeshPhongMaterial({
                    side: THREE.DoubleSide,
                    opacity: 0.8,
                    depthWrite: false,
                    transparent: true
                })
            );
            Components.cloudSphere.rotation.y = rotation;

            Components.cloudSphere2 = new THREE.Mesh(
                new THREE.SphereGeometry(radius * 1.02, segments, segments),
                new THREE.MeshPhongMaterial({
                    side: THREE.DoubleSide,
                    opacity: 0.8,
                    depthWrite: false,
                    transparent: true
                })
            );
            Components.cloudSphere2.rotation.y = rotation;

            Components.oceanSphere = new THREE.Mesh(
                new THREE.SphereGeometry(radius * 1.11, segments, segments),
                new THREE.MeshPhongMaterial({
                    color: 0x000000,
                    specular: 0x111111,
                    shininess: 512,
                    transparent: true,
                    opacity: 0.5
                })
            );
            Components.oceanSphere.material.color.setHSL(0.51, 0.75, 0.25);
            Components.oceanSphere.rotation.y = rotation;
            Components.oceanSphere.receiveShadow = true;

            Components.galaxy = new THREE.Mesh(
                new THREE.SphereGeometry(radius * 100, segments * 2, segments * 2),
                new THREE.MeshBasicMaterial({
                    side: THREE.BackSide
                })
            );

            var shader = Shaders['atmosphere'];
            var uniforms = THREE.UniformsUtils.clone(shader.uniforms);

            Components.atomsphere = new THREE.Mesh(
                new THREE.SphereGeometry(radius * 1.25, segments, segments),
                new THREE.ShaderMaterial({
                    uniforms: uniforms,
                    vertexShader: shader.vertexShader,
                    fragmentShader: shader.fragmentShader,
                    side: THREE.BackSide,
                    blending: THREE.AdditiveBlending,
                    transparent: true
                })
            );
        }
    };

    var mapStyle, viewMode;

    var camera, controls, textures = {},
        renderer = new THREE.WebGLRenderer(),
        scene = new THREE.Scene(),
        mesh = new THREE.Mesh();

    function init() {

        Components.initialize();

        renderer.shadowMap.enabled = true;
        renderer.setSize(container.offsetWidth, container.offsetHeight);
        renderer.setClearColor(0x000000);
        renderer.setPixelRatio(window.devicePixelRatio);

        container.appendChild(renderer.domElement);

        // stats
        stats = new Stats();
        container.appendChild(stats.dom);

        // events
        window.addEventListener('resize', onWindowResize, false);

        var renderScene = _.after(Object.getOwnPropertyNames(opts.textures).length, function () {
            Components.earthSphere.material.bumpMap = textures['bump'];
            Components.earthSphere.material.displacementMap = textures['displacement'];
            Components.earthSphere.material.displacementScale = 10;

            Components.earthSphere2.material.bumpMap = textures['bump'];
            Components.earthSphere2.material.specularMap = textures['specular'];

            Components.cloudSphere.material.map = textures['clouds'];
            Components.cloudSphere2.material.map = textures['clouds'];
            textures['water'].repeat.set(2, 1).multiplyScalar(4);
            Components.oceanSphere.material.map = textures['water'];
            Components.galaxy.material.map = textures['galaxy'];

            animate();
            setTimeout(callback, 500);
        });
        // renderScene is run once, after all textures have loaded.
        var loader = new THREE.TextureLoader();
        _.each(opts.textures, function (path, name) {
            loader.load(opts.textureDir + path, function (t) {
                t.anisotropy = 16;
                t.wrapS = t.wrapT = THREE.RepeatWrapping;
                textures[name] = t;

                renderScene();
            });
        });
    }

    function onWindowResize(event) {
        if (camera === undefined) return;
        camera.aspect = container.offsetWidth / container.offsetHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.offsetWidth, container.offsetHeight);
    }

    function render() {
        applyOptions();

        if (controls === undefined)
            return;

        controls.update();
        applyAnimation();
        renderer.render(scene, camera);
    }

    function applyAnimation() {
        Components.cloudSphere.rotation.y += 0.0003;
        Components.cloudSphere2.rotation.y += 0.0003;
    }

    function applyOptions() {
        if (mapStyle === opts.mapStyle && viewMode === opts.viewMode)
            return;

        if (viewMode !== opts.viewMode)
            resetScene(opts.viewMode);

        mesh.material.map = textures[opts.mapStyle];

        mapStyle = opts.mapStyle;
        viewMode = opts.viewMode;
    }

    // apply camera, controls and mesh settings
    function resetScene(mode) {
        var meshGroup = new THREE.Group();

        var objsToRemove = _.rest(scene.children, 0);
        _.each(objsToRemove, function (object) {
            scene.remove(object);
        });

        switch (mode) {
            case '3d-earth':
                scene.add(Components.ambientLight);
                scene.add(Components.directionalLight);
                mesh = Components.earthSphere;
                meshGroup.add(mesh);
                meshGroup.add(Components.cloudSphere);
                meshGroup.add(Components.oceanSphere);
                meshGroup.add(Components.galaxy);
                meshGroup.add(Components.atomsphere);

                camera = Components.perspectiveCamera;
                controls = new THREE.OrbitControls(camera, container);
                controls.minDistance = 100;
                controls.maxDistance = 200;
                controls.enableDamping = true;
                controls.rotateSpeed = 0.5
                controls.enablePan = false;
                break;
            case '3d-plane':
                scene.add(Components.ambientLight);
                scene.add(Components.directionalLight);
                mesh = Components.earthSphere2;
                meshGroup.add(mesh);
                meshGroup.add(Components.cloudSphere2);
                meshGroup.add(Components.galaxy);
                meshGroup.add(Components.atomsphere);

                camera = Components.perspectiveCamera;
                controls = new THREE.OrbitControls(camera, container);
                controls.minDistance = 100;
                controls.maxDistance = 200;
                controls.enableDamping = true;
                controls.rotateSpeed = 0.5
                controls.enablePan = false;
                break;
            case '2d-earth':
                camera = Components.orthographicCamera;
                controls = new THREE.OrbitControls(camera, container);
                controls.enableRotate = false;
                break;
            case '2d-Plane':
                camera = Components.orthographicCamera;
                controls = new THREE.OrbitControls(camera, container);
                controls.enableRotate = false;
                break;
            default:
                console.log("Sorry, controls settings are out of " + mode + ".");
                break;
        }

        scene.add(meshGroup);
    }

    function animate() {
        requestAnimationFrame(animate);

        render();
        stats.update();
    }

    init();

    return this;
};