const express = require("express");
const serverless = require("serverless-http");

const user = require('./user')

const app = express();
const router = express.Router();

router.get("/health", (req, res) => {
  res.json({
    hello: "hi!"
  });
});

router.get("/", async (req, res) => {
  res.json({
    hello: "hi!"
  });
});

router.post("/user/login", async (req, res) => {
  console.log('api user/login', typeof req.body)
  const body = validateJson(req.body) && JSON.parse(req.body)
  if (!body || !body.email || !body.password) {
    res.json(null);
    return
  }
  const resp = await user.login(body.email, body.password)
  console.log('api user/login response', resp)
  res.json(resp);
});

const validateJson = (object) => {
  console.log('api validateJson')
  let result = true
  try {
    JSON.parse(object)
  } catch(e) {
    result = false
  }
  console.log('api validateJson', result)
  return result
}

app.use(`/`, router);

module.exports.handler = serverless(app);