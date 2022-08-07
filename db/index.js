const path = require('path');
const { Client } = require('pg');

require('dotenv').config({ path: path.resolve('..', '.env')});

const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
});


module.exports = client;