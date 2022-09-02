'use strict'
const path = require('path')
const utils = require('./utils')
const webpack = require('webpack')
const config = require('../config')
const merge = require('webpack-merge')
const baseWebpackConfig = require('./webpack.base.conf')

const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
// 4.x新增
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { VueLoaderPlugin } = require('vue-loader')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')

const env = require('../config/prod.env')
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");
const smp = new SpeedMeasurePlugin();
const TerserPlugin = require('terser-webpack-plugin');

// 时间格式化 格式化 YYYYMMDDHHmmss
function Dateformat(date, format){ 
    var args = {         
        "M+": date.getMonth() + 1,          
        "D+": date.getDate(),          
        "H+": date.getHours(),          
        "m+": date.getMinutes(),          
        "s+": date.getSeconds(),    
    };  
    if (/(Y+)/.test(format)){
        let $1 = format.match(/(Y+)/)[0];
        format = format.replace($1, (date.getFullYear() + "").substring(4 - $1.length));
    }   
    for (var i in args) {          
        var n = args[i];          
        var reg = eval("/(" + i +")/");
        if (reg.test(format)){
            let $1 = format.match(reg)[0];
            format = format.replace($1, $1.length == 1 ? n : ("00" + n).substring(("" + n).length));
        }         
    }      
    return format;  
}
const version = Dateformat(new Date(), 'YYYYMMDDHHmmss')
const timestamp = new Date().getTime(); // 时间戳

const webpackConfig = merge(baseWebpackConfig, {
  mode:  'production',
  devtool: config.build.productionSourceMap ? config.build.devtool : false,
  output: {
    path: config.build.assetsRoot,
    filename: utils.assetsPath('js/[name].[chunkhash].js'),
    chunkFilename: utils.assetsPath('js/[id].[chunkhash].js')
  },
  optimization:{
    runtimeChunk: 'single',
    namedChunks:true, //增加模块标识
    splitChunks: {
        chunks:'all',
        minSize:0, // 最小拆分组件大小
        minChunks: 1, // 最小引用次数
        maxAsyncRequests:100, // 限制异步模块内部的并行最大请求数的
        maxInitialRequests:100, // 允许入口并行加载的最大请求数
        automaticNameDelimiter: '~', // 文件名的连接符
        automaticNameMaxLength: 30,
        name: true,
        cacheGroups: {
          vendors: {
            minChunks: 1,
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            minSize: 0,
          },
          vant: {
            name: 'chunk-vant', // split elementUI into a single package
            priority: 20, // the weight needs to be larger than libs and app or it will be packaged into libs or app
            test: /[\\/]node_modules[\\/]_?vant(.*)/ // in order to adapt to cnpm
          },
          base: {
                priority: -20, // 权重
                chunks: 'initial', //initial表示提取入口文件的公共部分
                minChunks: 1, //表示提取公共部分最少的文件数
                minSize: 0, //表示提取公共部分最小的大小
                name: 'base' //提取出来的文件命名
            }
        }
      },
      minimizer: [
        new TerserPlugin({
            parallel: true,
          }),
        new OptimizeCSSAssetsPlugin({}),
    ],
  },
  plugins: [
    // http://vuejs.github.io/vue-loader/en/workflow/production.html
    new VueLoaderPlugin(),
    // https://github.com/webpack-contrib/mini-css-extract-plugin
    new MiniCssExtractPlugin({
        filename: utils.assetsPath('css/[name].[contenthash].css'),
        chunkFilename: utils.assetsPath('css/[id].[contenthash].css'),
    }),
    new webpack.DefinePlugin({
      'process.env': env
    }),
    new webpack.HashedModuleIdsPlugin(), //模块增加标识，开发环境建议用 NamedModulePlugin

    // generate dist index.html with correct asset hash for caching.
    // you can customize output by editing /index.html
    // see https://github.com/ampedandwired/html-webpack-plugin
    new HtmlWebpackPlugin({
      filename: config.build.index,
      template: 'index.html',
      inject: true,
      hash: true,
      minify:true
    }),

    // copy custom static assets
    // see https://github.com/webpack-contrib/copy-webpack-plugin
    new CopyWebpackPlugin({
        patterns:[
            {
              from: path.resolve(__dirname, '../static'),
              to: config.build.assetsSubDirectory,
              globOptions:{
                  ignore: ['.*']
              }
            }
        ]
    })
  ]
})

if (config.build.productionGzip) {
  const CompressionWebpackPlugin = require('compression-webpack-plugin')

  webpackConfig.plugins.push(
    new CompressionWebpackPlugin({
      asset: '[path].gz[query]',
      algorithm: 'gzip',
      test: new RegExp(
        '\\.(' +
        config.build.productionGzipExtensions.join('|') +
        ')$'
      ),
      threshold: 10240,
      minRatio: 0.8
    })
  )
}

if (config.build.bundleAnalyzerReport) {
  const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
  webpackConfig.plugins.push(new BundleAnalyzerPlugin())
}

// module.exports = webpackConfig
module.exports = smp.wrap({
    ...webpackConfig
})