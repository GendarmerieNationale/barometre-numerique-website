const config = require('../config.js')
const {Pool, types} = require('pg')
const parseTimestampTz = require('postgres-date')

function parseTimestamp(value) {
    /**
     * Parse a postgres timestamp (without timezone) into a UTC Javascript Date object.
     * @param {string} value - Postgres timestamp, (ex: '2022-05-15 01:00:00')
     * @returns {Date} the same timestamp, interpreted as UTC time (ex: Date '2022-05-15T01:00:00.000Z')
     */
    //    todo: add unit tests for this fct
    const utc = value + 'Z'
    return parseTimestampTz(utc)
}

// https://github.com/brianc/node-pg-types
types.setTypeParser(types.builtins.NUMERIC, parseFloat);
types.setTypeParser(types.builtins.INT8, val => parseInt(val, 10));
types.setTypeParser(types.builtins.TIMESTAMP, parseTimestamp);
// 2. and for dates? use string as it is ('YYYY-MM-DD') ?
//   or convert directly to UTC here ? cf https://stackoverflow.com/a/55571869/12662410
// https://github.com/brianc/node-postgres/issues/1844#issuecomment-862436757
// todo: figure this out
types.setTypeParser(types.builtins.DATE, val => val);

const pool = new Pool({
    user: config.POSTGRES_USER,
    password: config.POSTGRES_PASSWORD,
    host: config.POSTGRES_HOST,
    port: config.POSTGRES_PORT,
    database: 'cyberimpact_dwh',
})

// For the time of this connection, use tables from the 'analytics' schema
// (instead of the default 'public')
pool.on('connect', client => {
    client.query(`SET search_path TO analytics`);
})

module.exports = {
    query: (text, params) => pool.query(text, params),
}