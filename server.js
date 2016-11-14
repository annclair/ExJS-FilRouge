'use strict'
// Set up ======================================================================
// require tous les modules dont on a besoin
let http = require('http') // module natif d'angular, n'a pas besoin d'etre indiqué dans les dépendances
let express = require('express') //  pour creer appli
let app = exports.app = express() // crée appli
let bodyParser = require('body-parser')
let methodOverride = require('method-override')
let morgan = require('morgan')
const port = process.env.PORT || 8000 // un ernaire très simplifié => (process.env.PORT ? process.env.PORT : 8000)

// Indication du dossier de notre application Angular
app.use(express.static(__dirname + '/public')) // pour aller chercher tout ce qui n'est pas interpréété par express est dans le dossier public
// Configuration des logs
app.use(morgan('combined')) // app.use utilise morgan (configurer les different log) pour afficher les informations sur ce que l'on fait
// Configuration du parser pour récupérer les infos des requêtes -- Config par defaut
app.use(bodyParser.urlencoded({
    'extended': 'true'
}))
app.use(bodyParser.json())
app.use(bodyParser.json({
    type: 'application/vnd.api+json'
}))

app.use(methodOverride('X-HTTP-Method-Override')) // pour gérer le put et delete

// Création du serveur
let server = http.Server(app) // creer server http avec notre aplli app en parametre
// Mise en écoute
server.listen(port)
console.log(`server listening on port ${port}`)

//Méthode pour quitter "proprement" l'application -- intersepte le ctrlC pour bien couper le server (& les taches de fond)
process.on('SIGINT', function() {
    console.log("\nStopping...")
    process.exit()
});

// Connexion à mongodb via mongoose
let mongoose = require('mongoose')
mongoose.connect('mongodb://localhost:27017/express'); // peut ajouter le user@password: si besoin autenthification

// Create du schéma User
let userModel = mongoose.model('User', new mongoose.Schema({  // on crée un nouveau schéma pour ajouter un document (le model est la structure du document)
    name: {
        type: String,
        unique: true
    },
    age: {
        type: Number,
        default: 99
    },
    address: {
        type: String,
        default: ' '
    }
}, {
    timestamps: true
}))


// Création des différentes "routes" (API) que le serveur met à disposition
app.get('/users', (req, res, next) => {
    // Récupération de tous les users
    userModel.find({}).exec((err, users) => { // sur Rbo mongo, on voit les requetes en haut avec le user Model
        res.json(users)   // mettre une reponse pour que le server ne tourne pas dans le vide
    })
})

app.get('/users/:id', (req, res, next) => {     // on lui met un id en parametre - on peut filtrer par nom, ou autre element find({name:reqXXXXXX})
    // Récupération d'un user en fonction de l'id passé en paramètre
    userModel.findById(req.params.id, (err, object) => {
        if (err)
            next(err)
        else
            res.json(object)
    })
})

app.post('/users', (req, res, next) => { // passer par postman pour tester les requetes qui ne sont pas du get
    // Création d'un User depuis les données contenu dans le corps de la requete (request body)
    userModel.create(req.body, (err, user) => {
        if (err) {
            next(err)
        } else {
            // res.sendStatus(201)
            res.json(user)
        }
    })

})

app.put('/users/:id', (req, res, next) => {
    // Mise à jour du User d'id passé en paramètre depuis les données contenu dans le corps de la requete (request body)
    userModel.update({
        _id: req.params.id
    }, req.body, (err, user) => {
        if (err) {
            next(err)
        } else {
            res.sendStatus(200)
        }
    })

})

app.delete('/users/:id', (req, res, next) => {
    // Suppression du User d'id passé en paramètre
    userModel.findByIdAndRemove(req.params.id, (err) => {
        res.sendStatus(200)
    })
})


// Création d'un middleware pour logger les erreurs - se refere aux next (err) plus haut en cas d'erreur, elles vont venir catégoriser les erreurs.
app.use((error, request, response, next) => {
    // Middleware to catch all errors
    console.error(error.stack)
    response.status(500).send(error.message)
})
