'use strict';
const express = require('express');
const path = require('path');
const serverless = require('serverless-http');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');

const user = require('./user')

const router = express.Router();
router.get('/', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write('<h1>Hello from Express.js!</h1>');
  res.end();
});
router.get('/another', (req, res) => res.json({ route: req.originalUrl }));
router.get('/another2', (req, res) => res.json({ route: req.originalUrl }));
router.post('/', (req, res) => res.json({ postBody: req.body }));

router.get("/user/login", async (req, res) => {
  console.log('api user/login', typeof req.body)

  const resp = await user.login('body.email')
  console.log('api user/login response', resp)
  console.log('api user/login', req.originalUrl)
  console.log('api user/login', req.method)
  res.json(resp);
});

router.post("/user/login", async (req, res) => {
  console.log('api user/login')
  console.log('api user/login', req.originalUrl)
  console.log('api user/login', req.method)
  const body = req.body
  if (!body || !body.email || !body.password) {
    res.json(null);
    return
  }
  const resp = await user.login(body.email, body.password)
  console.log('api user/login response', resp)
  res.json(resp);
});

const validateJson = (object) => {
  console.log('api validateJson' , object)
  let result = true
  try {
    JSON.parse(JSON.stringify(object))
  } catch(e) {
    console.log(e.message)
    result = false
  }
  console.log('api validateJson', result)
  return result
}

app.use(cors({origin: '*'}));
app.use(bodyParser.json());
app.use('/.netlify/functions/server', router);  // path must route to lambda
app.use('/', (req, res) => res.sendFile(path.join(__dirname, '../index.html')));

module.exports = app;
module.exports.handler = serverless(app);
