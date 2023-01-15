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

router.post("/user", async (req, res) => {
  const body = req.body
  console.log('api user', body.email)
  if (!body || !body.email || !body.password || !body.rut || !body.companyId || !body.permissionId) {
    res.json(null);
    return
  }
  const { email, password, rut, companyId, permissionId } = body;
  const resp = await user.create({ email, password, rut, companyId, permissionId })
  console.log('api user response')
  res.json(resp);
});

router.post("/user/login", async (req, res) => {
  const body = req.body
  console.log('api user/login', body.email)
  if (!body || !body.email || !body.password) {
    res.json(null);
    return
  }

  const resp = await user.login(body.email, body.password)
  console.log('api user/login response', resp)
  res.json(resp);
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
