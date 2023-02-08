const searchRepository = require('../repositories/searchRepository')
const testPostulantRepository = require('../repositories/testPostulantRepository')
const utils = require('../utils')

const BASE_NAME = 'testPostulantController'

const Console = {
  debug: function(message, params) {console.log(`${BASE_NAME} ${message}`, ...params)},
  error: function(message, params) {console.error(`${BASE_NAME} ${message}`, ...params)},
}

async function getById(req, res, next) {
  try {
    const id = req.params.id
    Console.debug(`getById`, [id])
    if (isNaN(id)) {
      throw new Error('BAD_REQUEST')
    }

    const resp = await testPostulantRepository.getById(id)
    Console.debug(`getById response`, [resp])
    res.json(resp)
  } catch(err) {
    Console.error(`getById error`, [err])
    next(err)
  }
}

async function assign(req, res, next) {
  try {
    const testId = req.params.testId
    const postulantId = req.params.postulantId
    const body = req.body
    Console.debug(`assign`, [body])
    if (!testId || !postulantId || !body || !body.companyId || !body.analystId || !body.createdById) {
      throw new Error('BAD_REQUEST')
    }

    const params = {
      testId,
      postulantId,
      companyId: body.companyId,
      analystId: body.analystId,
      createdById: body.createdById,
    }

    const resp = await testPostulantRepository.assign(params)
    Console.debug(`assign response`, [resp])
    res.json(resp);
  } catch(err) {
    Console.error(`assign error`, [err])
    next(err)
  }
}

async function search(req, res, next) {
  try {
    Console.debug(`search`, [req.query])
    const { rut, email, name, company: companyId, analyst: analystId, test: testId, state: stateId} = {...req.query}

    if (rut && !utils.validateRut(rut)) {
      throw new Error('BAD_REQUEST')
    }
    if (name && typeof name !== 'string') {
      throw new Error('BAD_REQUEST')
    }
    if (email && typeof email !== 'string') {
      throw new Error('BAD_REQUEST')
    }
    if (companyId && isNaN(companyId)) {
      throw new Error('BAD_REQUEST')
    }
    if (analystId && isNaN(analystId)) {
      throw new Error('BAD_REQUEST')
    }
    if (testId && isNaN(testId)) {
      throw new Error('BAD_REQUEST')
    }
    if (stateId && isNaN(stateId)) {
      throw new Error('BAD_REQUEST')
    }

    let resp = await searchRepository.search({rut, name, email, companyId, analystId, testId, stateId})

    Console.debug(`search response`, [resp])
    res.json(resp)
  } catch(e) {
    Console.error(`search error`, [e])
    next(e)
  }
}

async function saveIC(req, res, next) {
  try {
    const id = req.params.id
    const body = req.body
    Console.debug(`saveIC`, [id, body])
    if (!id || !body || !Array.isArray(body.checks)) {
      throw new Error('BAD_REQUEST')
    }

    const resp = await testPostulantRepository.saveIC(id, body.checks)
    Console.debug(`saveIC response`, [resp])
    res.json(resp);
  } catch(err) {
    Console.error(`saveIC error`, [err])
    next(err)
  }
}

module.exports = { getById, assign, search, saveIC }