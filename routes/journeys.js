const express = require('express');
const journeyRouter = express.Router();
const journeyService = require('../services/journeys.js');
const paginate = require('../middlewares/paginate');


journeyRouter.get('/journeys', paginate('journey'), async (req, res, next) => {
    try {
        const { keyword = '', limit = 5, page = 1 } = req.query;
        return res.status(200).json(req.paginatedResults);
    } catch (error) {
        console.log(error);
        return res.status(500).end();
    }
});

journeyRouter.get('/journeys/:id', async (req, res, next) => {
    try {
        const journey = await journeyService.getById(req.params.id);
        if (journey) return res.status(200).json(journey);
        return res.status(404).end();
    } catch (error) {
        console.log(error);
        return res.status(500).end();
    }
})

module.exports = journeyRouter;
