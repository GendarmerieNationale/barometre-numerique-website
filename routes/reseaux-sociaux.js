const express = require('express')
const router = express.Router()

const db = require('../db')

// don't forget to update the doc if you change this
const authorizedReseaux = [
    // 'facebook',
    'twitter',
    // 'linkedin',
    // 'instagram',
    'youtube',
]

// TODO: use something like this to validate input depending on the doc? https://github.com/BRIKEV/express-oas-validator

/**
 * @tags reseaux-sociaux - Réseaux sociaux
 */

/**
 * GET /api/reseaux-sociaux/n-followers-twitter
 * @tags reseaux-sociaux
 * @summary Nombre total de followers sur Twitter (somme de tous les comptes).
 * @return {object} 200 - Réponse réussie.
 * @example response - 200 - Exemple de réponse réussie
 * {
 *   "value": 837207
 * }
 */
router.get('/n-followers-twitter', (req, res, next) => {
    db
        .query("select sum(n_followers) " +
            "from reseaux_sociaux_followers " +
            "where reseau='twitter'")
        .then(result => res.send({value: result.rows[0]['sum']}))
        .catch(next)
})

/**
 * GET /api/reseaux-sociaux/n-followers-map/{reseau}
 * @tags reseaux-sociaux
 * @summary Nombre de followers par département (France métropolitaine et autres territoires), pour un réseau social en particulier.
 * @param {string} reseau.path.required - enum:facebook,twitter,linkedin - Réseau social sélectionné
 * @return {object} 200 - Réponse réussie.
 */
router.get('/n-followers-map/:reseau', (req, res, next) => {
    if (!authorizedReseaux.includes(req.params.reseau))
        throw Error(`reseau should be one of: ${authorizedReseaux}`)

    db
        .query(
            'select geo_dpt_iso, ' +
            '       geo_dpt_name, ' +
            '       page_name, ' +
            '       sum(n_followers) as n_followers ' +
            'from reseaux_sociaux_followers ' +
            'where reseau = $1 ' +
            'group by geo_dpt_iso, geo_dpt_name, page_name',
            [req.params.reseau]
        )
        .then(result => res.send(result.rows))
        .catch(next)
})

/**
 * GET /api/reseaux-sociaux/n-followers-map-detail/twitter/{geoIso}
 * @tags reseaux-sociaux
 * @summary Plus de détails sur un département ou sur les comptes nationaux, sur Twitter
 * @param {string} geoIso.path.required - Un code [ISO 3166-2:FR](https://en.wikipedia.org/wiki/ISO_3166-2:FR)
 *          pour identifier le département ou le territoire d'outre-mer
 *          Par exemple, `FR-78` pour 'Les Yvelines' ou `FR-971` pour 'Guadeloupe'. Pour les comptes nationaux,
 *          utiliser `gn`.
 * @return {object} 200 - Réponse réussie.
 */
router.get('/n-followers-map-detail/twitter/:geoIso', (req, res, next) => {
    let query = ''
    let params = []
    if (req.params.geoIso === 'gn') {
        // TODO: find a better way than this hack
        query = 'select reseau, ' +
            '       page_url, ' +
            '       page_name, ' +
            '       n_followers, ' +
            '       n_tweets ' +
            'from reseaux_sociaux_followers ' +
            'where (page_name =\'Gendarmerie nationale\' ' +
            '   or page_name = \'Gendarmerie Nationale\') ' +
            '   and reseau = \'twitter\'' +
            'order by reseau'
    } else {
        query = 'select reseau, ' +
            '       page_url, ' +
            '       page_name, ' +
            '       n_followers, ' +
            '       n_tweets ' +
            'from reseaux_sociaux_followers ' +
            'where geo_dpt_iso=$1' +
            '   and reseau = \'twitter\'' +
            'order by reseau'
        params = [req.params.geoIso]
    }
    db
        .query(query, params)
        .then(result => res.send(result.rows))
        .catch(next)
})


/**
 * GET /api/reseaux-sociaux/n-followers-not-geo/{reseau}
 * @tags reseaux-sociaux
 * @summary Nombre de followers sur les comptes nationaux, pour un réseau social choisi.
 * @param {string} reseau.path.required - enum:facebook,twitter,linkedin - Réseau social
 * @return {object} 200 - Réponse réussie
 * @example response - 200 - Exemple de réponse réussie.
 * [
 *   {
 *     "page_url": "https://twitter.com/Gendarmerie",
 *     "page_name": "Gendarmerie nationale",
 *     "n_followers": 582275
 *   },
 *   {
 *     "page_url": "https://twitter.com/PorteparoleGN",
 *     "page_name": "Porte-parole de la Gendarmerie Nationale",
 *     "n_followers": 28710
 *   },
 *   {
 *     "page_url": "https://twitter.com/GendarmeriePjgn",
 *     "page_name": "🇫🇷 PJGN",
 *     "n_followers": 4177
 *   }
 * ]
 */
router.get('/n-followers-not-geo/:reseau', (req, res, next) => {
    if (!authorizedReseaux.includes(req.params.reseau))
        throw Error(`reseau should be one of: ${authorizedReseaux}`)

    db
        .query(
            'select page_url, ' +
            '       page_name, ' +
            '       n_followers ' +
            'from reseaux_sociaux_followers ' +
            'where reseau = $1 ' +
            '  and geo_dpt_iso is null ' +
            'order by n_followers desc',
            [req.params.reseau]
        )
        .then(result => res.send(result.rows))
        .catch(next)
})


/**
 * GET /api/reseaux-sociaux/stats-yt/{pageUrl}
 * @tags reseaux-sociaux
 * @summary Statistiques pour une chaîne Youtube choisie
 * @param {string} pageUrl.path.required - URL de la chaîne
 * @return {object} 200 - Réponse réussie
 * @example response - 200 - Exemple de réponse réussie.
 * [
 *   {
 *     "page_name": "Gendarmerie nationale",
 *     "page_url": "https://www.youtube.com/channel/UCqxXM5u3U1jwrI36fSB9VuA",
 *     "n_followers": 37100,
 *     "n_videos": 381,
 *     "n_views": 5673614
 *   },
 *   {
 *     "page_name": "Pôle judiciaire de la gendarmerie nationale",
 *     "page_url": "https://www.youtube.com/channel/UCw8WjSeQmBGF4mqSpjlPwrw",
 *     "n_followers": 2523,
 *     "n_videos": 27,
 *     "n_views": 333205
 *   }
 * ]
 */
router.get('/stats-yt/:pageUrl', (req, res, next) => {
    db
        .query(
            'select page_name, ' +
            '       page_url, ' +
            '       n_followers, ' +
            '       n_videos, ' +
            '       n_views ' +
            'from youtube_followers ' +
            "where page_url=$1",
            [req.params.pageUrl]
        )
        .then(result => res.send(result.rows[0]))
        .catch(next)
})

module.exports = router
