const postulantRepository = require('../repositories/postulantRepository')
const utils = require('../utils')

const BASE_NAME = 'postulantController'

const Console = {
  debug: function(message, params) {console.log(`${BASE_NAME} ${message}`, ...params)},
  error: function(message, params) {console.error(`${BASE_NAME} ${message}`, ...params)}
}

async function findById(req, res, next) {
  try {
    const id = req.params.id;
    Console.debug(`findById`, [id])
    if (isNaN(id)) {
      throw new Error('BAB_REQUEST')
    }

    const resp = await postulantRepository.findById(id)
    Console.debug(`findById response`, [resp])
    res.json(resp);
  } catch(e) {
    Console.error(`findById error`, [e])
    next(e)
  }
}

async function create(req, res, next) {
  try {
    const body = req.body
    Console.debug(`create`, [body])
    if (!body || !body.rut || !body.firstName || !body.lastName || !body.age || !body.sexo || !body.email || !body.createdBy) {
      throw new Error('BAD_REQUEST')
    }

    const object = await postulantRepository.findByRut(body.rut)
    if (Object.keys(object).length !== 0) {
      throw new Error('POSTULANT_EXIST')
    }

    const { rut, firstName, lastName, email, age, sexo, createdBy: createdById } = body;
    const resp = await postulantRepository.create({ rut, firstName, lastName, age, sexo, email, createdById })
    Console.debug(`create response`, [resp])
    res.json(resp);
  } catch(e) {
    Console.error(`create error`, [e])
    next(e)
  }
}

async function edit(req, res, next) {
  try {
    const id = req.params.id
    const body = req.body
    Console.debug(`edit`, [id])
    if (!id || !body || !body.rut || !body.firstName || !body.lastName || !body.email || !body.age || !body.sexo || !body.updatedBy) {
      throw new Error('BAD_REQUEST')
    }

    const {rut, firstName, lastName, email, age, sexo , updatedBy: updatedById} = {...body}

    const resp = await postulantRepository.edit({ id, rut, firstName, lastName, email, age, sexo, updatedById })
    Console.debug(`edit response`, [])
    res.json(resp);
  } catch(e) {
    Console.error(`edit error`, [e])
    next(e)
  }
}

async function search(req, res, next) {
  try {
    Console.debug('search', [req.query])
    const {rut, name, email} = {...req.query}
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

    Console.debug(`response`, [resp])
    res.json(resp);
  } catch(e) {
    Console.error(`error`, [e])
    next(e)
  }
}

module.exports = { findById, create, edit, search };