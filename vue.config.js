const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  pluginOptions: {
    electronBuilder: {
        builderOptions: {
            win: {
                icon: 'src/assets/icon.png'
            },
            extraResources: [
              {
                "from": "src/resources/bin",
                "to": "bin",
                "filter": [
                  "**/*"
                ]
              }
            ]
        },
        nodeIntegration: true
    }
}
})
