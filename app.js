const config = require('./config.js')
const express = require('express')
const app = express()

const api = require('./routes/api')

app.set('view engine', 'pug')

if (config.APP_PASSWORD !== '') {
  // Authenticator
  app.use(function (req, res, next) {
    let auth;

    if (req.headers.authorization) {
      auth = new Buffer(req.headers.authorization.substring(6), 'base64').toString().split(':');
    }

    if (!auth || auth[0] !== config.APP_USERNAME || auth[1] !== config.APP_PASSWORD) {
      res.statusCode = 401;
      res.setHeader('WWW-Authenticate', 'Basic realm="MyRealmName"');
      res.end('Unauthorized');
    } else {
      next();
    }
  });
}

// todo: move all static files behind a '/static' root ?
app.use(express.static('public'))

if (config.APP_OFFLINE) {
    app.use((req, res, next) => {
        res
            .status(503)
            .render('offline', {title: 'Le Baromètre Numérique - Gendarmerie Nationale'});
    })
}

// todo: move in a separate file in routes + separate routes in api/frontend
app.get(['/','/ma-gendarmerie'], function (req, res) {
  res.render('ma-gendarmerie', {
    title: 'Le Baromètre Numérique - Gendarmerie Nationale',
    pageId: 'ma-gendarmerie',
    },
  )
})

app.get('/perceval', function (req, res) {
  res.render('perceval', {
    title: 'Le Baromètre Numérique - Gendarmerie Nationale',
    pageId: 'perceval'
    }
  )
})

app.get('/pre-plainte-en-ligne', function (req, res) {
  res.render('pre-plainte-en-ligne', {
    title: 'Le Baromètre Numérique - Gendarmerie Nationale',
    pageId: 'pre-plainte-en-ligne'
    }
  )
})

app.get('/recrutement', function (req, res) {
  res.render('recrutement', {
    title: 'Le Baromètre Numérique - Gendarmerie Nationale',
    pageId: 'recrutement'
    }
  )
})

app.get('/site-web', function (req, res) {
  res.render('site-web', {
    title: 'Le Baromètre Numérique - Gendarmerie Nationale',
    pageId: 'site-web'
    }
  )
})

app.get('/service-public-plus', function (req, res) {
  res.render('service-public-plus', {
    title: 'Le Baromètre Numérique - Gendarmerie Nationale',
    pageId: 'service-public-plus'
    }
  )
})

app.get('/reseaux-sociaux', function (req, res) {
  res.render('reseaux-sociaux', {
    title: 'Le Baromètre Numérique - Gendarmerie Nationale',
    pageId: 'reseaux-sociaux'
    }
  )
})

app.get('/iggn', function (req, res) {
  res.render('iggn', {
    title: 'Le Baromètre Numérique - Gendarmerie Nationale',
    pageId: 'iggn'
    }
  )
})

app.get('/a-propos', function (req, res) {
  res.render('a-propos', {
    title: 'Le Baromètre Numérique - Gendarmerie Nationale',
    pageId: 'a-propos'
    }
  )
})

app.get('/accessibilite', function (req, res) {
  res.render('accessibilite', {
    title: 'Le Baromètre Numérique - Gendarmerie Nationale',
    pageId: 'accessibilite',
    }
  )
})

app.get('/sitemap', function (req, res) {
  res.render('sitemap', {
    title: 'Le Baromètre Numérique - Gendarmerie Nationale',
    pageId: 'sitemap',
    }
  )
})

app.get('/information-donnees', function (req, res) {
  res.render('information-donnees', {
    title: 'Le Baromètre Numérique - Gendarmerie Nationale',
    pageId: 'information-donnees',
    }
  )
})

app.use('/api', api)

app.use((req, res, next) => {
    res.status(404);
    if (req.accepts('html')) {
        res.render('404', {
          title: 'Le Baromètre Numérique - Gendarmerie Nationale',
          pageId: '404',
        });
        return;
    }
    if (req.accepts('json')) {
        res.json({error: 'Not found'});
        return;
    }
    res.type('txt').send('Not found');
})

app.listen(config.PORT, () => {
  console.log(`Example app listening on port ${config.PORT}`)
})

