const utils = require('../utils')
const faunadb = require('faunadb')
const q = faunadb.query

const BASE_NAME = 'search'

exports.findAll = () => {
  console.log(`${BASE_NAME} ${Object.values(this)[0].name}`)
  
  const client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET
  })
  return client.query(
    q.Map(
      q.Paginate(q.Documents(q.Collection('test_postulant'))),
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
    console.error('test search', error)
    throw new Error(error)
  })
}

exports.findByRutAndEmail = (rut, email) => {
  console.log(`${BASE_NAME} ${Object.values(this)[0].name}`, rut, email)
  console.log('test searchByRut', rut, typeof email)

  if (!rut || !utils.validateRut(rut) || !email || typeof email !== 'string')
    throw new Error('BAD_REQUEST')
  
  const client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET
  })
  return client.query(
    q.Map(
      q.Paginate(
        q.Match(q.Index("tests_postulants_by_postulant"), 
          q.Select(
            ["ref"],
            q.Get(q.Match(q.Index("postulant_by_rut_and_email"), [
              rut, 
              email.trim()
            ]))
          )
        )
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
    console.error('test searchByRut', error)
    throw new Error(error)
  })
}

exports.findByRut = (rut) => {
  console.log('test searchByRut', rut)

  if (!rut || !utils.validateRut(rut))
    throw new Error('BAD_REQUEST')
  
  const client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET
  })
  return client.query(
    q.Map(
      q.Paginate(
        q.Match(q.Index("tests_postulants_by_postulant"), [
          q.Select(
            ["ref"],
            q.Get(q.Match(q.Index("postulant_by_rut"), rut))
          )
        ])
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
    console.error('test searchByRut', error)
    throw new Error(error)
  })
}


