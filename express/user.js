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

exports.create = async user => {
  try {
    console.log('user create', user.email)
    if (!user.email || !user.password || !user.rut || !user.companyId || !user.permissionId) {
      return null
    }
    const client = new faunadb.Client({
      secret: process.env.FAUNADB_SERVER_SECRET
    })
  
    const companyRef = await client.query(q.Select(["ref"], q.Get(q.Ref(q.Collection('company'), user.companyId))))
    const permissionRef = await client.query(q.Select(["ref"], q.Get(q.Ref(q.Collection('permission'), user.permissionId))))
  
    const response = await client.query(
      q.Create(
        q.Collection('user'),
          {
            data: {
              email: user.email,
              password: user.password,
              rut: user.rut,
              company: companyRef,
              permission: permissionRef
            },
          },
        )
      )
      console.error('user created')
      return response.data
  } catch(e) {
    console.error('user error', e)
    return new Error(e.message)
  }
}
