'use strict';
const express = require('express');
const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const cors = require('cors');

const user = require('./user')
const company = require('./company')
const permission = require('./permission')

const app = express();

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({message: "alive"});
});

router.post("/user", async (req, res, next) => {
  try {
    const body = req.body
    console.log('api user', body.email)
    if (!body || !body.rut || !body.firtName || !body.lastName || !body.email || !body.companyId || !body.permissionId) {
      throw new Error('BAD_REQUEST')
    }
    const { rut, firtName, lastName, email, companyId, permissionId } = body;
    const resp = await user.create({ rut, firtName, lastName, email, companyId, permissionId })
    console.log('api user response')
    res.json(resp);
  } catch(err) {
    console.error(err)
    next(err)
  }
});

router.post("/user/login", async (req, res, next) => {
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

router.get('/company', async (req, res) => {
  const resp = await company.getAll()
  console.log('api company response')
  res.json(resp);
});

router.get('/permission', async (req, res) => {
  const resp = await permission.getAll()
  console.log('api permission response')
  res.json(resp);
});

app.use(cors({origin: '*'}));
app.use(bodyParser.json());
app.use('/.netlify/functions/server', router);  // path must route to lambda

module.exports = app;
module.exports.handler = serverless(app);
