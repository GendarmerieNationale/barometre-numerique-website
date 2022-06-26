# Le Baromètre Numérique (Site Web)

Front-end et back-end (API) du « Baromètre Numérique », plateforme de transparence des services numériques de la Gendarmerie Nationale.

Accessible à l'adresse: https://www.gendarmerie.interieur.gouv.fr/barometre-numerique/

**⚠️ Version Bêta** : Le site, le code source et sa documentation sont encore en phase de développement.

## Installer et lancer l'application (développement)
Il faut installer [node `v14` and npm](https://docs.npmjs.com/cli/v8/configuring-npm/install). Un gestionnaire de version 
comme [nvm](https://github.com/creationix/nvm) peut être utile. En particulier, l'application a été testée 
avec node `v14.18.1` and npm `6.14.15`.

Il faut ensuite créer le fichier `.env` avec les variables d'environnement ci-dessous, notamment pour permettre à l'API de se connecter à 
la base de données `cyberimpact_dwh` (soit locale, soit sur un serveur de développement).

Pour lancer l'application :
```
npm ci
npm start
```

## Installer et déployer l'application
Pour l'installation:
- Avoir node et npm installés
- Cloner le repo
- Créer/copier le fichier `.env` (cf variables d'environnement ci-dessous)
- Lancer l'application avec [pm2](https://www.npmjs.com/package/pm2) par exemple :
```
# Installer pm2
npm install pm2 -g

# Lancer l'application avec le nom 'barnum'
NODE_ENV=production pm2 start --name barnum app.js

# Regarder les logs
pm2 logs

# Mettre à jour l'application
git pull
NODE_ENV=production pm2 restart barnum
```

## Reverse proxy nginx et intégration à un autre site
Il est possible d'intégrer le Baromètre Numérique en tant que "sous-site" à un site existant.
Le fichier `nginx.conf` donne un exemple de configuration pour rediriger tout le trafic concerné (ex: URLs 
commençant par https://www.gendarmerie.interieur.gouv.fr/barometre-numerique/) vers l'application.

Pour le tester :
```
docker compose up -d
```
Et le site devrait être accessible à l'adresse http://localhost/barometre-numerique/

Au niveau du front-end (HTML, JS), attention à utiliser des URLs relatives et non pas absolues
(ex: `href="a-propos"` et non pas `href="/a-propos")`, pour permettre au site de fonctionner quel que soit l'URL de 
base du site (http://localhost:8090/ ou https://www.gendarmerie.interieur.gouv.fr/barometre-numerique/)

## Documentation des variables d'environnement
Les variables d'environnement sont chargées dans `config.js` et peuvent être définies dans un fichier `.env` à la 
racine du projet, SAUF pour la variable `NODE_ENV` qui
[doit être définie via l'_unit file_ systemd](https://expressjs.com/en/advanced/best-practice-performance.html#set-node_env-to-production).
En plus des optimisations faites par expressJS (meilleure performance, erreurs moins verbeuses), en mode `NODE_ENV=production` 
l'application active l'authentification.

| Variable            | Valeur par défaut | Description                                                                                                        | 
|---------------------|-------------------|--------------------------------------------------------------------------------------------------------------------|
| `NODE_ENV`          | Vide              | Sur le serveur de prod, mettre `production` (à spécifier dans la commande pour démarrer l'app, pas dans le `.env`) |
| `APP_OFFLINE`       | false             | Mettre à 'true' pour mettre l'app hors service et n'afficher qu'une page de maintenance.                           |
| `APP_PASSWORD`      | Vide              | Le mot de passe qui "protège" l'app (dev et/ou preprod). Par défaut, pas de mot de passe.                          |
| `APP_USERNAME`      | `user`            | Le nom de l'utilisateur allant avec le mot de passe (s'il y en a un).                                              |
| `PORT`              | `3000`            | Port sur lequel l'application sera hébergée                                                                        |
| `POSTGRES_HOST`     | `localhost`       | Hôte de la base de données Postgres `cyberimpact_dwh`                                                              |
| `POSTGRES_PORT`     | `5432`            | Port de la base de données                                                                                         |
| `POSTGRES_USER`     | `barnum_api`      | Utilisateur postgres ayant accès à la base de données (droits de lecture suffisants)                               |
| `POSTGRES_PASSWORD` | Obligatoire       | Mot de passe de l'utilisateur pour accéder à la bdd                                                                |

## Contact
Gendarmerie Nationale: cyberimpact@gendarmerie.interieur.gouv.fr

En cas de questions ou suggestions, n'hésitez pas à [ouvrir une _issue_](https://github.com/GendarmerieNationale/barometre-numerique-website/issues/new/choose)
ou à nous contacter par mail. Tous les retours sont bienvenus ! ✌️

En cas de question urgente (ex: signaler un problème de sécurité), envoyer un mail directement à 
alexandre.thomas@gendarmerie.interieur.gouv.fr, en mettant cyberimpact@gendarmerie.interieur.gouv.fr en cc.

Ce site a été développé lors du [défi CyberImpact](https://eig.etalab.gouv.fr/defis/cyberimp-ct/), promotion EIG 5.
