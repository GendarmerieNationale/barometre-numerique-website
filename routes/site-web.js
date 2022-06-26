const express = require('express')
const router = express.Router()

const db = require('../db')
const {getStartDate} = require("./utils");

const endDateStr = '2022-05-15T11:00:00.000Z';

/**
 * @tags site-web - Site grand public de la Gendarmerie Nationale
 */

/**
 * GET /api/site-web/n-visites-total
 * @tags site-web
 * @summary Nombre total de visites depuis le début de l'année
 * @param {number} year.query - Année en question (par défaut, année actuellement en cours)
 * @return {object} 200 - Réponse réussie.
 * @example response - 200 - Exemple de réponse réussie.
 * {
 * "n_visits": 579586
 * }
 */
router.get('/n-visites-total/', (req, res, next) => {
    let year = req.query.year ? req.query.year : (new Date()).getFullYear();
    db
        .query('select sum(visit_count) as n_visits ' +
            'from atinternet_visits_per_hour ' +
            'where extract(year from datetime) = $1',
            [year])
        .then(result => res.send(result.rows[0]))
        .catch(next)
})

/**
 * GET /api/site-web/n-visits-timeline/{timespan}
 * @tags site-web
 * @summary Nombre de visites par unité de temps
 *          (jour si la période sélectionnée est la semaine ou le mois,
 *          mois si la période sélectionnée est l'année)
 * @param {string} timespan.path.required - enum:day,week,month,year
 * @return {object} 200 - Réponse réussie.
 * @example response - 200 - (timespan='day') Exemple de réponse réussie.
 * [
 *   {
 *     "time_dim": "2022-04-30T22:00:00.000Z",
 *     "n_visits": 291
 *   },
 *   {
 *     "time_dim": "2022-04-30T23:00:00.000Z",
 *     "n_visits": 185
 *   }
 * ]
 * @example response - 200 - (timespan='month') Exemple de réponse réussie.
 * [
 *   {
 *     "time_dim": "2022-05-01",
 *     "n_visits": 2998
 *   }
 * ]
 */
router.get('/n-visits-timeline/:timespan', (req, res, next) => {
    let {startDate, endDate} = getStartDate(req.params.timespan, new Date(endDateStr));
    let time_sql_col = '';
    if (req.params.timespan === 'day')
        time_sql_col = 'datetime';
    else if (req.params.timespan === 'week' || req.params.timespan === 'month')
        time_sql_col = 'date';
    else if (req.params.timespan === 'year')
        time_sql_col = 'month';
    else
        throw Error('timespan should be day, week, month or year')

    db
        .query(
            `select ${time_sql_col} as time_dim, sum(visit_count) as n_visits ` +
            'from atinternet_visits_per_hour ' +
            'where $1 <= datetime and datetime < $2' +
            'group by time_dim ' +
            'order by time_dim asc',
            [startDate, endDate]
        )
        .then(result => res.send(result.rows))
        .catch(next);
})

/**
 * GET /api/site-web/n-visits-geo/ville/{timespan}
 * @tags site-web
 * @summary Nombre de visites par ville, sur la période sélectionnée
 * @param {string} maxResults.query - Nombre de villes à retourner (10 par défaut, 50 max)
 * @param {string} timespan.path.required - enum:month,year
 * @return {object} 200 - Réponse réussie.
 * @example response - 200 - Exemple de réponse réussie.
 * [
 *   {
 *     "geo_city": "Paris",
 *     "n_visits": 27305
 *   },
 *   {
 *     "geo_city": "Gent",
 *     "n_visits": 23594
 *   }
 * ]
 */
router.get('/n-visits-geo/ville/:timespan', (req, res, next) => {
    // Allow querying up to 50 results, 10 by default
    let maxResults = req.query.maxResults ? Math.min(req.query.maxResults, 50) : 10;

    let {startDate, endDate} = getStartDate(req.params.timespan, new Date(endDateStr));
    db
        .query(
            'select geo_city, sum(visit_count) as n_visits ' +
            'from atinternet_visits_per_geo_city ' +
            'where $1 <= month and month < $2 ' +
            'group by geo_city ' +
            'order by n_visits desc ' +
            'limit $3',
            [startDate, endDate, maxResults]
        )
        .then(result => res.send(result.rows))
        .catch(next);
})

