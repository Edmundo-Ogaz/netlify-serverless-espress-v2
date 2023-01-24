const bcrypt = require('bcryptjs');
const faunadb = require('faunadb')
const q = faunadb.query

exports.findById = (id) => {
  console.log('user findById', id)
  if (isNaN(id)) {
    throw new Error('BAD_REQUEST')
  }
  const client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET
  })
  return client.query(
    q.Get(
      q.Ref(q.Collection('user'), id)
    )
  )
  .then(async (response) => {
    const id = response.ref.id
    const { password, ...user } = response.data;
    return {id, ...user}
  }).catch((error) => {
    console.error('user findById error', error)
    throw new Error(error)
  })
}

exports.login = (email, password) => {
  console.log('user login', email)
  if (!email || !password) {
    throw new Error('BAD_REQUEST')
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
      const id = response.ref.id
      const { password, ...user } = response.data;
      result = {id, ...user}
    }
    return result
  }).catch((error) => {
    console.error('user login error', error)
    throw new Error(error)
  })
}

exports.create = async user => {
  try {
    console.log('user create', user.email)
    if (!user.rut || !user.firstName || !user.lastName || !user.email || !user.companyId || !user.profileId) {
      throw new Error('BAD_REQUEST')
    }
    const client = new faunadb.Client({
      secret: process.env.FAUNADB_SERVER_SECRET
    })
  
    const companyRef = await client.query(q.Select(["ref"], q.Get(q.Ref(q.Collection('company'), user.companyId))))
    const profileRef = await client.query(q.Select(["ref"], q.Get(q.Ref(q.Collection('profile'), user.profileId))))
  
    const response = await client.query(
      q.Create(
        q.Collection('user'),
          {
            data: {
              rut: user.rut,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              company: companyRef,
              profile: profileRef
            },
          },
        )
      )
      console.log('user created')
      return response.data
  } catch(e) {
    console.error('user error', e)
    throw new Error(e.message)
  }
}

exports.registerPassword = async user => {
  try {
    console.log('user register password', user.id)
    if (!user.id || !user.password) {
      throw new Error('BAD_REQUEST')
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(user.password, salt);

    const client = new faunadb.Client({
      secret: process.env.FAUNADB_SERVER_SECRET
    })
    
    const response = await client.query(
      q.Update( 
        q.Ref(q.Collection('user'), user.id), 
        {
          data: {
            password: hash,
            updated_at: q.Now(),
          },
        },
      )
    )
    console.log('user password updated')
    return response.data
  } catch(e) {
    console.error('user password updated error', e)
    throw new Error(e.message)
  }
}

exports.findByCompanyAndProfile = async (companyId, profileId) => {
  try {
    console.log('user findByCompanyAndProfile', companyId, profileId)
    if (!companyId || !profileId) {
      throw new Error('BAD_REQUEST')
    }

    const client = new faunadb.Client({
      secret: process.env.FAUNADB_SERVER_SECRET
    })
  
    const response = await client.query(
      q.Map(
        q.Paginate(
          q.Match(q.Ref("indexes/users_by_company_and_profile"), [
            q.Ref(q.Collection('company'), companyId),
            q.Ref(q.Collection('profile'), profileId)
          ])
        ),
        q.Lambda("X", {
          id: q.Select(["ref", "id"], q.Get(q.Var("X"))),
          firstName: q.Select(["data", "firstName"], q.Get(q.Var("X"))),
          lastName: q.Select(["data", "lastName"], q.Get(q.Var("X")))
        })
      )
    )
    console.log('user findByCompanyAndProfile response')
    return response.data
  } catch(e) {
    console.error('user findByCompanyAndProfile error', e)
    throw new Error(e.message)
  }
}
