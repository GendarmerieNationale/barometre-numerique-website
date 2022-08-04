const express = require('express')
const router = express.Router()

const db = require('../db')
const {getBetweenHour} = require("./utils");


/**
 * @tags site-web - Site grand public de la GN. TODO: fix timezone issues! date selection are wrong
 */


/**
 * GET /api/site-web/recrutement/n-visits-total
 * @tags site-web
 * @summary Nombre de visites totales sur le sous-site de recrutement de la GN, depuis le début de l'année.
 * @return {object} 200 - Réponse réussie
 * @example response - 200 - Exemple de réponse réussie
 * {
 *   "visit_count": 334721
 * }
 */
router.get('/n-visits-total', (req, res, next) => {
    let year = req.query.year ? req.query.year : (new Date()).getFullYear();
    db
        .query('select sum(visit_count) as visit_count ' +
            'from atinternet_visits_per_subsite ' +
            'where subsite=\'recrutement\' and extract(year from month) = $1',
            [year])
        .then(result => res.send(result.rows[0]))
        .catch(next)
})

/**
 * GET /api/site-web/recrutement/fiches-metier/{start_date}/{end_date}
 * @tags site-web
 * @summary Nombre de visites par fiche métier, sur la période sélectionnée. Cela concerne uniquement les pages
 *            de l'onglet 'Découvrir nos métiers' sur le site Gendarmerie.
 * @param {string} start_date.path.required - Date de début de la période sélectionnée au format YYYY-MM-DD.
 * @param {string} end_date.path.required - Date de fin de la période sélectionnée au format YYYY-MM-DD.
 * @param {string} maxResults.query - Nombre de lignes à retourner (10 par défaut, 50 max)
 * @return {object} 200 - Réponse réussie
 * @example response - 200 - Exemple de réponse réussie
 * [
 *   {
 *     "metier_name": "gendarme dans un psig",
 *     "n_visits": 3110
 *   },
 *   {
 *     "metier_name": "gendarme au sein du gign",
 *     "n_visits": 2883
 *   },
 *   {
 *     "metier_name": "gendarme mobile",
 *     "n_visits": 2400
 *   }
 * ]
 */
router.get('/fiches-metier/:start_date/:end_date', (req, res, next) => {
    let startDate = req.params.start_date;
    let endDate = req.params.end_date;
    let maxResults = req.query.maxResults ? Math.min(req.query.maxResults, 50) : 10;

    db
        .query(
            'select metier_name, sum(visit_count) as n_visits ' +
            'from recrutement_visits_per_metier ' +
            'where $1  <= month and month < $2' +
            'group by metier_name ' +
            'order by n_visits desc ' +
            'limit $3',
            [startDate, endDate, maxResults]
        )
        .then(result => res.send(result.rows))
        .catch(next);
})


/**
 * GET /api/site-web/recrutement/n-visits-timeline/{start_date}/{end_date}
 * @tags site-web
 * @summary Nombre de visites par unité de temps, sur la période sélectionnée. Cela concerne toutes les pages du
 *      sous-site de recrutement.
 * @param {string} start_date.path.required - Date de début de la période sélectionnée au format YYYY-MM-DD.
 * @param {string} end_date.path.required - Date de fin de la période sélectionnée au format YYYY-MM-DD.
 * @return {object} 200 - Réponse réussie
 * @example response - 200 - Exemple de réponse réussie
 * [
 *  {
 *     "time_dim": "2022-05-01T00:00:00.000Z",
 *     "visit_count": 47
 *   },
 *   {
 *     "time_dim": "2022-05-01T01:00:00.000Z",
 *     "visit_count": 27
 *   },
 *   {
 *     "time_dim": "2022-05-01T02:00:00.000Z",
 *     "visit_count": 29
 *   }
 * ]
 */
router.get('/n-visits-timeline/:start_date/:end_date', (req, res, next) => {
    let startDate = req.params.start_date;
    let endDate = req.params.end_date;
    let timeDim = getBetweenHour(startDate, endDate);
    console.log(timeDim);
    db
        .query(
            `select date_trunc($3, datetime) as time_dim, ` +
            'sum(visit_count) as visit_count ' +
            'from atinternet_visits_per_hour ' +
            'where subsite=\'recrutement\' and $1 <= datetime and datetime < $2 ' +
            'group by time_dim ' +
            'order by time_dim asc',
            [startDate, endDate, timeDim]
        )
        .then(result => res.send(result.rows))
        .catch(next);
})

/**
 * GET /api/site-web/recrutement/effectifs/{year}
 * @tags site-web
 * @summary Effectifs totaux de la Gendarmerie Nationale à la fin de l'année choisie,
 *      par genre (homme/femme) et par statut (militaire/civil).
 * @param {number} year.path.required - Année choisie
 * @return {object} 200 - Réponse réussie.
 *      Effectif total en gestion au 31/12 de l'année considérée, y compris
 *      personnes en position de “non-activité” et personnes “détachées” (dont les élèves).
 *
 *      Source: DGGN/DPMGN/SDPRH/BAA
 * @example response - 200 - Exemple de réponse réussie.
 * [
 *   {
 *     "genre": "femme",
 *     "statut": "militaire",
 *     "effectifs": 20202
 *   },
 *   {
 *     "genre": "homme",
 *     "statut": "militaire",
 *     "effectifs": 80269
 *   },
 *   {
 *     "genre": "homme",
 *     "statut": "civil",
 *     "effectifs": 2134
 *   },
 *   {
 *     "genre": "femme",
 *     "statut": "civil",
 *     "effectifs": 2544
 *   }
 * ]
 */
router.get('/effectifs/:year', (req, res, next) => {
    db
        .query(
            'select genre, type_personnel as statut, sum(effectifs) as effectifs ' +
            'from iggn_effectifs_clean ' +
            'where annee=$1 ' +
            'group by genre, statut',
            [req.params.year]
        )
        .then(result => res.send(result.rows))
        .catch(next);
})

/**
 * GET /api/site-web/recrutement/effectifs-categorie/{year}
 * @tags site-web
 * @summary Effectifs totaux de la Gendarmerie Nationale à la fin de l'année choisie,
 *      par genre (homme/femme), par statut (militaire/civil) et par catégorie
 *      (Officier, Sous-officier, Gendarme adjoint volontaire, etc).
 * @param {number} year.path.required - Année choisie
 * @return {object} 200 - Réponse réussie.
 *      Effectif total en gestion au 31/12 de l'année considérée, y compris
 *      personnes en position de “non-activité” et personnes “détachées” (dont les élèves).
 *
 *      Source: DGGN/DPMGN/SDPRH/BAA
 * @example response - 200 - Exemple de réponse réussie
 * [
 *   {
 *     "genre": "homme",
 *     "statut": "militaire",
 *     "categorie": "Gendarme adjoint volontaire",
 *     "effectifs": 9011
 *   },
 *   {
 *     "genre": "femme",
 *     "statut": "militaire",
 *     "categorie": "Sous-officier du corps de soutien technique et administratif de la gendarmerie",
 *     "effectifs": 3202
 *   },
 *   {
 *     "genre": "femme",
 *     "statut": "civil",
 *     "categorie": "Personnel civil",
 *     "effectifs": null
 *   }
 * ]
 */
router.get('/effectifs-categorie/:year', (req, res, next) => {
    db
        .query(
            'select genre, type_personnel as statut, categorie, sum(effectifs) as effectifs ' +
            'from iggn_effectifs_clean ' +
            'where annee=$1 ' +
            'group by genre, statut, categorie',
            [req.params.year]
        )
        .then(result => res.send(result.rows))
        .catch(next);
})

module.exports = router
