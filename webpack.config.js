const VueLoaderPlugin = require("vue-loader/lib/plugin");

module.exports = {
  mode: 'development',

  entry: {
    'hoge': './hoge.ts',
  },

  output: {
    path: `${__dirname}/dist`,
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: "vue-loader",
      },
      {
        test: /\.ts$/,
        use: 'ts-loader'
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      vue$: "vue/dist/vue.esm.js",
    },
  },
  watchOptions: {
      poll: 1000
  },
  plugins: [new VueLoaderPlugin()],
};