/**
 * GET /api/site-web/n-visits-geo/region/{timespan}
 * @tags site-web
 * @summary Nombre de visites par région, sur la période sélectionnée
 * @param {string} maxResults.query - Nombre de pays à retourner (10 par défaut, 50 max)
 * @param {string} timespan.path.required - enum:month,year
 * @return {object} 200 - Réponse réussie. Les visites pour lesquelles la région est `null`
 *          correspondent à des visites depuis l'étranger ou pour lesquelles la localisation
 *          n'a pas été enregistrée.
 * @example response - 200 - Exemple de réponse réussie.
 * [
 *   {
 *     "geo_region_name": null,
 *     "geo_region_iso": null,
 *     "n_visits": 83894
 *   },
 *   {
 *     "geo_region_name": "Île-de-France",
 *     "geo_region_iso": "FR-IDF",
 *     "n_visits": 75033
 *   }
 * ]
 */
router.get('/n-visits-geo/region/:timespan', (req, res, next) => {
    let maxResults = req.query.maxResults ? Math.min(req.query.maxResults, 50) : 10;
    let {startDate, endDate} = getStartDate(req.params.timespan, new Date(endDateStr));
    db
        .query(
            'select geo_region_name, geo_region_iso, sum(visit_count) as n_visits ' +
            'from atinternet_visits_per_geo_region ' +
            'where $1 <= month and month < $2 ' +
            'group by geo_region_name, geo_region_iso ' +
            'order by n_visits desc ' +
            'limit $3',
            [startDate, endDate, maxResults]
        )
        .then(result => res.send(result.rows))
        .catch(next);
})

/**
 * GET /api/site-web/n-visits-geo/pays/{timespan}
 * @tags site-web
 * @summary Nombre de visites par pays, sur la période sélectionnée
 * @param {string} maxResults.query - Nombre de pays à retourner (10 par défaut, 50 max)
 * @param {string} timespan.path.required - enum:month,year
 * @return {object} 200 - Réponse réussie.
 * @example response - 200 - Exemple de réponse réussie.
 * [
 *   {
 *     "geo_country": "France",
 *     "n_visits": 306806
 *   },
 *   {
 *     "geo_country": "Belgium",
 *     "n_visits": 24843
 *   }
 * ]
 */
router.get('/n-visits-geo/pays/:timespan', (req, res, next) => {
    let maxResults = req.query.maxResults ? Math.min(req.query.maxResults, 50) : 10;
    let {startDate, endDate} = getStartDate(req.params.timespan, new Date(endDateStr));
    db
        .query(
            'select geo_country, sum(visit_count) as n_visits ' +
            'from atinternet_visits_per_geo_country ' +
            'where $1 <= month and month < $2 ' +
            'group by geo_country ' +
            'order by n_visits desc ' +
            'limit $3',
            [startDate, endDate, maxResults]
        )
        .then(result => res.send(result.rows))
        .catch(next);
})

/**
 * GET /api/site-web/n-visits-subsite/{timespan}
 * @tags site-web
 * @summary Nombre de visites par sous-site, sur la période sélectionnée
 * @param {string} maxResults.query - Nombre de lignes à retourner (10 par défaut, 50 max)
 * @param {string} timespan.path.required - enum:month,year
 * @return {object} 200 - Réponse réussie.
 * @example response - 200 - Exemple de réponse réussie.
 * [
 *   {
 *     "subsite": "recrutement",
 *     "n_visits": 334721
 *   },
 *   {
 *     "subsite": "national",
 *     "n_visits": 165854
 *   }
 * ]
 */
