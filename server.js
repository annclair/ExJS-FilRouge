'use strict'
// Set up ======================================================================
let http = require('http')
let express = require('express')
let app = exports.app = express()
let bodyParser = require('body-parser')
let methodOverride = require('method-override')
let morgan = require('morgan')
const port = process.env.PORT || 8000

// Indication du dossier de notre application Angular
app.use(express.static(__dirname + '/public'))
// Configuration des logs
app.use(morgan('combined'))
// Configuration du parser pour récupérer les infos des requêtes
app.use(bodyParser.urlencoded({
    'extended': 'true'
}))
app.use(bodyParser.json())
app.use(bodyParser.json({
    type: 'application/vnd.api+json'
}))

app.use(methodOverride('X-HTTP-Method-Override'))

// Création du serveur
let server = http.Server(app)
// Mise en écoute
server.listen(port)
console.log(`server listening on port ${port}`)

//Méthode pour quitter "proprement" l'application
process.on('SIGINT', function() {
    console.log("\nStopping...")
    process.exit()
});

// Connexion à mongodb via mongoose
let mongoose = require('mongoose')
mongoose.connect('mongodb://localhost:27017/express');

// Create du schéma User
let userModel = mongoose.model('User', new mongoose.Schema({
    name: {
        type: String,
        unique: true
    },
    age: {
        type: Number,
        default: 99
    }
}, {
    timestamps: true
}))


// Création des différentes "routes" (API) que le serveur met à disposition
app.get('/users', (req, res, next) => {
    // Récupération de tous les users
    userModel.find({}).exec((err, users) => {
        res.json(users)
    })
})

app.get('/users/:id', (req, res, next) => {
    // Récupération d'un user en fonction de l'id passé en paramètre
    userModel.findById(req.params.id, (err, object) => {
        if (err)
            next(err)
        else
            res.json(object)
    })
})

app.post('/users', (req, res, next) => {
    // Création d'un User depuis les données contenu dans le corps de la requete (request body)
    userModel.create(req.body, (err, user) => {
        if (err) {
            next(err)
        } else {
            res.sendStatus(201)
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


// Création d'un middleware pour logger les erreurs
app.use((error, request, response, next) => {
    // Middleware to catch all errors
    console.error(error.stack)
    response.status(500).send(error.message)
})
