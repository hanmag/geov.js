import postCss from 'rollup-plugin-postcss';
import resolve from 'rollup-plugin-node-resolve';
import commonJs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import glsl from 'rollup-plugin-glsl';
import { name, homepage, version } from './package.json';

export default {
    input: 'src/index.js',
    output: [{
        format: 'umd',
        name: 'Geov',
        file: `dist/${name}.js`,
        sourcemap: false
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
    context: 'this',
    banner: `// Version ${version} ${name} - ${homepage}`
};