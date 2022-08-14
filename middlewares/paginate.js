const stationService = require('../services/stations');
const journeyService = require('../services/journeys');

const pagination = (model) => {
    let service;
    switch (model) {
        case 'station':
            service = stationService;
            break;
        case 'journey':
            service = journeyService;
            break;
    }

    return async (req, res, next) => {
        try {
            const { page = 1, limit = 10 } = req.query;
            const count = await service.getCount({ ...req.query, page, limit });
            if (page <= 0 || (page - 1) * limit > count) return res.status(400).end();

            const paginatedResults = {};

            if (page * limit < count) {
                nextPage = parseInt(page) + 1;
                paginatedResults.next = nextPage;
            }

            if (page * limit > limit) {
                previous = page - 1;
                paginatedResults.previous = previous;
            }

            const results = await service.getAll({ ...req.query, page, limit });
            paginatedResults.results = results;
            paginatedResults.count = count;
            paginatedResults.last = Math.ceil(count / limit);
            req.paginatedResults = paginatedResults;
            next();

        } catch (error) {
            console.log(error);
            res.status(500).end();
        }
    }
}


module.exports = pagination;
