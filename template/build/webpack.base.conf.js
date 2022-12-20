'use strict'
const path = require('path')
const utils = require('./utils')
const config = require('../config')
const vueLoaderConfig = require('./vue-loader.conf')

// 4.x新增
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

function resolve (dir) {
  return path.join(__dirname, '..', dir)
}

// 优化（threadLoader）
const threadLoader = require('thread-loader');
const jsWorkerPool = {
  // 产生的 worker 的数量，默认是 (cpu 核心数 - 1)
  // 当 require('os').cpus() 是 undefined 时，则为 1
  workers: 2,
  // 闲置时定时删除 worker 进程
  // 默认为 500ms
  // 可以设置为无穷大， 这样在监视模式(--watch)下可以保持 worker 持续存在
  poolTimeout: 2000
}
const cssWorkerPool = {
    // 一个 worker 进程中并行执行工作的数量
    // 默认为 20
    workerParallelJobs: 2,
    poolTimeout: 2000
};
threadLoader.warmup(jsWorkerPool, ['babel-loader']);
threadLoader.warmup(cssWorkerPool, ['css-loader', 'postcss-loader', 'sass-loader']);


module.exports = {
//   context: path.resolve(__dirname, '../'),
  mode:process.env.NODE_ENV === 'production'?'production':'development',
  entry:  path.resolve(__dirname, '../src/main.js'),
  output: {
    path: config.build.assetsRoot,
    filename: '[name].js',
    publicPath: process.env.NODE_ENV === 'production'
      ? config.build.assetsPublicPath
      : config.dev.assetsPublicPath
  },
  resolve: {
    // 设置模块导入规则，import/require时会直接在这些目录找文件
    // 可以指明存放第三方模块的绝对路径，以减少寻找
    modules: [
        path.resolve(__dirname, '../src/components'), 
        path.resolve(__dirname, '../src/config'), 
        'node_modules'
    ],
    extensions: ['.js', '.vue', '.json'],
    alias: {
      'vue$': 'vue/dist/vue.esm.js',
      '@': resolve('src'),
    }
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        // options: vueLoaderConfig
      },
      {
        test: /\.js$/,
        use: [
            {
                loader: 'thread-loader',
                options: jsWorkerPool
            },
            'babel-loader',
        ],
        // node_modules 目录下的文件都是采用的 ES5 语法，没必要再通过 Babel 去转换
        exclude: /node_modules/
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        use:[
            // 'cache-loader',
            {
                loader: 'url-loader',
                options: {
                    limit: 10000,
                    name: utils.assetsPath('img/[name].[hash:7].[ext]')
                }
            }
        ],
        include: path.resolve(__dirname, '../src/assets'),
        
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: utils.assetsPath('media/[name].[hash:7].[ext]')
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: utils.assetsPath('fonts/[name].[hash:7].[ext]')
        }
      },
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          process.env.NODE_ENV === "development"?"vue-style-loader" :{
            loader:MiniCssExtractPlugin.loader,
            options: {
                /** 配置除css以外的公共访问路径,从css文件夹里面访问其他资源
                 * build
                    ├── index.html
                    └── static
                        ├── css
                        ├── img
                        └── js
                 */
                publicPath: "../../",
            },
          },
          {
            loader: 'thread-loader',
            options: cssWorkerPool
          },
          "css-loader",
          "postcss-loader",
          {
            loader:'px2rem-loader',
            options:{
                remUnit: 37.5 
            }
        },
          "sass-loader",
        ],
      },
    ]
  },
  node: {
    // prevent webpack from injecting useless setImmediate polyfill because Vue
    // source contains it (although only uses it if it's native).
    setImmediate: false,
    // prevent webpack from injecting mocks to Node native modules
    // that does not make sense for the client
    dgram: 'empty',
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
    child_process: 'empty'
  }
}
