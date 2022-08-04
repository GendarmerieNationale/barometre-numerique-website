const express = require('express')
const router = express.Router()

const db = require('../db')
const {getBetweenDate} = require("./utils");

/**
 * @tags pre-plainte-en-ligne - Plateforme de préplainte en ligne
 */


/**
 * GET /api/pre-plainte-en-ligne/n-preplaintes-total
 * @tags pre-plainte-en-ligne
 * @summary Nombre total de préplaintes effectuées sur la plateforme,
 *  depuis son lancement début 2013.
 * @return {object} 200 - Réponse réussie.
 * @example response - 200 - Exemple de réponse réussie.
 * {
 *   "n_preplaintes_total": 579586
 * }
 */
router.get('/n-preplaintes-total', (req, res, next) => {
    db
        .query('select sum(n_preplaintes) as n_preplaintes_total from ppel_daily')
        .then(result => res.send(result.rows[0]))
        .catch(next)
})

/**
 * GET /api/pre-plainte-en-ligne/preplaintes-timeline/{start_date}/{end_date}
 * @tags pre-plainte-en-ligne
 * @summary Nombre de préplaintes déposées par unité de temps
 *          (jour si la période sélectionnée est la semaine ou le mois,
 *          mois si la période sélectionnée est l'année)
 * @param {string} start_date.path.required - Date de début de la période sélectionnée au format YYYY-MM-DD.
 * @param {string} end_date.path.required - Date de fin de la période sélectionnée au format YYYY-MM-DD.
 * @return {object} 200 - Réponse réussie.
 * @example response - 200 - Exemple de réponse réussie.
 * [
 *   {
 *     "time_dim": "2021-11-24",
 *     "n_preplaintes": 530
 *   },
 *   {
 *     "time_dim": "2021-11-25",
 *     "n_preplaintes": 506
 *   },
 *   {
 *     "time_dim": "2021-11-26",
 *     "n_preplaintes": 477
 *   }
 * ]
 */
// todo: fix request with timespan=year
router.get('/preplaintes-timeline/:start_date/:end_date', (req, res, next) => {
    let time_sql_col = getBetweenDate(req.params.start_date, req.params.end_date);
    let startDate = req.params.start_date;
    let endDate = req.params.end_date;

    db
        .query(
            `select ${time_sql_col} as time_dim, ` +
            'sum(n_preplaintes) as n_preplaintes ' +
            'from ppel_daily ' +
            'where $1 <= date and date < $2' +
            'group by time_dim ' +
            'order by time_dim asc',
            [startDate, endDate]
        )
        .then(result => res.send(result.rows))
        .catch(next)
})

/**
 * GET /api/pre-plainte-en-ligne/duree-moyenne
 * @tags pre-plainte-en-ligne
 * @summary Durée moyenne pour effectuer la déclaration en ligne
 * @return {object} 200 - Réponse réussie.
 * @example response - 200 - Exemple de réponse réussie.
 * {
 *   "duree_moyenne": {
 *     "minutes": 7,
 *     "seconds": 32,
 *     "milliseconds": 270.833
 *   }
 * }
 */
router.get('/duree-moyenne', (req, res, next) => {
    db
        .query('select avg(duree_moy) as duree_moyenne from ppel_person_type')
        .then(result => res.send(result.rows[0]))
        .catch(next)
})

/**
 * GET /api/pre-plainte-en-ligne/person-type/{start_date}/{end_date}
 * @tags pre-plainte-en-ligne
 * @summary Nombre de préplaintes déposées par type de personne : personne morale ou physique
 * @param {string} start_date.path.required - Date de début de la période sélectionnée au format YYYY-MM-DD.
 * @param {string} end_date.path.required - Date de fin de la période sélectionnée au format YYYY-MM-DD. 
 * @return {object} 200 - Réponse réussie.
 * @example response - 200 - Exemple de réponse réussie.
 * [
 *   {
 *     "type_personne": "morale",
 *     "n_preplaintes": 107
 *   },
 *   {
 *     "type_personne": "physique",
 *     "n_preplaintes": 991
 *   }
 * ]
 */
router.get('/person-type/:start_date/:end_date', (req, res, next) => {
    let startDate = req.params.start_date;
    let endDate = req.params.end_date;

    db
        .query(
            'select type_personne, sum(n_preplaintes) as n_preplaintes ' +
            'from ppel_person_type ' +
            'where $1 <= month and month < $2 ' +
            'group by type_personne ' +
            'order by n_preplaintes desc',
            [startDate, endDate]
        )
        .then(result => res.send(result.rows))
        .catch(next);
})

/**
 * GET /api/pre-plainte-en-ligne/map
 * @tags pre-plainte-en-ligne
 * @summary Origine géographique des préplaintes effectuées.
 * @return {object} 200 - Réponse réussie.
 * @example response - 200 - Exemple de réponse réussie.
 * [
 *   {
 *     "dpt_code": "33",
 *     "geo_dpt_iso": "FR-33",
 *     "geo_dpt_name": "Gironde",
 *     "n_preplaintes": 96
 *   },
 *   {
 *     "dpt_code": "44",
 *     "geo_dpt_iso": "FR-44",
 *     "geo_dpt_name": "Loire-Atlantique",
 *     "n_preplaintes": 53
 *   },
 *   {
 *     "dpt_code": "31",
 *     "geo_dpt_iso": "FR-31",
 *     "geo_dpt_name": "Haute-Garonne",
 *     "n_preplaintes": 44
 *   }
 * ]
 */
 router.get('/map', (req, res, next) => {
    db
        .query(
            'select dpt_code, geo_dpt_iso, ' +
            'geo_dpt_name, sum(n_preplaintes) as n_preplaintes ' +
            'from ppel_geo ' +
            'group by dpt_code, geo_dpt_iso, geo_dpt_name ' +
            'order by n_preplaintes desc',
        )
        .then(result => res.send(result.rows))
        .catch(next);
})

/**
 * GET /api/pre-plainte-en-ligne/map-detail/{geoIso}
 * @tags pre-plainte-en-ligne
 * @summary Nombre de préplaintes dans un département choisi
 * @param {string} geoIso.path.required - Un code [ISO 3166-2:FR](https://en.wikipedia.org/wiki/ISO_3166-2:FR)
 *          pour identifier le département ou le territoire d'outre-mer
 *          Par exemple, `FR-78` pour 'Les Yvelines' ou `FR-971` pour 'Guadeloupe'. Pour les comptes nationaux,
 *          utiliser `gn`.
 * @return {object} 200 - Réponse réussie.
 * @example response - 200 - Exemple de réponse réussie.
 */
 router.get('/map-detail/:geoIso', (req, res, next) => {
    let query = '';
    let params = [];
    if (req.params.geoIso === 'gn') {
        query = 'select sum(n_preplaintes) as n_preplaintes ' +
            'from ppel_geo ';
    } else {
        query = 'select dpt_code, geo_dpt_iso, ' +
            'geo_dpt_name, sum(n_preplaintes) as n_preplaintes ' +
            'from ppel_geo ' +
            'where geo_dpt_iso = $1 ' +
            'group by dpt_code, geo_dpt_iso, geo_dpt_name ';
        params = [req.params.geoIso];
    }

    db
        .query(query, params)
        .then(result => res.send(result.rowCount > 0 ? result.rows[0] : {}))
        .catch(next);
})

module.exports = router
