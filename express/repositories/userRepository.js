const utils = require('../utils')
const bcrypt = require('bcryptjs');
const faunadb = require('faunadb')
const q = faunadb.query

const BASE_NAME = 'userRepository'

const Console = {
  debug: function(message, params) {console.log(`${BASE_NAME} ${message}`, ...params)},
  error: function(message, params) {console.error(`${BASE_NAME} ${message}`, ...params)},
}

async function findById(id) {
  Console.debug.call(this, 'findById', [id])
  if (isNaN(id)) {
    throw new Error('BAD_REQUEST')
  }
  const client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET,
    endpoint: process.env.FAUNADB_SERVER_ENDPOINT
  })
  return client.query(
    q.Let({
      object: q.Get(
        q.Ref(q.Collection('user'), id)
      )
    }, 
      getModel(q.Var('object'))
    )
  )
  .then(response => response)
  .catch((e) => {
    Console.error.call(this, 'findById error', [e])
    if (e.requestResult.statusCode === 404)
      return {}
    throw e
  })
}

async function findByRut(rut) {
  Console.debug.call(this, 'findByRut', [rut])
  if (!rut) {
    throw new Error('BAD_REQUEST')
  }
  const client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET,
    endpoint: process.env.FAUNADB_SERVER_ENDPOINT
  })
  return client.query(
    q.Let({
      object: q.Get(
        q.Match(
          q.Ref('indexes/user_by_rut'),
          rut
        )
      )
    }, 
      getModel(q.Var('object'))
    )
  )
  .then((response) => {
    Console.debug.call(this, 'findByRut response', [response])
    return response
  })
  .catch((e) => {
    Console.error('findByRut error', [e])
    if (e.requestResult.statusCode === 404)
      return {}
    throw e
  })
}

async function findByEmail(email) {
  Console.debug.call(this, 'findByEmail', [email])
  if (!email) {
    throw new Error('BAD_REQUEST')
  }
  const client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET,
    endpoint: process.env.FAUNADB_SERVER_ENDPOINT
  })
  return client.query(
    q.Let({
      object: q.Get(
        q.Match(
          q.Ref('indexes/user_by_email'),
          email
        )
      )
    }, 
      getModel(q.Var('object'))
    )
  )
  .then((response) => {
    Console.debug.call(this, 'findByEmail response', [response])
    return response
  })
  .catch((e) => {
    Console.error('findByEmail error', [e])
    if (e.requestResult.statusCode === 404)
      return {}
    throw e
  })
}

async function login(email, password) {
  Console.debug.call(this, 'login', [email])
  if (!email || !password) {
    throw new Error('BAD_REQUEST')
  }
  const client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET,
    endpoint: process.env.FAUNADB_SERVER_ENDPOINT
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
    Console.debug.call(this, 'login response', [response])
    if (!response.data || !response.data.password) {
      throw new Error('USER_NOT_ALLOWED')
    }
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
    Console.error.call(this, 'login error', [error])
    throw new Error(error)
  })
}

