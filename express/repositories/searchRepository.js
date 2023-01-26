const utils = require('../utils')
const faunadb = require('faunadb')
const q = faunadb.query

const BASE_NAME = 'searchRepository'

exports.search = ({rut, email, companyId, analystId, testId, stateId}) => {
  console.log(`${BASE_NAME} ${Object.values(this)[0].name}`, rut, email, stateId)

  let insertion = [q.Match(q.Index("tests_postulants"))]
  if (rut && utils.validateRut(rut)) {
    insertion.push(q.Match(
      q.Index("tests_postulants_by_postulant"),
      q.Select(
        ["ref"],
        q.Get(q.Match(q.Index("postulant_by_rut"), rut))
      )
    ))
  }

  if (email && typeof email == 'string') {
    insertion.push(q.Match(
      q.Index("tests_postulants_by_postulant"),
      q.Select(
        ["ref"],
        q.Get(q.Match(q.Index("postulant_by_email"), email))
      )
    ))
  }

  if (companyId && !isNaN(companyId)) {
    insertion.push(q.Match(
      q.Index("tests_postulants_by_company"),
      q.Select(
        ["ref"],
        q.Get(q.Ref(q.Collection("company"), companyId))
      )
    ))
  }

  if (analystId && !isNaN(analystId)) {
    insertion.push(q.Match(
      q.Index("tests_postulants_by_analyst"),
      q.Select(
        ["ref"],
        q.Get(q.Ref(q.Collection("user"), analystId))
      )
    ))
  }
  
  if (testId && !isNaN(testId)) {
    insertion.push(q.Match(
      q.Index("tests_postulants_by_test"),
      q.Select(
        ["ref"],
        q.Get(q.Ref(q.Collection("test"), testId))
      )
    ))
  }

  if (stateId && !isNaN(stateId)) {
    insertion.push(q.Match(
      q.Index("tests_postulants_by_state"),
      q.Select(
        ["ref"],
        q.Get(q.Ref(q.Collection("test_state"), stateId))
      )
    ))
  }

  console.log(`${BASE_NAME} ${Object.values(this)[0].name} query`, insertion)

  const client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET
  })
  return client.query(
    q.Map(
      q.Paginate(
        q.Intersection(...insertion)
      ),
      q.Lambda("X", {
        id: q.Select(["ref", "id"], q.Get(q.Var("X"))),
        test: q.Select( ["data"], q.Get(q.Select(["data", "test"], q.Get(q.Var("X")))) ),
        postulant: q.Select( ["data"], q.Get(q.Select(["data", "postulant"], q.Get(q.Var("X")))) ),
        company: q.Select( ["data"], q.Get(q.Select(["data", "company"], q.Get(q.Var("X")))) ),
        analyst: q.Let({
          data: q.Get(q.Select(["data", "analyst"], q.Get(q.Var("X")))) 
          
        }, 
        {
          firstName: q.Select(['data', 'firstName'], q.Var('data')),
          lastName: q.Select(['data', 'lastName'], q.Var('data'))
        }
        ),
        state: q.Select( ["data"], q.Get(q.Select(["data", "state"], q.Get(q.Var("X")))) ),
        date: q.Select(["data", "createdAt"], q.Get(q.Var("X")))
      })
    )
  )
  .then(response => response.data)
  .catch((error) => {
    console.error(`${BASE_NAME} ${Object.values(this)[0].name} error`, error)
    throw new Error(error)
  })
}


