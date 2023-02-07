'use strict';
const express = require('express');
const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const cors = require('cors');

const userRepository = require('./repositories/userRepository')
const userController = require('./controllers/userController')
const postulantController = require('./controllers/postulantController')
const companyRepository = require('./repositories/companyRepository')
const profileRepository = require('./repositories/profileRepository')
const testRepository = require('./repositories/testRepository')
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

router.get('/companies', async (req, res, next) => {
  try {
    console.log(`${BASE_NAME} ${req.url}`)
    const resp = await companyRepository.findAll()
    console.log(`${BASE_NAME} ${req.url} response`)
    res.json(resp);
  } catch(err) {
    console.error(`${BASE_NAME} ${req.url}`, err)
    next(err)
  }
});

router.get('/profiles', async (req, res, next) => {
  try {
    console.log(`${BASE_NAME} ${req.url}`)
    const resp = await profileRepository.findAll()
    console.log(`${BASE_NAME} ${req.url} response`)
    res.json(resp);
  } catch(err) {
    console.error(`${BASE_NAME} ${req.url}`, err)
    next(err)
  }
});

router.get('/tests', async (req, res, next) => {
  try {
    console.log(`${BASE_NAME} ${req.url}`)
    const resp = await testRepository.findAll()
    console.log(`${BASE_NAME} ${req.url} response`)
    res.json(resp);
  } catch(err) {
    console.error(`${BASE_NAME} ${req.url}`, err)
    next(err)
  }
});

router.post("/tests/:testId/postulants/:postulantId", testPostulantController.assign)
// router.post("/tests/:testId/postulants/:postulantId", async (req, res, next) => {
//   try {
//     const testId = req.params.testId
//     const postulantId = req.params.postulantId
//     const body = req.body
//     console.log(`${BASE_NAME} ${req.url}`, body.companyId)
//     if (!testId || !postulantId || !body || !body.companyId || !body.analystId || !body.createdById) {
//       throw new Error('BAD_REQUEST')
//     }

//     const assign = {
//       testId,
//       postulantId,
//       companyId: body.companyId,
//       analystId: body.analystId,
//       createdById: body.createdById,
//     }

//     const resp = await testPostulant.assign(assign)
//     console.log(`${BASE_NAME} ${req.url} response`, resp)
//     res.json(resp);
//   } catch(err) {
//     console.error(`${BASE_NAME} ${req.url}`, err)
//     next(err)
//   }
// });

router.get("/postulants", async (req, res, next) => {
  try {
    Console.debug('', [], req)
    const resp = await postulantController.search(req)
    Console.debug('response', [resp], req)
    res.json(resp);
  } catch(err) {
    Console.error(`error`, [err], req)
    next(err)
  }
});

router.post("/postulants", async (req, res, next) => {
  try {
    Console.debug('', [], req)
    const resp = await postulantController.create(req)
    Console.debug(' response', [resp], req)
    res.json(resp);
  } catch(err) {
    Console.error(`error`, [err], req)
    next(err)
  }
});

router.get("/postulants/:id", async (req, res, next) => {
  try {
    Console.debug('', [], req)
    const resp = await postulantController.findById(req)
    Console.debug('response', [resp], req)
    res.json(resp);
  } catch(err) {
    Console.error(`error`, [err], req)
    next(err)
  }
});

router.patch("/postulants/:id", async (req, res, next) => {
  try {
    Console.debug.call(this, ``, [], req)
    const resp = await postulantController.edit(req)
    Console.debug.call(this, `response`, [], req)
    res.json(resp);
  } catch(err) {
    Console.error.call(this, `error`, [err], req)
    next(err)
  }
});

router.get("/tests-postulants", async (req, res, next) => {
  try {
    const postulantId = req.query.postulant
    const companyId = req.query.company
    const stateId = req.query.state
    console.log(`${BASE_NAME} ${req.url}`, postulantId, companyId, stateId)
    if (!isNaN(postulantId) && !isNaN(companyId) && !isNaN(stateId)) {
      const resp = await testPostulant.findByPostulantAndCompanyAndState(postulantId, companyId, stateId)
      console.log(`${BASE_NAME} ${req.url} response`, resp)
      res.json(resp)
      return
    }
    res.json(null);
  } catch(err) {
    console.error(`${BASE_NAME} ${req.url}`, err)
    next(err)
  }
});

// router.get("/tests/postulants/ic", async (req, res, next) => {
//   try {
//     console.log(`${BASE_NAME} ${req.url}`)

//     const resp = await testPostulant.findAllDone()
//     console.log(`${BASE_NAME} ${req.url} response`, resp)
//     res.json(resp)
//   } catch(err) {
//     console.error(`${BASE_NAME} ${req.url} error`, err)
//     next(err)
//   }
// });

router.get("/tests/postulants/:id", testPostulantController.getById)
// router.get("/tests/postulants/ic/:id", async (req, res, next) => {
//   try {
//     const id = req.params.id
//     console.log(`${BASE_NAME} ${req.url}`,  id)
//     if (isNaN(id)) {
//       throw new Error('BAD_REQUEST')
//     }

//     const resp = await testPostulant.getIcById(id)
//     console.log(`${BASE_NAME} ${req.url} response`, resp)
//     res.json(resp)
//   } catch(err) {
//     console.error(`${BASE_NAME} ${req.url}`, err)
//     next(err)
//   }
// });

router.patch("/tests/postulants/ic/:id", async (req, res, next) => {
  try {
    const id = req.params.id
    const body = req.body
    console.log(`${BASE_NAME} ${req.url}`,  id, body)
    if (!id || !body || !Array.isArray(body.checks)) {
      throw new Error('BAD_REQUEST')
    }

    const resp = await testPostulant.saveIC(id, body.checks)
    console.log(`${BASE_NAME} ${req.url} response`, resp)
    res.json(resp);
  } catch(err) {
    console.error(`${BASE_NAME} ${req.url}`, err)
    next(err)
  }
});

router.get("/tests/postulants", testPostulantController.search)

router.get("/states", async (req, res, next) => {
  try {
    console.log(`${BASE_NAME} ${req.url}`)
    let resp = await stateController.findAll()
    console.log(`${BASE_NAME} ${req.url} response`, resp)
    res.json(resp)
  } catch(err) {
    console.error(`${BASE_NAME} ${req.url} error`, err)
    next(err)
  }
});

app.use(cors({origin: '*'}));
app.use(bodyParser.json());
app.use('/.netlify/functions/server', router);  // path must route to lambda
app.use((err, req, res, next) => {
  console.error(err.message)
  res.status(500).send({ error: err.message });
})

module.exports = app;
module.exports.handler = serverless(app);
