const path = require('path')
const flow = require('rollup-plugin-flow-no-whitespace')
//把ES6转换为buble
const buble = require('rollup-plugin-buble')
//用于在编译文件之前替代文件里面的相应的字符串
const replace = require('rollup-plugin-replace')
//Define aliases when bundling packages with Rollup
const alias = require('rollup-plugin-alias')
//vue的版本
const version = process.env.VERSION || require('../package.json').version
//获取weex的版本
const weexVersion = process.env.WEEX_VERSION || require('../packages/weex-vue-framework/package.json').version
/**
 * 文件头注释
 */
const banner =
  '/*!\n' +
  ' * Vue.js v' + version + '\n' +
  ' * (c) 2014-' + new Date().getFullYear() + ' Evan You\n' +
  ' * Released under the MIT License.\n' +
  ' */'

const weexFactoryPlugin = {
  intro () {
    return 'module.exports = function weexFactory (exports, renderer) {'
  },
  outro () {
    return '}'
  }
}

const builds = {
  // Runtime only (CommonJS). Used by bundlers e.g. Webpack & Browserify
  'web-runtime-cjs': {
    entry: path.resolve(__dirname, '../src/entries/web-runtime.js'),
    dest: path.resolve(__dirname, '../dist/vue.runtime.common.js'),
    format: 'cjs',
    banner
  },
  // Runtime+compiler CommonJS build (CommonJS)
  'web-full-cjs': {
    entry: path.resolve(__dirname, '../src/entries/web-runtime-with-compiler.js'),
    dest: path.resolve(__dirname, '../dist/vue.common.js'),
    format: 'cjs',
    alias: { he: './entity-decoder' },
    banner
  },
  // Runtime only (ES Modules). Used by bundlers that support ES Modules,
  // e.g. Rollup & Webpack 2
  'web-runtime-esm': {
    entry: path.resolve(__dirname, '../src/entries/web-runtime.js'),
    dest: path.resolve(__dirname, '../dist/vue.runtime.esm.js'),
    format: 'es',
    banner
  },
  // Runtime+compiler CommonJS build (ES Modules)
  'web-full-esm': {
    entry: path.resolve(__dirname, '../src/entries/web-runtime-with-compiler.js'),
    dest: path.resolve(__dirname, '../dist/vue.esm.js'),
    format: 'es',
    alias: { he: './entity-decoder' },
    banner
  },
  // runtime-only build (Browser)
  'web-runtime-dev': {
    entry: path.resolve(__dirname, '../src/entries/web-runtime.js'),
    dest: path.resolve(__dirname, '../dist/vue.runtime.js'),
    format: 'umd',
    env: 'development',
    banner
  },
  // runtime-only production build (Browser)
  'web-runtime-prod': {
    entry: path.resolve(__dirname, '../src/entries/web-runtime.js'),
    dest: path.resolve(__dirname, '../dist/vue.runtime.min.js'),
    format: 'umd',
    env: 'production',
    banner
  },
  // Runtime+compiler development build (Browser)
  'web-full-dev': {
    entry: path.resolve(__dirname, '../src/entries/web-runtime-with-compiler.js'),
    dest: path.resolve(__dirname, '../dist/vue.js'),
    format: 'umd',
    env: 'development',
    alias: { he: './entity-decoder' },
    banner
  },
  // Runtime+compiler production build  (Browser)
  'web-full-prod': {
    entry: path.resolve(__dirname, '../src/entries/web-runtime-with-compiler.js'),
    dest: path.resolve(__dirname, '../dist/vue.min.js'),
    format: 'umd',
    env: 'production',
    alias: { he: './entity-decoder' },
    banner
  },
  // Web compiler (CommonJS).
  'web-compiler': {
    entry: path.resolve(__dirname, '../src/entries/web-compiler.js'),
    dest: path.resolve(__dirname, '../packages/vue-template-compiler/build.js'),
    format: 'cjs',
    external: Object.keys(require('../packages/vue-template-compiler/package.json').dependencies)
  },
  // Web server renderer (CommonJS).
  'web-server-renderer': {
    entry: path.resolve(__dirname, '../src/entries/web-server-renderer.js'),
    dest: path.resolve(__dirname, '../packages/vue-server-renderer/build.js'),
    format: 'cjs',
    external: Object.keys(require('../packages/vue-server-renderer/package.json').dependencies)
  },
  // Weex runtime factory
  'weex-factory': {
    weex: true,
    entry: path.resolve(__dirname, '../src/entries/weex-factory.js'),
    dest: path.resolve(__dirname, '../packages/weex-vue-framework/factory.js'),
    format: 'cjs',
    plugins: [weexFactoryPlugin]
  },
  // Weex runtime framework (CommonJS).
  'weex-framework': {
    weex: true,
    entry: path.resolve(__dirname, '../src/entries/weex-framework.js'),
    dest: path.resolve(__dirname, '../packages/weex-vue-framework/index.js'),
    format: 'cjs'
  },
  // Weex compiler (CommonJS). Used by Weex's Webpack loader.
  'weex-compiler': {
    weex: true,
    entry: path.resolve(__dirname, '../src/entries/weex-compiler.js'),
    dest: path.resolve(__dirname, '../packages/weex-template-compiler/build.js'),
    format: 'cjs',
    external: Object.keys(require('../packages/weex-template-compiler/package.json').dependencies)
  }
}
/**
 * 
 * @param {不同环境的不同配置选线，入口，出口，环境，plugins等} opts 
 */
function genConfig (opts) {
  const config = {
    entry: opts.entry,
    dest: opts.dest,
    external: opts.external,
    format: opts.format,
    banner: opts.banner,
    moduleName: 'Vue',
    plugins: [//设置plugins
      replace({//替代对应的属性名称
        __WEEX__: !!opts.weex,
        __WEEX_VERSION__: weexVersion,
        __VERSION__: version
      }),
      flow(),
      buble(),
      alias(Object.assign({}, require('./alias'), opts.alias))
    ].concat(opts.plugins || [])
  }

  if (opts.env) {//如果指定了env,则把NODE_ENV指定为对应的值
    config.plugins.push(replace({
      'process.env.NODE_ENV': JSON.stringify(opts.env)
    }))
  }

  return config
}

//初始化不同环境的不同配置
if (process.env.TARGET) {
  module.exports = genConfig(builds[process.env.TARGET])
} else {
  exports.getBuild = name => genConfig(builds[name])
  exports.getAllBuilds = () => Object.keys(builds).map(name => genConfig(builds[name]))
}
