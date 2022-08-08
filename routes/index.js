const stationRouter = require('./stations');
const journeyRouter = require('./journeys');


module.exports = {
    apiRouter: [stationRouter, journeyRouter]
}
