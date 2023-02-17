const userRepository = require('../repositories/userRepository')
const utils = require('../utils')

const BASE_NAME = 'userController'

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

    const resp = await userRepository.findById(id)
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
    Console.debug('save', [body])
    if (!body || !body.rut || !body.firstName || !body.lastName || !body.email || !body.company || !body.profile || !body.createdBy) {
      throw new Error('BAD_REQUEST')
    }
    const objectByRut =  await userRepository.findByRut(body.rut)
    if (Object.keys(objectByRut).length !== 0) {
      throw new Error('USER_EXIST')
    }
    const objectByEmail =  await userRepository.findByEmail(body.email)
    if (Object.keys(objectByEmail).length !== 0) {
      throw new Error('USER_EXIST')
    }

    const { rut, firstName, lastName, email, company: companyId, profile: profileId, createdBy: createdById} = body;
    const resp = await userRepository.create({ rut, firstName, lastName, email, companyId, profileId, createdById })
    Console.debug(`response`, [resp])
    res.json(resp);
  } catch(e) {
    Console.error.call(this, `error`, [e])
    next(e)
  }
}

async function edit(req, res, next) {
  try {
    const id = req.params.id
    const body = req.body
    Console.debug(`edit`, [id])
    if (!id || !body || !body.rut || !body.firstName || !body.lastName || !body.email || !body.company || !body.profile || !body.updatedBy) {
      throw new Error('BAD_REQUEST')
    }

    const {rut, firstName, lastName, email, company: companyId, profile: profileId , updatedBy} = {...body}

    const resp = await userRepository.edit({ id, rut, firstName, lastName, email, companyId, profileId, updatedById: updatedBy })
    Console.debug.call(this, `response`, [])
    res.json(resp)
  } catch(e) {
    Console.error.call(this, `error`, [e])
    next(err)
  }
}

async function registerPassword(req, res, next) {
  try {
    const id = req.params.id
    const body = req.body
    Console.debug(`registerPassword`, [id])
    if (!id || !body || !body.password) {
      throw new Error('BAD_REQUEST')
    }

    const resp = await userRepository.registerPassword({ id, password: body.password })
    Console.debug(`registerPassword response`, [])
    res.json(resp);
  } catch(err) {
    Console.error(`registerPassword error`, [err])
    next(err)
  }
}

async function login(req, res, next) {
  try {
    const body = req.body
    Console.debug(`login`, [body.email])
    if (!body || !body.email || !body.password) {
      throw new Error('BAD_REQUEST')
    }

    const resp = await userRepository.login(body.email, body.password)
    Console.debug(`login response`, [resp])
    res.json(resp);
  } catch(err) {
    Console.error(`login error`, [err])
    next(err)
  }
}

async function search(req, res, next) {
  try {
    Console.debug('search', [req.query])
    const {rut, name, email, company, profile} = {...req.query}
    if (rut && !utils.validateRut(rut)) {
      throw new Error('BAD_REQUEST')
    }
    if (name && typeof name !== 'string') {
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

    let resp = await userRepository.search({rut, name, email, companyId: company, profileId: profile})

    Console.debug(`search response`, [resp])
    res.json(resp);
  } catch(e) {
    Console.error(`search error`, [e])
    next(e)
  }
}

module.exports = { findById, create, edit, registerPassword, login, search };