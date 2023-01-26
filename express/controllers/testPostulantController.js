const searchRepository = require('../repositories/searchRepository')
const utils = require('../utils')

const BASE_NAME = 'testPostulantController'

exports.search = async (req) => {
  try {
    const {rut, email, company, analyst, test, state} = {...req.query}
    console.log(`${BASE_NAME} ${Object.values(this)[0].name}`, rut, email, state)

    if (rut && !utils.validateRut(rut)) {
      throw new Error('BAD_REQUEST')
    }
    if (email && typeof email !== 'string') {
      throw new Error('BAD_REQUEST')
    }

    if (company && isNaN(company)) {
      throw new Error('BAD_REQUEST')
    }

    if (analyst && isNaN(analyst)) {
      throw new Error('BAD_REQUEST')
    }

    if (test && isNaN(test)) {
      throw new Error('BAD_REQUEST')
    }

    if (state && isNaN(state)) {
      throw new Error('BAD_REQUEST')
    }

    let resp = await searchRepository.search({rut, email, companyId: company, analystId: analyst, testId: test, stateId: state})

    console.log(`${BASE_NAME} ${Object.values(this)[0].name} response`, resp)
    return resp
  } catch(e) {
    console.error(`${BASE_NAME} ${Object.values(this)[0].name} error`, e)
    throw e
  }
}