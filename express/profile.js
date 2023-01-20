const faunadb = require('faunadb')
const q = faunadb.query

exports.getAll = () => {
  console.log('profile getAll')

  const client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET
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
    console.error('profile getAll error', error)
    throw new Error(error)
  })
}
