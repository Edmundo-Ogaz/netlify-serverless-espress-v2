const postulantRepository = require('../repositories/postulantRepository')
const utils = require('../utils')

const BASE_NAME = 'postulantController'

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

    const resp = await postulantRepository.findById(id)
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
    Console.debug.call(this, `create`, [body])
    if (!body || !body.rut || !body.firstName || !body.lastName || !body.age || !body.sexo || !body.email || !body.createdBy) {
      throw new Error('BAD_REQUEST')
    }

    const { rut, firstName, lastName, email, age, sexo, createdBy: createdById } = body;
    const resp = await postulantRepository.create({ rut, firstName, lastName, age, sexo, email, createdById })
    Console.debug.call(this, `create response`, [resp])
    return resp
  } catch(e) {
    Console.error.call(this, `create error`, [e])
    throw e
  }
}

async function edit(req) {
  try {
    const id = req.params.id
    const body = req.body
    Console.debug.call(this, `edit`, [id])
    if (!id || !body || !body.rut || !body.firstName || !body.lastName || !body.email || !body.age || !body.sexo || !body.updatedBy) {
      throw new Error('BAD_REQUEST')
    }

    const {rut, firstName, lastName, email, age, sexo , updatedBy: updatedById} = {...body}

    const resp = await postulantRepository.edit({ id, rut, firstName, lastName, email, age, sexo, updatedById })
    Console.debug.call(this, `response`, [])
    return resp
  } catch(e) {
    Console.error.call(this, `error`, [e])
    throw e
  }
}

async function search(req) {
  try {
    const {rut, name, email} = {...req.query}
    Console.debug.call(this, 'search', [rut, name, email])

    if (rut && !utils.validateRut(rut)) {
      throw new Error('BAD_REQUEST')
    }
    if (name && typeof name !== 'string') {
      throw new Error('BAD_REQUEST')
    }
    if (email && typeof email !== 'string') {
      throw new Error('BAD_REQUEST')
    }

    let resp = await postulantRepository.search({rut, name, email})

    Console.debug.call(this, `response`, [resp])
    return resp
  } catch(e) {
    Console.error.call(this, `error`, [e])
    throw e
  }
}

module.exports = { findById, create, edit, search };