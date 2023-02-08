const stateRepository = require('../repositories/stateRepository')

const BASE_NAME = 'stateController'

const Console = {
  debug: function(message, params) {console.log(`${BASE_NAME} ${message}`, ...params)},
  error: function(message, params) {console.error(`${BASE_NAME} ${message}`, ...params)},
}

async function findAll(req, res, next) {
  try {
    Console.debug(`findAll`, [])
    let resp = await stateRepository.findAll({})
    Console.debug(`findAll response`, [resp])
    res.json(resp)
  } catch(e) {
    Console.error(`findAll error`, [e])
    next(e)
  }
}

module.exports = { findAll };