async function create(user) {
  try {
    console.log('user create', user.email)
    if (!user.rut || !user.firstName || !user.lastName || !user.email || !user.companyId || !user.profileId || !user.createdById) {
      throw new Error('BAD_REQUEST')
    }
    const client = new faunadb.Client({
      secret: process.env.FAUNADB_SERVER_SECRET,
      endpoint: process.env.FAUNADB_SERVER_ENDPOINT
    })
  
    const companyRef = await client.query(q.Select(["ref"], q.Get(q.Ref(q.Collection('company'), user.companyId))))
    const profileRef = await client.query(q.Select(["ref"], q.Get(q.Ref(q.Collection('profile'), user.profileId))))
    const createdByRef = await client.query(q.Select(["ref"], q.Get(q.Ref(q.Collection('user'), user.createdById))))
  
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
              profile: profileRef,
              createdBy: createdByRef,
              createdAt: q.Now()
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

async function edit(user) {
  try {
    Console.debug.call(this, 'edit', [user])
    if (!user.id || !user.rut || !user.firstName || !user.lastName || !user.email || !user.companyId || !user.profileId || !user.updatedById) {
      throw new Error('BAD_REQUEST')
    }

    const client = new faunadb.Client({
      secret: process.env.FAUNADB_SERVER_SECRET,
      endpoint: process.env.FAUNADB_SERVER_ENDPOINT
    })

    const companyRef = await client.query(q.Select(["ref"], q.Get(q.Ref(q.Collection('company'), user.companyId))))
    const profileRef = await client.query(q.Select(["ref"], q.Get(q.Ref(q.Collection('profile'), user.profileId))))
    const updatedByRef = await client.query(q.Select(["ref"], q.Get(q.Ref(q.Collection('user'), user.updatedById))))
    
    const response = await client.query(
      q.Update(
        q.Ref(q.Collection('user'), user.id), 
        {
          data: {
            rut: user.rut,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            company: companyRef,
            profile: profileRef,
            updatedBy: updatedByRef,
            updatedAt: q.Now(),
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

async function registerPassword(user) {
  try {
    console.log('user register password', user.id)
    if (!user.id || !user.password || !user.updatedPassword) {
      throw new Error('BAD_REQUEST')
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(user.password, salt);

    const client = new faunadb.Client({
      secret: process.env.FAUNADB_SERVER_SECRET,
      endpoint: process.env.FAUNADB_SERVER_ENDPOINT
    })
    
    const response = await client.query(
      q.Update( 
        q.Ref(q.Collection('user'), user.id), 
        {
          data: {
            password: hash,
            updatedPassword: q.Now(),
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

async function search({rut, name, email, companyId, profileId}) {
  Console.debug.call(this, `search`, [rut, name, email, companyId, profileId])

  let insertion = [q.Match(q.Index("users"))]
  if (rut && utils.validateRut(rut)) {
    insertion.push(q.Match(q.Index("user_by_rut"), rut))
  }

  let filters = []
  if (name && typeof name == 'string') {
    filters.push(q.ContainsStr(q.Select(["firstName"], q.Var("result")), name))
    filters.push(q.ContainsStr(q.Select(["lastName"], q.Var("result")), name))
  }

  if (email && typeof email == 'string') {
    insertion.push(q.Match(
      q.Index("user_by_email"), email))
  }

  if (companyId && !isNaN(companyId)) {
    insertion.push(q.Match(
      q.Index("users_by_company"),
      q.Select(
        ["ref"],
        q.Get(q.Ref(q.Collection("company"), companyId))
      )
    ))
  }

  if (profileId && !isNaN(profileId)) {
    insertion.push(q.Match(
      q.Index("users_by_profile"),
      q.Select(
        ["ref"],
        q.Get(q.Ref(q.Collection("profile"), profileId))
      )
    ))
  }

  Console.debug.call(this, `query`, insertion)
  console.log('query', insertion)

  const client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET,
    endpoint: process.env.FAUNADB_SERVER_ENDPOINT
  })
  return client.query(
    q.Filter(
      q.Map(
        q.Paginate(
          q.Intersection(...insertion)
        ),
        q.Lambda(
          'object',
          getModel(q.Get(q.Var('object')))
        )
      ),
      q.Lambda(
        "result",
        q.And(filters.length > 0 ? q.Or(...filters) : true
        )
      )
    )
  )
  .then(response => response.data)
  .catch((error) => {
    Console.error.call(this, `search error`, [error])
    throw new Error(error)
  })
}

function getModel(object) {
  return {
    id: q.Select(['ref', 'id'], object),
    rut: q.Select(['data', 'rut'], object),
    firstName: 
      q.If( q.ContainsPath(['data', 'firstName'], object), 
        q.Select(['data', 'firstName'], object), 
        "" 
      ),
    lastName: 
      q.If( q.ContainsPath(['data', 'lastName'], object), 
        q.Select(['data', 'lastName'], object), 
        "" 
      ),
    email: 
      q.If( q.ContainsPath(['data', 'email'], object), 
        q.Select(['data', 'email'], object), 
        "" 
      ),
    company: 
      q.If( q.ContainsPath(['data', 'profile'], object),
        { 
          id: q.Select(['ref', 'id'], q.Get(q.Select(['data', 'company'], object))),
          name: q.Select(['data', 'name'], q.Get(q.Select(['data', 'company'], object)))
        },
        {}
      ),
    profile: 
      q.If( q.ContainsPath(['data', 'profile'], object),
        {
          id: q.Select(['ref', 'id'], q.Get(q.Select(['data', 'profile'], object))),
          name: q.Select(['data', 'name'], q.Get(q.Select(['data', 'profile'], object)))
        },
        {}
      ),
    updatedAt: 
      q.If( q.ContainsPath(['data', 'updatedAt'], object), 
        q.Select(['data', 'updatedAt'], object), 
        {} 
      ),
  }
}

module.exports = { findById, findByRut, findByEmail, login, create, edit, registerPassword, search }