router.get('/n-visits-subsite/:timespan', (req, res, next) => {
    let maxResults = req.query.maxResults ? Math.min(req.query.maxResults, 50) : 10;
    let {startDate, endDate} = getStartDate(req.params.timespan, new Date(endDateStr));
    db
        .query(
            'select subsite, sum(visit_count) as n_visits ' +
            'from atinternet_visits_per_page ' +
            'where $1 <= month and month < $2 ' +
            'group by subsite ' +
            'order by n_visits desc ' +
            'limit $3',
            [startDate, endDate, maxResults]
        )
        .then(result => {
            // <HACKISH>
            for (const x of result.rows) {
                if (x.subsite === 'recrutement') {
                    x.subsite = 'Recrutement'
                } else if (x.subsite === 'national') {
                    x.subsite = 'National'
                } else if (x.subsite === 'ecoles (cegn)') {
                    x.subsite = 'Écoles (CEGN)'
                } else if (x.subsite === 'pjgn') {
                    x.subsite = 'Pôle Judiciaire (PJGN)'
                } else if (x.subsite === 'gign') {
                    x.subsite = "Groupe d'Intervention (GIGN)"
                } else if (x.subsite === 'garde republicaine') {
                    x.subsite = 'Garde Républicaine'
                } else if (x.subsite === 'eogn') {
                    x.subsite = 'École des Officiers (EOGN)'
                }
            }
            // </HACKISH>
            res.send(result.rows)
        })
        .catch(next);
})

/**
 * GET /api/site-web/n-visits-source/{timespan}
 * @tags site-web
 * @summary Nombre de visites par source de trafic, sur la période sélectionnée
 * @param {string} maxResults.query - Nombre de lignes à retourner (10 par défaut, 50 max)
 * @param {string} timespan.path.required - enum:month,year
 * @return {object} 200 - Réponse réussie.
 * @example response - 200 - Exemple de réponse réussie.
 * [
 *   {
 *     "src": "Search engines",
 *     "n_visits": 187801
 *   },
 *   {
 *     "src": "Direct traffic",
 *     "n_visits": 77233
 *   }
 * ]
 */
router.get('/n-visits-source/:timespan', (req, res, next) => {
    // todo: add src_detail ?
    let maxResults = req.query.maxResults ? Math.min(req.query.maxResults, 50) : 10;
    let {startDate, endDate} = getStartDate(req.params.timespan, new Date(endDateStr));
    db
        .query(
            'select src, sum(visit_count) as n_visits ' +
            'from atinternet_visits_per_source ' +
            'where $1 <= month and month < $2 ' +
            'group by src ' +
            'order by n_visits desc ' +
            'limit $3',
            [startDate, endDate, maxResults]
        )
        .then(result => {
            // <HACKISH>
            for (const x of result.rows) {
                if (x.src === 'Search engines') {
                    x.src = 'Moteurs de recherche'
                } else if (x.src === 'Direct traffic') {
                    x.src = 'Trafic direct'
                } else if (x.src === 'Social media') {
                    x.src = 'Réseaux sociaux'
                } else if (x.src === 'Referrer sites') {
                    x.src = 'Sites référents'
                } else if (x.src === 'Referrer sites') {
                    x.src = 'Sites référents'
                } else if (x.src === 'gie-sog-gav') {
                    x.src = 'Divers - Recrutement'
                } else if (x.src === 'Portal sites') {
                    x.src = 'Divers - Gouvernement'
                }
            }
            // </HACKISH>
            res.send(result.rows)
        })
        .catch(next);
})

/**
 * GET /api/site-web/n-visits-dispositif/device/{timespan}
 * @tags site-web
 * @summary Nombre de visites par appareil, sur la période sélectionnée (n'affiche
 *          que les entrées avec au moins 100 visites)
 * @param {string} maxResults.query - Nombre de lignes à retourner (10 par défaut, 50 max)
 * @param {string} timespan.path.required - enum:month,year
 * @return {object} 200 - Réponse réussie.
 * @example response - 200 - Exemple de réponse réussie.
 * [
 *   {
 *     "device_type": "Mobile Phone",
 *     "n_visits": 279650
 *   },
 *   {
 *     "device_type": "Desktop",
 *     "n_visits": 98836
 *   }
 * ]
 */
