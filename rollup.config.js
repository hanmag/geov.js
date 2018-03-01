import postCss from 'rollup-plugin-postcss';
import resolve from 'rollup-plugin-node-resolve';
import glsl from 'rollup-plugin-glsl';
import pkg from './package.json';

export default {
    input: 'src/main.js',
    output: [{
        format: 'umd',
        name: `${pkg.name}`,
        file: `dist/${pkg.name}.js`,
        sourcemap: false,
        extend: true
    }],
    plugins: [
        postCss(),
        resolve(),
        glsl({
            include: 'src/shaders/*.glsl',
            sourceMap: false
        })
    ],
    banner: `// Version ${pkg.version} ${pkg.name} - ${pkg.homepage}`,
    outro: `typeof console !== 'undefined' && console.log('${pkg.name} ${pkg.version}');`
};