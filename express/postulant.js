const faunadb = require('faunadb')
const q = faunadb.query

exports.findByRut = rut => {
  console.log('postulant findByRut', rut)
  if (!rut) {
    throw new Error('BAD_REQUEST')
  }
  const client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET
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
    console.error('postulant findByRut response', response)
    return {id: response.ref.id, ...response.data}
  }).catch((error) => {
    console.error('postulant findByRut error', error)
    throw new Error(error)
  })
}

exports.create = async postulant => {
  try {
    console.log('postulant create', postulant.email)
    if (!postulant.rut || !postulant.firstName || !postulant.lastName || !postulant.age || !postulant.sexo || !postulant.email) {
      throw new Error('BAD_REQUEST')
    }
    const client = new faunadb.Client({
      secret: process.env.FAUNADB_SERVER_SECRET
    })
  
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
              email: postulant.email
            },
          },
        )
      )
      console.log('postulant created')
      return response.data
  } catch(e) {
    console.error('postulant error', e)
    throw new Error(e.message)
  }
}