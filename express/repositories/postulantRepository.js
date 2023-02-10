const utils = require('../utils')
const bcrypt = require('bcryptjs');
const faunadb = require('faunadb')
const q = faunadb.query

const BASE_NAME = 'postulantRepository'

const Console = {
  debug: function(message, params) {console.log(`${BASE_NAME} ${message}`, ...params)},
  error: function(message, params) {console.error(`${BASE_NAME} ${message}`, ...params)},
}

async function findById(id) {
  Console.debug('findById', [id])
  if (isNaN(id)) {
    throw new Error('BAD_REQUEST')
  }
  const client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET,
    endpoint: process.env.FAUNADB_SERVER_ENDPOINT
  })
  return client.query(
    q.Let({
      object: q.Get(
        q.Ref(q.Collection('postulant'), id)
      )
    }, 
      getModel(q.Var('object'))
    )
  )
  .then(response => response)
  .catch((error) => {
    Console.error('findById error', [error])
    throw new Error(error)
  })
}

function findByRut(rut) {
  Console.debug('findByRut', [rut])
  if (!rut) {
    throw new Error('BAD_REQUEST')
  }
  const client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET,
    endpoint: process.env.FAUNADB_SERVER_ENDPOINT
  })
  return client.query(
    q.Get(
      q.Match(
        q.Ref('indexes/postulant_by_rut'),
        rut
      )
    )
  )
  .then( response => {
    return {id: response.ref.id, ...response.data}
  }).catch((e) => {
    Console.error('findByRut error', [e])
    if (e.requestResult.statusCode === 404)
      return {}
    throw e
  })
}

async function create(postulant) {
  try {
    Console.debug('create', [postulant])
    if (!postulant.rut || !postulant.firstName || !postulant.lastName || !postulant.age || !postulant.sexo || !postulant.email || !postulant.createdById) {
      throw new Error('BAD_REQUEST')
    }
    const client = new faunadb.Client({
      secret: process.env.FAUNADB_SERVER_SECRET,
      endpoint: process.env.FAUNADB_SERVER_ENDPOINT
    })

    const createdByRef = await client.query(q.Select(["ref"], q.Get(q.Ref(q.Collection('user'), postulant.createdById))))
  
    const response = await client.query(
      q.Create(
        q.Collection('postulant'),
          {
            data: {
              rut: postulant.rut,
              firstName: postulant.firstName,
              lastName: postulant.lastName,
              age: postulant.age,
              sexo: postulant.sexo,
              email: postulant.email,
              createdBy: createdByRef,
              createdAt: q.Now()
            },
          },
        )
      )
      Console.debug('created', [response])
      return response.data
  } catch(e) {
    Console.error('create error', [e])
    throw new Error(e.message)
  }
}

async function edit(postulant) {
  try {
    Console.debug('edit', [postulant])
    if (!postulant.id || !postulant.rut || !postulant.firstName || !postulant.lastName || !postulant.email || !postulant.age || !postulant.sexo || !postulant.updatedById) {
      throw new Error('BAD_REQUEST')
    }

    const client = new faunadb.Client({
      secret: process.env.FAUNADB_SERVER_SECRET,
      endpoint: process.env.FAUNADB_SERVER_ENDPOINT
    })

    const updatedByRef = await client.query(q.Select(["ref"], q.Get(q.Ref(q.Collection('user'), postulant.updatedById))))
    
    const response = await client.query(
      q.Update(
        q.Ref(q.Collection('postulant'), postulant.id), 
        {
          data: {
            rut: postulant.rut,
            firstName: postulant.firstName,
            lastName: postulant.lastName,
            email: postulant.email,
            age: postulant.age,
            sexo: postulant.sexo,
            updatedBy: updatedByRef,
            updatedAt: q.Now(),
          },
        },
      )
    )
    Console.debug('edit response', [])
    return response.data
  } catch(e) {
    Console.error('edit error', [e])
    throw new Error(e.message)
  }
}

async function search(postulant) {
  Console.debug(`search`, [postulant])

  let insertion = [q.Match(q.Index("postulants"))]
  if (postulant.rut && utils.validateRut(postulant.rut)) {
    insertion.push(q.Match(q.Index("postulant_by_rut"), postulant.rut))
  }

  let filters = []
  if (postulant.name && typeof postulant.name == 'string') {
    for (let name of postulant.name.split(' ')) {
      filters.push(q.ContainsStr(q.Select(["firstName"], q.Var("result")), name))
      filters.push(q.ContainsStr(q.Select(["lastName"], q.Var("result")), name))
    }
  }

  if (postulant.email && typeof postulant.email == 'string') {
    insertion.push(q.Match(
      q.Index("postulant_by_email"), postulant.email))
  }

  Console.debug(`query`, insertion)

  const client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET,
    endpoint: process.env.FAUNADB_SERVER_ENDPOINT
  })
  return client.query(
    q.Filter(
      q.Map(
        q.Paginate(
          q.Intersection(...insertion)
        ),
        q.Lambda(
          'object',
          getModel(q.Get(q.Var('object')))
        )
      ),
      q.Lambda(
        "result",
        q.And(filters.length > 0 ? q.Or(...filters) : true
        )
      )
    )
  )
  .then(response => response.data)
  .catch((error) => {
    Console.error(`search error`, [error])
    throw new Error(error)
  })
}

function getModel(object) {
  return {
    id: q.Select(['ref', 'id'], object),
    rut: q.Select(['data', 'rut'], object),
    firstName: 
      q.If( q.ContainsPath(['data', 'firstName'], object), 
        q.Select(['data', 'firstName'], object), 
        "" 
      ),
    lastName: 
      q.If( q.ContainsPath(['data', 'lastName'], object), 
        q.Select(['data', 'lastName'], object), 
        "" 
      ),
    email: 
      q.If( q.ContainsPath(['data', 'email'], object), 
        q.Select(['data', 'email'], object), 
        "" 
      ),
    age: 
      q.If( q.ContainsPath(['data', 'age'], object), 
        q.Select(['data', 'age'], object), 
        "" 
      ),
    sexo: 
      q.If( q.ContainsPath(['data', 'sexo'], object), 
        q.Select(['data', 'sexo'], object), 
        "" 
      ),
    createdBy: 
      q.If( q.ContainsPath(['data', 'createdBy'], object),
        {
          id: q.Select(['ref', 'id'], q.Get(q.Select(['data', 'createdBy'], object))),
          firstName: q.Select(['data', 'firstName'], q.Get(q.Select(['data', 'createdBy'], object))),
          lastName: q.Select(['data', 'lastName'], q.Get(q.Select(['data', 'createdBy'], object)))
        },
        {}
      ),
    createdAt: 
      q.If( q.ContainsPath(['data', 'createdAt'], object), 
        q.Select(['data', 'createdAt'], object), 
        {} 
      ),
    updatedBy: 
      q.If( q.ContainsPath(['data', 'updatedBy'], object),
        {
          id: q.Select(['ref', 'id'], q.Get(q.Select(['data', 'updatedBy'], object))),
          firstName: q.Select(['data', 'firstName'], q.Get(q.Select(['data', 'updatedBy'], object))),
          lastName: q.Select(['data', 'lastName'], q.Get(q.Select(['data', 'updatedBy'], object)))
        },
        {}
      ),
    updatedAt: 
      q.If( q.ContainsPath(['data', 'updatedAt'], object), 
        q.Select(['data', 'updatedAt'], object), 
        {} 
      ),
  }
}

module.exports = { findById, findByRut, create, edit, search }
