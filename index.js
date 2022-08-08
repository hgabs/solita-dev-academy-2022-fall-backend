require('dotenv').config();
const express = require('express');
const app = express();
const morgan = require('morgan');
const { PORT } = require('./config');


app.use(morgan('tiny'));

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}\n`);
});
