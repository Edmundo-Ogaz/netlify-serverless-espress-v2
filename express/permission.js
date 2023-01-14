const faunadb = require('faunadb')
const q = faunadb.query

exports.getAll = () => {
  console.log('permission getAll')

  const client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET
  })
  return client.query(
    q.Map(
      q.Paginate(q.Documents(q.Collection('permission'))),
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
    console.error('error', error)
    return new Error(error)
  })
}
