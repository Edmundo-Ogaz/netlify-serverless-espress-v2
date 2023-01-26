const stateRepository = require('../repositories/stateRepository')

const BASE_NAME = 'stateController'

function findAll() {
  try {
    console.log(`${BASE_NAME} ${Object.values(this)[0].name}`)

    let resp = stateRepository.findAll({})

    console.log(`${BASE_NAME} ${Object.values(this)[0].name} response`, resp)
    return resp
  } catch(e) {
    console.error(`${BASE_NAME} ${Object.values(this)[0].name} error`, e)
    throw e
  }
}

module.exports = { findAll };