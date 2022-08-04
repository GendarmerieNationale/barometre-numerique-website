require('dotenv').config()

const config = {
    CACHE_CONTROL_MAX_AGE: process.env.CACHE_CONTROL_MAX_AGE || 60,
    APP_OFFLINE: process.env.APP_OFFLINE ? (process.env.APP_OFFLINE === 'true') : false,
    APP_USERNAME: process.env.APP_USERNAME || 'user',
    APP_PASSWORD: process.env.APP_PASSWORD || '',
    PORT: process.env.PORT || 3000,
    POSTGRES_USER: process.env.POSTGRES_USER || 'barnum_api',
    POSTGRES_PORT: process.env.POSTGRES_PORT || 5432,
    POSTGRES_HOST: process.env.POSTGRES_HOST || 'localhost',
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
}

module.exports = config;