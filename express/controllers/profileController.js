const profileRepository = require('../repositories/profileRepository')

const BASE_NAME = 'profileController'

const Console = {
  debug: function(message, params) {console.log(`${BASE_NAME} ${message}`, ...params)},
  error: function(message, params) {console.error(`${BASE_NAME} ${message}`, ...params)}
}

async function findAll(req, res, next) {
  try {
    Console.debug(`findAll`, [])
    const resp = await profileRepository.findAll()
    Console.debug(`findAll response`, [])
    res.json(resp);
  } catch(err) {
    Console.error(`findAll error`, [err])
    next(err)
  }
}

module.exports = { findAll };