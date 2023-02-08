const testRepository = require('../repositories/testRepository')

const BASE_NAME = 'testController'

const Console = {
  debug: function(message, params) {console.log(`${BASE_NAME} ${message}`, ...params)},
  error: function(message, params) {console.error(`${BASE_NAME} ${message}`, ...params)}
}

async function findAll(req, res, next) {
  try {
    Console.debug(`findAll`, [])
    const resp = await testRepository.findAll()
    Console.debug(`findAll response`, [])
    res.json(resp);
  } catch(err) {
    Console.error(`findAll error`, [err])
    next(err)
  }
}

module.exports = { findAll };