const faunadb = require('faunadb')
const q = faunadb.query

const BASE_NAME = 'profileRepository'

function findAll() {
  console.log(`${BASE_NAME} ${Object.values(this)[0].name}`)

  const client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET,
    endpoint: process.env.FAUNADB_SERVER_ENDPOINT
  })
  return client.query(
    q.Map(
      q.Paginate(q.Documents(q.Collection('profile'))),
      q.Lambda(
        'X',
        {
          id: q.Select(['ref', 'id'], q.Get(q.Var('X'))),
          name: q.Select(['data', 'name'], q.Get(q.Var('X')))
        }
      )
    )
  )
  .then(async (response) => {
    return response.data
  }).catch((error) => {
    console.error(`${BASE_NAME} ${Object.values(this)[0].name} error`, error)
    throw new Error(error)
  })
}

module.exports = { findAll }