router.get('/n-visits-dispositif/device/:timespan', (req, res, next) => {
    let maxResults = req.query.maxResults ? Math.min(req.query.maxResults, 50) : 10;
    let {startDate, endDate} = getStartDate(req.params.timespan, new Date(endDateStr));
    db
        .query(
            'with t as (' +
            '   select device_type, sum(visit_count) as n_visits ' +
            '   from atinternet_visits_per_device ' +
            '   where $1 <= month and month < $2' +
            '   group by device_type ' +
            '   order by n_visits desc' +
            ') ' +
            'select * from t ' +
            'where n_visits >= 100 ' +
            'limit $3',
            [startDate, endDate, maxResults]
        )
        .then(result => {
            for (const x of result.rows) {
                if (x.device_type === 'Mobile Phone') {
                    x.device_type = 'Téléphone portable'
                } else if (x.device_type === 'Desktop') {
                    x.device_type = 'Ordinateur de bureau'
                } else if (x.device_type === 'Tablet') {
                    x.device_type = 'Tablette'
                } else if (x.device_type === 'TV') {
                    x.device_type = 'Télévision'
                } else if (x.device_type === 'Media Player') {
                    x.device_type = 'Lecteur multimédia'
                } else if (x.device_type === 'Games Console') {
                    x.device_type = 'Console de jeux'
                }
            }
            res.send(result.rows)
        })
        .catch(next);
})

/**
 * GET /api/site-web/n-visits-dispositif/os/{timespan}
 * @tags site-web
 * @summary Nombre de visites par OS, sur la période sélectionnée (n'affiche
 *          que les entrées avec au moins 100 visites)
 * @param {string} maxResults.query - Nombre de lignes à retourner (10 par défaut, 50 max)
 * @param {string} timespan.path.required - enum:month,year
 * @return {object} 200 - Réponse réussie.
 * @example response - 200 - Exemple de réponse réussie.
 * [
 *   {
 *     "os_group": "Android",
 *     "n_visits": 151235
 *   },
 *   {
 *     "os_group": "iOS",
 *     "n_visits": 133829
 *   }
 * ]
 */
router.get('/n-visits-dispositif/os/:timespan', (req, res, next) => {
    let maxResults = req.query.maxResults ? Math.min(req.query.maxResults, 50) : 10;
    let {startDate, endDate} = getStartDate(req.params.timespan, new Date(endDateStr));
    db
        .query(
            'with t as (' +
            '   select os_group, sum(visit_count) as n_visits ' +
            '   from atinternet_visits_per_device ' +
            '   where $1 <= month and month < $2' +
            '   group by os_group ' +
            '   order by n_visits desc' +
            ') ' +
            'select * from t ' +
            'where n_visits >= 100 ' +
            'limit $3',
            [startDate, endDate, maxResults]
        )
        .then(result => res.send(result.rows))
        .catch(next);
})

/**
 * GET /api/site-web/n-visits-dispositif/browser/{timespan}
 * @tags site-web
 * @summary Nombre de visites par navigateur, sur la période sélectionnée (n'affiche
 *          que les entrées avec au moins 100 visites)
 * @param {string} maxResults.query - Nombre de lignes à retourner (10 par défaut, 50 max)
 * @param {string} timespan.path.required - enum:month,year
 * @return {object} 200 - Réponse réussie.
 * @example response - 200 - Exemple de réponse réussie.
 * [
 *   {
 *     "browser_group": "Safari",
 *     "n_visits": 140947
 *   },
 *   {
 *     "browser_group": "Chrome Mobile",
 *     "n_visits": 139723
 *   }
 * ]
 */
router.get('/n-visits-dispositif/browser/:timespan', (req, res, next) => {
    let maxResults = req.query.maxResults ? Math.min(req.query.maxResults, 50) : 10;
    let {startDate, endDate} = getStartDate(req.params.timespan, new Date(endDateStr));
    db
        .query(
            'with t as (' +
            '   select browser_group, sum(visit_count) as n_visits ' +
            '   from atinternet_visits_per_device ' +
            '   where $1 <= month and month < $2' +
            '   group by browser_group ' +
            '   order by n_visits desc' +
            ') ' +
            'select * from t ' +
            'where n_visits >= 100 ' +
            'limit $3',
            [startDate, endDate, maxResults]
        )
        .then(result => res.send(result.rows))
        .catch(next);
})


module.exports = router
