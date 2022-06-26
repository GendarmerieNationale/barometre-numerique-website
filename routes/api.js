const express = require('express')
const router = express.Router()
const expressJSDocSwagger = require('express-jsdoc-swagger');

const maGendarmerie = require('./ma-gendarmerie')
const perceval = require('./perceval')
const preplainteEnLigne = require('./pre-plainte-en-ligne')
const siteWeb = require('./site-web')
const recrutement = require('./recrutement')
const reseauxSociaux = require('./reseaux-sociaux')
const servicePublicPlus = require('./service-public-plus')
const iggn = require('./iggn')

// Set-up OpenAPI doc
const options = {
    info: {
        title: "Le Baromètre Numérique - API",
        version: "0.1.0",
        description:
            "Une simple API pour accéder aux données d'utilisation des services numériques de la Gendarmerie.\n" +
            "⚠️ en cours de développement (il manque encore de nombreux 'endpoints', et ceux-ci sont susceptibles de changer sans préavis)",
        license: {
            name: "Apache 2.0",
            url: "https://www.apache.org/licenses/LICENSE-2.0.html",
        },
        contact: {
            // todo: update with correct name and url
            name: "Alexandre",
            url: "",
            email: "cyberimpact@gendarmerie.interieur.gouv.fr",
        },
    },
    baseDir: __dirname,
    filesPattern: './**/*.js',
    // URL where SwaggerUI will be rendered
    swaggerUIPath: '/docs',
    // Expose OpenAPI UI
    exposeSwaggerUI: true,
    // Expose Open API JSON Docs documentation in `apiDocsPath` path.
    exposeApiDocs: false,
    // Open API JSON Docs endpoint.
    apiDocsPath: '/v3/docs',
    // Set non-required fields as nullable by default
    notRequiredAsNullable: false,
};

expressJSDocSwagger(router)(options);

router.use('/ma-gendarmerie', maGendarmerie)
router.use('/perceval', perceval)
router.use('/pre-plainte-en-ligne', preplainteEnLigne)
router.use('/site-web', siteWeb)
router.use('/site-web/recrutement', recrutement)
router.use('/reseaux-sociaux', reseauxSociaux)
router.use('/service-public-plus', servicePublicPlus)
router.use('/iggn', iggn)

module.exports = router
