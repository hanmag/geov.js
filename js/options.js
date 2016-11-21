var options = {
    mapStyle: 'normal',
    viewMode: '3d-earth',
    textureDir: 'textures/',
    textures: {
        normal: '2_no_clouds_4k.jpg',
        bump: 'elev_bump_4k.jpg',
        displacement: 'bathymetry_bw_composite_4k.jpg',
        specular: 'water_4k.png',
        black: 'black_world_2k.jpg',
        galaxy: 'galaxy_starfield.png',
        clouds: 'fair_clouds_4k.png',
        water: 'waternormals.jpg'
    },
    shaders: {
        black: {
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
    }
};