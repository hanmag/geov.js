/**
 * @author Wang Jue  / http://git.oschina.net/wangjue
 */

var V = V || {};

V.Globe = function (containerId, opts, callback) {

    var Shaders = {
        'earth': {
            uniforms: {
                'texture': { type: 't', value: null }
            },
            vertexShader: [
                'varying vec3 vNormal;',
                'varying vec2 vUv;',
                'void main() {',
                'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
                'vNormal = normalize( normalMatrix * normal );',
                'vUv = uv;',
                '}'
            ].join('\n'),
            fragmentShader: [
                'uniform sampler2D texture;',
                'varying vec3 vNormal;',
                'varying vec2 vUv;',
                'void main() {',
                'vec3 diffuse = texture2D( texture, vUv ).xyz;',
                'float intensity = 1.05 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) );',
                'vec3 atmosphere = vec3( 1.0, 1.0, 1.0 ) * pow( intensity, 3.0 );',
                'gl_FragColor = vec4( diffuse + atmosphere, 1.0 );',
                '}'
            ].join('\n')
        },
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
                'gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0 ) * intensity;',
                '}'
            ].join('\n')
        }
    };

    if (!Detector.webgl) {
        Detector.addGetWebGLMessage();
        return;
    }

    var textureDir = opts.textureDir;
    var mapStyle, viewMode;

    var container = document.getElementById(containerId);

    var camera, controls, renderer = new THREE.WebGLRenderer(), scene = new THREE.Scene();

    var earthMeshGroup = new THREE.Group(),
        blackMeshGroup = new THREE.Group(),
        earthPlaneGroup = new THREE.Group();

    var clouds;

    function init() {
        // Earth Params
        var radius = 0.5, segments = 32, rotation = 3, mapWidth = 1200, mapHeight = 600;

        // Earth Mesh Textures
        var mapTexture, bumpMapTexture, specularMapTexture, cloudsTexture, starsTexture,
            blackMapTexture;

        renderer.setSize(container.offsetWidth, container.offsetHeight);
        renderer.setClearColor(0x000000);
        renderer.setPixelRatio(window.devicePixelRatio);

        var createEarthSphere = _.after(3, function () {
            var sphere = new THREE.Mesh(
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

            var shader = Shaders['atmosphere'];
            var uniforms = THREE.UniformsUtils.clone(shader.uniforms);

            earthMeshGroup.add(new THREE.Mesh(
                new THREE.SphereGeometry(radius * 1.15, segments, segments),
                new THREE.ShaderMaterial({
                    uniforms: uniforms,
                    vertexShader: shader.vertexShader,
                    fragmentShader: shader.fragmentShader,
                    side: THREE.BackSide,
                    blending: THREE.AdditiveBlending,
                    transparent: true
                })
            ));
        });

        var createEarthClouds = _.after(1, function () {
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
            var stars = new THREE.Mesh(
                new THREE.SphereGeometry(radius * 100, segments * 2, segments * 2),
                new THREE.MeshBasicMaterial({
                    map: starsTexture,
                    side: THREE.BackSide
                })
            );
            earthMeshGroup.add(stars);
        });

        var createBlackSphere = _.after(1, function () {
            var shader = Shaders['earth'];

            var uniforms = THREE.UniformsUtils.clone(shader.uniforms);
            uniforms['texture'].value = blackMapTexture;

            var mesh = new THREE.Mesh(
                new THREE.SphereGeometry(radius, segments, segments),
                new THREE.ShaderMaterial({
                    uniforms: uniforms,
                    vertexShader: shader.vertexShader,
                    fragmentShader: shader.fragmentShader
                })
            );
            mesh.rotation.y = rotation;
            blackMeshGroup.add(mesh);

            shader = Shaders['atmosphere'];
            uniforms = THREE.UniformsUtils.clone(shader.uniforms);

            blackMeshGroup.add(new THREE.Mesh(
                new THREE.SphereGeometry(radius * 1.15, segments, segments),
                new THREE.ShaderMaterial({
                    uniforms: uniforms,
                    vertexShader: shader.vertexShader,
                    fragmentShader: shader.fragmentShader,
                    side: THREE.BackSide,
                    blending: THREE.AdditiveBlending,
                    transparent: true
                })
            ));
        });

        var createEarthPlane = _.after(1, function () {
            var plane = new THREE.Mesh(
                new THREE.PlaneGeometry(mapWidth, mapHeight, segments, segments),
                new THREE.MeshPhongMaterial({
                    map: mapTexture,
                    shininess: 10,
                    side: THREE.FrontSide
                })
            );
            //plane.rotation.x = -0.25 * Math.PI;
            earthPlaneGroup.add(plane);
        });

        var loader = new THREE.TextureLoader();
        loader.load(textureDir + '2_no_clouds_4k.jpg', function (texture) {
            mapTexture = texture;
            createEarthSphere();
            createEarthPlane();
        });
        loader.load(textureDir + 'elev_bump_4k.jpg', function (texture) {
            bumpMapTexture = texture;
            createEarthSphere();
        });
        loader.load(textureDir + 'water_4k.png', function (texture) {
            specularMapTexture = texture;
            createEarthSphere();
        });
        loader.load(textureDir + 'fair_clouds_4k.png', function (texture) {
            cloudsTexture = texture;
            createEarthClouds();
        });
        loader.load(textureDir + 'galaxy_starfield.png', function (texture) {
            starsTexture = texture;
            createStars();
        });
        loader.load(textureDir + 'black_world_2k.jpg', function (texture) {
            blackMapTexture = texture;
            createBlackSphere();
        });

        container.appendChild(renderer.domElement);

        stats = new Stats();
        container.appendChild(stats.dom);

        window.addEventListener('resize', onWindowResize, false);
    }

    function onWindowResize(event) {
        if (camera === undefined) return;
        camera.aspect = container.offsetWidth / container.offsetHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.offsetWidth, container.offsetHeight);
    }

    function render() {
        applyOptions();
        applyAnimation();

        if (controls === undefined)
            return;

        controls.update();
        renderer.render(scene, camera);
    }

    function applyAnimation() {
        if (clouds !== undefined)
            clouds.rotation.y += 0.0002;
    }

    function applyOptions() {
        if (mapStyle === opts.mapStyle && viewMode === opts.viewMode)
            return;

        resetSceneContent(opts.mapStyle + '-' + opts.viewMode);

        if (viewMode !== opts.viewMode)
            resetSceneControls(opts.viewMode);

        mapStyle = opts.mapStyle;
        viewMode = opts.viewMode;
    }

    // apply scene settings
    function resetSceneContent(tag) {
        switch (tag) {
            case 'earth-3d':
                ambientLight = new THREE.AmbientLight(0x555555);
                directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
                directionalLight.position.set(1, 1, 2).normalize();
                meshGroup = earthMeshGroup;
                break;
            case 'black-3d':
                ambientLight = new THREE.AmbientLight(0x555555);
                meshGroup = blackMeshGroup;
                break;
            case 'earth-2.5d':
                ambientLight = new THREE.AmbientLight(0xaaaaaa);
                directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
                directionalLight.position.set(1, 1, 2).normalize();
                meshGroup = earthPlaneGroup;
                break;
            default:
                console.log("Sorry, scene settings are out of " + tag + ".");
                break;
        }

        var objsToRemove = _.rest(scene.children, 0);
        _.each(objsToRemove, function (object) {
            scene.remove(object);
        });

        if (ambientLight !== undefined)
            scene.add(ambientLight);
        if (directionalLight !== undefined)
            scene.add(directionalLight);
        if (meshGroup !== undefined)
            scene.add(meshGroup);
    }

    // apply camera and controls settings
    function resetSceneControls(mode) {
        switch (mode) {
            case '3d':
                camera = new THREE.PerspectiveCamera(45, container.offsetWidth / container.offsetHeight, 0.1, 100);
                camera.position.z = 1.5;
                controls = new THREE.TrackballControls(camera, container);
                controls.minDistance = 1.0;
                controls.maxDistance = 3.0;
                controls.noPan = true;
                break;
            case '2.5d':
                camera = new THREE.OrthographicCamera(container.offsetWidth / - 2, container.offsetWidth / 2, container.offsetHeight / 2, container.offsetHeight / - 2, 0, 1000);
                camera.position.x = 0;
                camera.position.y = -10;
                camera.position.z = 50;
                controls = new THREE.OrthographicTrackballControls(camera, container);
                controls.noRoll = true;
                controls.noRotate = true;
                controls.noPan = true;
                controls.noZoom = true;
                break;
            default:
                console.log("Sorry, controls settings are out of " + mode + ".");
                break;
        }
    }

    function animate() {
        requestAnimationFrame(animate);

        stats.begin();
        render();
        stats.end();
    }

    init();
    animate();

    setTimeout(callback, 500);

    return this;
};