import postCss from 'rollup-plugin-postcss';
import resolve from 'rollup-plugin-node-resolve';
import glsl from 'rollup-plugin-glsl';
import babel from 'rollup-plugin-babel'
import pkg from './package.json';

export default {
    input: 'src/main.js',
    globals: {
        three: 'THREE'
    },
    external: [
        'three'
    ],
    output: [{
        format: 'umd',
        name: `geov`,
        file: `dist/geov.js`,
        sourcemap: false,
        extend: true
    }],
    plugins: [
        postCss(),
        resolve(),
        glsl({
            include: 'src/shaders/*.glsl',
            sourceMap: false
        }),
        babel({
            exclude: 'node_modules/**'
        })
    ],
    banner: `// Version ${pkg.version} ${pkg.name} - ${pkg.homepage}`,
    outro: `typeof console !== 'undefined' && console.log('${pkg.name} ${pkg.version}');`
};