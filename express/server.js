'use strict';
const express = require('express');
const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const cors = require('cors');

const user = require('./user')
const company = require('./company')
const profile = require('./profile')
const test = require('./test')
const postulant = require('./postulant')
const testPostulant = require('./test-postulant')
const testPostulantController = require('./controllers/testPostulant')

const app = express();

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({message: "alive"});
});

router.get('/users', async (req, res, next) => {
  try {
    console.log('api user')
    
    const companyId = req.query.companyId;
    const profileId = req.query.profileId;

    if (companyId && profileId) {
      const resp = await user.findByCompanyAndProfile(companyId, profileId)
      console.log('api user response')
      res.json(resp);
    }
  } catch(err) {
    console.error(err)
    next(err)
  }
});

router.post("/users", async (req, res, next) => {
  try {
    const body = req.body
    console.log('api user', body.email)
    if (!body || !body.rut || !body.firstName || !body.lastName || !body.email || !body.companyId || !body.profileId) {
      throw new Error('BAD_REQUEST')
    }

    const { rut, firstName, lastName, email, companyId, profileId } = body;
    const resp = await user.create({ rut, firstName, lastName, email, companyId, profileId })
    console.log('api user response')
    res.json(resp);
  } catch(err) {
    console.error(err)
    next(err)
  }
});

router.get('/users/:id', async (req, res, next) => {
  try {
    console.log('api user id')
    
    const id = req.params.id;

    if (isNaN(id)) {
      throw new Error('BAB_REQUEST')
    }

    const resp = await user.findById(id)
    console.log('api user response')
    res.json(resp);
  } catch(err) {
    console.error(err)
    next(err)
  }
});

router.patch("/users/:id/password", async (req, res, next) => {
  try {
    const id = req.params.id
    const body = req.body
    console.log('api user register password', id)
    if (!id || !body || !body.password) {
      throw new Error('BAD_REQUEST')
    }

    const resp = await user.registerPassword({ id, password: body.password })
    console.log('api user register password response')
    res.json(resp);
  } catch(err) {
    console.error('api user register password', err)
    next(err)
  }
});

router.post("/users/login", async (req, res, next) => {
  try {
    const body = req.body
    console.log('api user/login', body.email)
    if (!body || !body.email || !body.password) {
      throw new Error('BAD_REQUEST')
    }

    const resp = await user.login(body.email, body.password)
    console.log('api user/login response', resp)
    res.json(resp);
  } catch(err) {
    console.error(err)
    next(err)
  }
});

router.get('/companies', async (req, res, next) => {
  try {
    const resp = await company.getAll()
    console.log('api company response')
    res.json(resp);
  } catch(err) {
    console.error(err)
    next(err)
  }
});

router.get('/profiles', async (req, res, next) => {
  try {
    const resp = await profile.getAll()
    console.log('api profiles response')
    res.json(resp);
  } catch(err) {
    console.error(err)
    next(err)
  }
});

router.get('/tests', async (req, res, next) => {
  try {
    const resp = await test.getAll()
    console.log('api tests response')
    res.json(resp);
  } catch(err) {
    console.error(err)
    next(err)
  }
});

router.post("/tests/:testId/postulants/:postulantId", async (req, res, next) => {
  try {
    const testId = req.params.testId
    const postulantId = req.params.postulantId
    const body = req.body
    console.log('api test postulant assign', body.companyId)
    if (!testId || !postulantId || !body || !body.companyId || !body.analystId || !body.createdById) {
      throw new Error('BAD_REQUEST')
    }

    const assign = {
      testId,
      postulantId,
      companyId: body.companyId,
      analystId: body.analystId,
      createdById: body.createdById,
    }

    const resp = await testPostulant.assign(assign)
    console.log('api test postulant assign response', resp)
    res.json(resp);
  } catch(err) {
    console.error(err)
    next(err)
  }
});

router.get("/postulants", async (req, res, next) => {
  try {
    const rut = req.query.rut
    console.log('api postulant', rut)
    if (rut) {
      const resp = await postulant.findByRut(rut)
      console.log('api postulant response', resp)
      res.json(resp);
    }
  } catch(err) {
    console.error(err)
    next(err)
  }
});

router.post("/postulants", async (req, res, next) => {
  try {
    const body = req.body
    console.log('api postulant', body.email)
    if (!body || !body.rut || !body.firstName || !body.lastName || !body.age || !body.sexo || !body.email) {
      throw new Error('BAD_REQUEST')
    }

    const { rut, firstName, lastName, email } = body;
    const resp = await postulant.create({ rut, firstName, lastName, age, sexo, email })
    console.log('api postulant response')
    res.json(resp);
  } catch(err) {
    console.error(err)
    next(err)
  }
});

router.get("/tests-postulants", async (req, res, next) => {
  try {
    const postulantId = req.query.postulant
    const companyId = req.query.company
    const stateId = req.query.state
    console.log('api test postulant', postulantId, companyId, stateId)
    if (!isNaN(postulantId) && !isNaN(companyId) && !isNaN(stateId)) {
      const resp = await testPostulant.findByPostulantAndCompanyAndState(postulantId, companyId, stateId)
      console.log('api test postulant response', resp)
      res.json(resp)
      return
    }
    res.json(null);
  } catch(err) {
    console.error(err)
    next(err)
  }
});

router.get("/tests/postulants/ic", async (req, res, next) => {
  try {
    console.log('api test postulant ic')

    const resp = await testPostulant.getAllDone()
    console.log('api test postulant ic response', resp)
    res.json(resp)
  } catch(err) {
    console.error(err)
    next(err)
  }
});

router.get("/tests/postulants/ic/:id", async (req, res, next) => {
  try {
    const id = req.params.id
    if (isNaN(id)) {
      throw new Error('BAD_REQUEST')
    }
    console.log('api test postulant ic id', id)

    const resp = await testPostulant.getIcById(id)
    console.log('api test postulant ic id response', resp)
    res.json(resp)
  } catch(err) {
    console.error(err)
    next(err)
  }
});

router.patch("/tests/postulants/ic/:id", async (req, res, next) => {
  try {
    const id = req.params.id
    const body = req.body
    console.log('api test ic', id, body, body.checks)
    if (!id || !body || !Array.isArray(body.checks)) {
      throw new Error('BAD_REQUEST')
    }

    const resp = await testPostulant.saveIC(id, body.checks)
    console.log('api test ic response', resp)
    res.json(resp);
  } catch(err) {
    console.error(err)
    next(err)
  }
});

router.get("/tests/postulants/search", async (req, res, next) => {
  try {
    console.log('api test postulant search')
    let resp = await testPostulantController.search(req)
    console.log('api test postulant search response', resp)
    res.json(resp)
  } catch(err) {
    console.error('api test postulant search', err)
    next(err)
  }
});

app.use(cors({origin: '*'}));
app.use(bodyParser.json());
app.use('/.netlify/functions/server', router);  // path must route to lambda

module.exports = app;
module.exports.handler = serverless(app);
