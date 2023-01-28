const utils = require('../utils')
const bcrypt = require('bcryptjs');
const faunadb = require('faunadb')
const q = faunadb.query

const BASE_NAME = 'userRepository'

const Console = {
  debug: function(message, params) {console.log(`${BASE_NAME} ${Object.values(this)[0].name} ${message}`, ...params)},
  error: function(message, params) {console.error(`${BASE_NAME} ${Object.values(this)[0].name} ${message}`, ...params)},
}

async function findById(id) {
  Console.debug.call(this, 'findById', [id])
  if (isNaN(id)) {
    throw new Error('BAD_REQUEST')
  }
  const client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET
  })
  return client.query(
    q.Let({
      object: q.Get(
        q.Ref(q.Collection('user'), id)
      )
    }, getModel(q.Var('object'))
    )
  )
  .then(response => response)
  .catch((error) => {
    Console.error.call(this, 'findById error', [error])
    throw new Error(error)
  })
}

async function login(email, password) {
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

async function create(user) {
  try {
    console.log('user create', user.email)
    if (!user.rut || !user.firstName || !user.lastName || !user.email || !user.companyId || !user.profileId || !user.createdBy) {
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
              profile: profileRef,
              createdBy: user.createdBy,
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
      secret: process.env.FAUNADB_SERVER_SECRET
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
      secret: process.env.FAUNADB_SERVER_SECRET
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

async function search({rut, email, companyId, profileId}) {
  Console.debug.call(this, `search`, [rut, email, companyId, profileId])

  let insertion = [q.Match(q.Index("users"))]
  if (rut && utils.validateRut(rut)) {
    insertion.push(q.Match(q.Index("user_by_rut"), rut))
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

  const client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET
  })
  return client.query(
    q.Map(
      q.Paginate(
        q.Intersection(...insertion)
      ),
      q.Lambda(
        'object',
        getModel(q.Get(q.Var('object')))
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
    firstName: q.If( q.ContainsPath(['data', 'firstName'], object), 
      q.Select(['data', 'firstName'], object), "" ),
    lastName: q.If( q.ContainsPath(['data', 'lastName'], object), 
      q.Select(['data', 'lastName'], object), "" ),
    email: q.If( q.ContainsPath(['data', 'email'], object), 
      q.Select(['data', 'email'], object), "" ),
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
    updatedAt: q.If( q.ContainsPath(['data', 'updatedAt'], object), 
      q.Select(['data', 'updatedAt'], object), {} ),
  }
}

module.exports = { findById, login, create, edit, registerPassword, search }
