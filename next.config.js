const permalinks = require('./permalinks.json');

module.exports = {
    basePath: process.env.BASE_PATH,
    async exportPathMap(defaultPathMap) {
        return { ...defaultPathMap, ...permalinks };
    }
}
