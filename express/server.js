'use strict';
const express = require('express');
const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const cors = require('cors');

const userRepository = require('./repositories/userRepository')
const userController = require('./controllers/userController')
const postulantController = require('./controllers/postulantController')
const companyController = require('./controllers/companyController')
const profileController = require('./controllers/profileController')
const testController = require('./controllers/testController')
const testPostulant = require('./repositories/testPostulantRepository')
const testPostulantController = require('./controllers/testPostulantController')
const stateController = require('./controllers/stateController')

const app = express();

const router = express.Router();

const BASE_NAME = 'server'

const Console = {
  debug: (message, params, req) => console.log(`${BASE_NAME} ${req.method} ${req.url} ${message}`, ...params),
  error: (message, params, req) => console.error(`${BASE_NAME} ${req.method} ${req.url} ${message}`, ...params),
}

router.get('/health', (req, res) => { res.json({message: "alive"}) });

router.get('/users', userController.search)
router.post('/users', userController.create)
router.get('/users/:id', userController.findById)
router.patch("/users/:id", userController.edit)
router.post("/users/login", userController.login)
router.patch("/users/:id/password", userController.registerPassword)

router.get('/companies', companyController.findAll)

router.get('/profiles', profileController.findAll)

router.get("/states", stateController.findAll)

router.get("/postulants", postulantController.search)
router.post("/postulants", postulantController.create)
router.get("/postulants/:id", postulantController.findById)
router.patch("/postulants/:id", postulantController.edit)

router.get('/tests', testController.findAll)
router.post("/tests/:testId/postulants/:postulantId", testPostulantController.assign)

router.get("/tests/postulants", testPostulantController.search)
router.get("/tests/postulants/:id", testPostulantController.getById)
router.patch("/tests/postulants/ic/:id", testPostulantController.saveIC)

app.use(cors({origin: '*'}));
app.use(bodyParser.json());
app.use('/.netlify/functions/server', router);
app.use((err, req, res, next) => {
  console.error(err.message)
  res.status(500).send({ error: err.message });
})

module.exports = app;
module.exports.handler = serverless(app);
