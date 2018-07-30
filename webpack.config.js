const path = require('path')
const { RawSource } = require('webpack-sources')

function ExportAsString (options) {
  this.options = options
}

ExportAsString.prototype.apply = function (compiler) {
  compiler.hooks.compilation.tap({ name: 'ExportAsString' }, (compilation) => {
    compilation.hooks.optimizeChunkAssets.tapAsync({ name: 'ExportAsString' }, (chunks, done) => {
      for (const chunk of chunks) {
        for (const fileName of chunk.files) {
          let source = compilation.assets[fileName].source()

          source = source.replace(/\\/g, '\\\\')
          source = source.replace(/"/g, '\\"')
          source = source.replace(/\t/g, '\\t')
          source = source.replace(/\r/g, '\\r')
          source = source.replace(/\n/g, '\\n')

          compilation.assets[fileName] = new RawSource(`module.exports = "${source}"`)
        }
      }

      done()
    })
  })
}

module.exports = {
  mode: 'production',
  entry: path.join(__dirname, 'worker.js'),
  output: {
    path: __dirname,
    filename: 'compiled.js'
  },
  optimization: {
    minimize: false
  },
  plugins: [
    new ExportAsString()
  ],
  externals: {
    'react-native': 'window.ReactNativeShim'
  }
}
