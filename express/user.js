const bcrypt = require('bcryptjs');
const faunadb = require('faunadb')
const q = faunadb.query

exports.login = (email, password) => {
  console.log('user login', email)
  if (!email || !password) {
    return null
  }
  const client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET
  })
  return client.query(
    q.Get(
      q.Match(
        q.Ref('indexes/user_by_email'),
        email
      )
    )
  )
  .then(async (response) => {
    let result = null
    if (response && response.data
      && (await bcrypt.compare(password, response.data.password))
    ) {
      const { password, ...user } = response.data;
      result = user
    }
    return result
  }).catch((error) => {
    console.error('user login error', error)
    return new Error(error)
  })
}
