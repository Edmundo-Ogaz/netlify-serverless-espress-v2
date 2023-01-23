const faunadb = require('faunadb')
const q = faunadb.query

exports.getAll = () => {
  console.log('test getAll')

  const client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET
  })
  return client.query(
    q.Map(
      q.Paginate(q.Documents(q.Collection('test'))),
      q.Lambda(
        'X',
        {
          id: q.Select(['ref', 'id'], q.Get(q.Var('X'))),
          name: q.Select(['data', 'name'], q.Get(q.Var('X')))
        }
      )
    )
  )
  .then(response => response.data)
  .catch((error) => {
    console.error('test getAll error', error)
    throw new Error(error)
  })
}


