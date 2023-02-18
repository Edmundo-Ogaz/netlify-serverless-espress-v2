const utils = require('../utils')
const faunadb = require('faunadb')
const q = faunadb.query

const BASE_NAME = 'searchRepository'

const Console = {
  debug: function(message, params) {console.log(`${BASE_NAME} ${message}`, ...params)},
  error: function(message, params) {console.error(`${BASE_NAME} ${message}`, ...params)},
}

exports.search = (testPostulant) => {
  Console.debug(`search`, [testPostulant])

  let insertion = [q.Match(q.Index("tests_postulants"))]

  if (testPostulant.rut && utils.validateRut(testPostulant.rut)) {
    insertion.push(q.Match(
      q.Index("tests_postulants_by_postulant"),
      q.Select(
        ["ref"],
        q.Get(q.Match(q.Index("postulant_by_rut"), testPostulant.rut))
      )
    ))
  }

  let filters = []
  if (testPostulant.name && typeof testPostulant.name == 'string') {
    for (let name of testPostulant.name.split(' ')) {
      filters.push(q.ContainsStr(q.Select(["postulant", "firstName"], q.Var("result")), name))
      filters.push(q.ContainsStr(q.Select(["postulant", "lastName"], q.Var("result")), name))
    }
  }

  if (testPostulant.email && typeof testPostulant.email == 'string') {
    insertion.push(q.Match(
      q.Index("tests_postulants_by_postulant"),
      q.Select(
        ["ref"],
        q.Get(q.Match(q.Index("postulant_by_email"), testPostulant.email))
      )
    ))
  }

  if (testPostulant.companyId && !isNaN(testPostulant.companyId)) {
    insertion.push(q.Match(
      q.Index("tests_postulants_by_company"),
      q.Select(
        ["ref"],
        q.Get(q.Ref(q.Collection("company"), testPostulant.companyId))
      )
    ))
  }

  if (testPostulant.analystId && !isNaN(testPostulant.analystId)) {
    insertion.push(q.Match(
      q.Index("tests_postulants_by_analyst"),
      q.Select(
        ["ref"],
        q.Get(q.Ref(q.Collection("user"), testPostulant.analystId))
      )
    ))
  }
  
  if (testPostulant.testId && !isNaN(testPostulant.testId)) {
    insertion.push(q.Match(
      q.Index("tests_postulants_by_test"),
      q.Select(
        ["ref"],
        q.Get(q.Ref(q.Collection("test"), testPostulant.testId))
      )
    ))
  }

  if (testPostulant.stateId && !isNaN(testPostulant.stateId)) {
    insertion.push(q.Match(
      q.Index("tests_postulants_by_state"),
      q.Select(
        ["ref"],
        q.Get(q.Ref(q.Collection("test_state"), testPostulant.stateId))
      )
    ))
  }

  console.log(`${BASE_NAME} ${Object.values(this)[0].name} query`, insertion)

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
    console.error(`${BASE_NAME} ${Object.values(this)[0].name} error`, error)
    throw new Error(error)
  })
}

function getModel(object) {
  return {
    id: q.Select(["ref", "id"], object),
    test: q.Select( ["data"], q.Get(q.Select(["data", "test"], object)) ),
    postulant: {
      id: q.Select(['ref', 'id'], q.Get(q.Select(['data', 'postulant'], object))),
      firstName: q.Select(['data', 'firstName'], q.Get(q.Select(['data', 'postulant'], object))),
      lastName: q.Select(['data', 'lastName'], q.Get(q.Select(['data', 'postulant'], object))),
      email: q.Select(['data', 'email'], q.Get(q.Select(['data', 'postulant'], object)))
    },
    company: {
      id: q.Select(['ref', 'id'], q.Get(q.Select(['data', 'company'], object))),
      name: q.Select(['data', 'name'], q.Get(q.Select(['data', 'company'], object)))
    },
    analyst: q.Let({
      data: q.Get(q.Select(["data", "analyst"], object)) 
      
      }, 
      {
        firstName: q.Select(['data', 'firstName'], q.Var('data')),
        lastName: q.Select(['data', 'lastName'], q.Var('data'))
      }
    ),
    state: {
      id: q.Select( ["ref", "id"], q.Get(q.Select(["data", "state"], object)) ),
      name: q.Select( ["data", "name"], q.Get(q.Select(["data", "state"], object)) )
    },
    createdAt: q.Select(["data", "createdAt"], object),
    updatedAt:
      q.If( q.ContainsPath(['data', 'updatedAt'], object),
        q.Select(['data', 'updatedAt'], object), 
        {}
      )
  }
}


