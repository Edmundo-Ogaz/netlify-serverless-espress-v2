const userRepository = require('../repositories/userRepository')
const utils = require('../utils')

const BASE_NAME = 'userController'

const Console = {
  debug: function(message, params) {console.log(`${BASE_NAME} ${message}`, ...params)},
  error: function(message, params) {console.error(`${BASE_NAME} ${message}`, ...params)}
}

async function findById(req) {
  try {
    const id = req.params.id;
    Console.debug.call(this, `findById`, [id])
    if (isNaN(id)) {
      throw new Error('BAB_REQUEST')
    }

    const resp = await userRepository.findById(id)
    Console.debug.call(this, `findById response`, [resp])
    return resp
  } catch(e) {
    Console.error.call(this, `findById error`, [e])
    throw e
  }
}

async function create(req) {
  try {
    const body = req.body
    Console.debug.call(this, 'save', [body])
    if (!body || !body.rut || !body.firstName || !body.lastName || !body.email || !body.company || !body.profile || !body.createdBy) {
      throw new Error('BAD_REQUEST')
    }
    const isExistRut =  await userRepository.findByRut(body.rut)
    if (isExistRut) {
      throw new Error('USER_EXIST')
    }
    const isExistEmail =  await userRepository.findByEmail(body.email)
    if (isExistEmail) {
      throw new Error('USER_EXIST')
    }

    const { rut, firstName, lastName, email, company: companyId, profile: profileId, createdBy: createdById} = body;
    const resp = await userRepository.create({ rut, firstName, lastName, email, companyId, profileId, createdById })
    Console.debug.call(this, `response`, [resp])
    return resp
  } catch(e) {
    Console.error.call(this, `error`, [e])
    throw e
  }
}

async function edit(req) {
  try {
    const id = req.params.id
    const body = req.body
    Console.debug.call(this, `edit`, [id])
    if (!id || !body || !body.rut || !body.firstName || !body.lastName || !body.email || !body.company || !body.profile || !body.updatedBy) {
      throw new Error('BAD_REQUEST')
    }

    const {rut, firstName, lastName, email, company: companyId, profile: profileId , updatedBy} = {...body}

    const resp = await userRepository.edit({ id, rut, firstName, lastName, email, companyId, profileId, updatedById: updatedBy })
    Console.debug.call(this, `response`, [])
    return resp
  } catch(e) {
    Console.error.call(this, `error`, [e])
    throw e
  }
}

async function search(req) {
  try {
    const {rut, email, company, profile} = {...req.query}
    Console.debug.call(this, 'search', [rut, email, company, profile])

    if (rut && !utils.validateRut(rut)) {
      throw new Error('BAD_REQUEST')
    }
    if (email && typeof email !== 'string') {
      throw new Error('BAD_REQUEST')
    }

    if (company && isNaN(company)) {
      throw new Error('BAD_REQUEST')
    }

    if (profile && isNaN(profile)) {
      throw new Error('BAD_REQUEST')
    }

    let resp = await userRepository.search({rut, email, companyId: company, profileId: profile})

    Console.debug.call(this, `response`, [resp])
    return resp
  } catch(e) {
    Console.error.call(this, `error`, [e])
    throw e
  }
}

module.exports = { findById, create, edit, search };