const faunadb = require('faunadb')
const q = faunadb.query

exports.assign = async assign => {
  try {
    console.log('test assign assign', assign.companyId)
    if (!assign.testId || !assign.postulantId || !assign.companyId || !assign.analystId || !assign.createdById) {
      throw new Error('BAD_REQUEST')
    }
    const client = new faunadb.Client({
      secret: process.env.FAUNADB_SERVER_SECRET
    })
  
    const testRef = await client.query(q.Select(["ref"], q.Get(q.Ref(q.Collection('test'), assign.testId))))
    const postulantRef = await client.query(q.Select(["ref"], q.Get(q.Ref(q.Collection('postulant'), assign.postulantId))))
    const companyRef = await client.query(q.Select(["ref"], q.Get(q.Ref(q.Collection('company'), assign.companyId))))
    const analystRef = await client.query(q.Select(["ref"], q.Get(q.Ref(q.Collection('user'), assign.analystId))))
    const stateRef = await client.query(q.Select(["ref"], q.Get(q.Ref(q.Collection('test_state'), process.env.TEST_STATE_PENDING_ID))))
    const createdByRef = await client.query(q.Select(["ref"], q.Get(q.Ref(q.Collection('user'), assign.createdById))))
  
    const response = await client.query(
      q.Create(
        q.Collection('test_postulant'),
          {
            data: {
              test: testRef,
              postulant: postulantRef,
              company: companyRef,
              analyst: analystRef,
              state: stateRef,
              createdBy: createdByRef,
              createdAt: q.Now()
            },
          },
        )
      )
      console.log('test assign created')
      return response.data
  } catch(e) {
    console.error('test assign error', e)
    throw new Error(e.message)
  }
}

exports.saveIC = async (id, checks) => {
  try {
    console.log('test postulant ic save', id, checks)
    if (isNaN(id) || !Array.isArray(checks)) {
      throw new Error('BAD_REQUEST')
    }

    let binaryAnswer = "000000000000000000000000000000000000000000000000000000000000000000000000000"
    let preb, post;
    for (let i of checks) {
      preb = binaryAnswer.slice(0,i)
      postb = binaryAnswer.slice(i + 1)
      binaryAnswer = preb + "1" + postb
    }

    //SCORE
    const guide = '101001000000000000110010101000000000010000001000011000101000100010001011000'
    let correct = 0
    let notSelected = 0
    for (let i = 0; i<guide.length; i++) {
      if (binaryAnswer[i] === guide[i]) {
        if (binaryAnswer[i] === "1")
          correct += 1
        else
          notSelected += 1
      }
    }
    const omitted = 19 - correct
    const wrong = 56 - notSelected + omitted

    let score = 1
    let level = "Nivel Bajo"
    if (wrong <= 1) {
      score = 6
      level = "Nivel Muy Alto"
    } else if (2 <= wrong <= 4) {
      score = 5
      level = "Nivel Alto"
    } else if (5 <= wrong <= 7) {
      score = 4
      level = "Nivel Medio Alto"
    } else if (8 <= wrong <= 12) {
      score = 3
      level = "Nivel Medio"
    } else if (13 <= wrong <= 17) {
      score = 2
      level = "Nivel Medio Bajo"
    }

    const client = new faunadb.Client({
      secret: process.env.FAUNADB_SERVER_SECRET
    })

    const stateRef = await client.query(q.Select(["ref"], q.Get(q.Ref(q.Collection('test_state'), process.env.TEST_STATE_DONE_ID))))

    const response = await client.query(
      q.Update(
        q.Ref(q.Collection('test_postulant'), id),
          {
            data: {
              answer:{
                answer: binaryAnswer,
                score,
                level,
                correct,
                wrong,
                omitted,
              },
              state: stateRef,
              updated_at: q.Now(),
            },
          },
      )
    )
    console.log('test postulant ic save created')
    return response.data
  } catch(e) {
    console.error('test postulant ic save error', e)
    throw new Error(e.message)
  }
}

exports.findByPostulantAndCompanyAndState = (postulantId, companyId, stateId) => {
  console.log('test postulant findByPostulatAndCompanyAndState', postulantId, companyId, stateId)
  if (!postulantId || !companyId || !stateId) {
    throw new Error('BAD_REQUEST')
  }
  const client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET
  })
  return client.query(
    q.Map(
      q.Paginate(
        q.Match(
          q.Ref("indexes/test_postulant_by_postulant_and_company_and_state"), 
          [
            q.Ref(q.Collection('postulant'), postulantId),
            q.Ref(q.Collection('company'), companyId),
            q.Ref(q.Collection('test_state'), stateId),
          ]
        )
      ),
      q.Lambda("X", {
        id: q.Select(["ref", "id"], q.Get(q.Var("X"))),
        postulant: q.Select(["data", "postulant", "id"], q.Get(q.Var("X"))),
        company: q.Select(["data", "company", "id"], q.Get(q.Var("X"))),
      })
    )
  )
  .then( response => {
    console.error('test postulant findById response', response)
    return response.data
  }).catch((error) => {
    console.error('test postulant findById error', error)
    throw new Error(error)
  })
}

exports.getAllDone = () => {
  console.log('test getAllDone')

  const client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET
  })
  return client.query(
    q.Map(
      q.Paginate(
        q.Match(
          q.Ref('indexes/tests_postulants_by_state'),
          [
            q.Ref(q.Collection('test_state'), process.env.TEST_STATE_DONE_ID)
          ]
        )
      ),
      q.Lambda(
        'X',
        {
          id: q.Select(['ref', 'id'], q.Get(q.Var('X'))),
          score: q.Select(['data', 'answer', 'score'], q.Get(q.Var('X'))),
          correct: q.Select(['data', 'answer', 'correct'], q.Get(q.Var('X'))),
          wrong: q.Select(['data', 'answer', 'wrong'], q.Get(q.Var('X'))),
          omitted: q.Select(['data', 'answer', 'omitted'], q.Get(q.Var('X'))),
          answerDate: q.Select(['data', 'updated_at'], q.Get(q.Var('X'))),
          state: q.Select(['data', 'state', 'id'], q.Get(q.Var('X'))),
        }
      )
    )
  )
  .then(response => response.data)
  .catch((error) => {
    console.error('test getAllDone error', error)
    throw new Error(error)
  })
}

exports.getIcById = (id) => {
  console.log('test getIcById', id)
  if (isNaN(id)) {
    throw new Error('BAD_REQUEST')
  }
  const client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET
  })
  return client.query(
    q.Let({
      data: q.Get(q.Ref(q.Collection("test_postulant"), id))
    },
    {
     test: q.Select(['data'], q.Get(q.Select(['data', 'test'], q.Var('data')))),
     postulant: q.Select(['data'], q.Get(q.Select(['data', 'postulant'], q.Var('data')))),
     answer: q.Select(['data', 'answer'], q.Var('data')),
     date: q.Select(['data', 'updated_at'], q.Var('data')),
     state: q.Select(['data'], q.Get(q.Select(['data', 'state'], q.Var('data')))),
    }
    )
  )
  .then(async (response) => {
    return response
  }).catch((error) => {
    console.error('test getIcById', error)
    throw new Error(error)
  })
}

exports.search = (rut) => {
  console.log('test search', rut)
  
  const client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET
  })
  return client.query(
    q.Map(
      q.Paginate(
        q.Match(q.Index("tests_postulants_by_postulant"), [
          q.Select(
            ["ref"],
            q.Get(q.Match(q.Index("postulant_by_rut"), rut))
          )
        ])
      ),
      q.Lambda("X", {
        id: q.Select(["ref", "id"], q.Get(q.Var("X"))),
        test: q.Select( ["data"], q.Get(q.Select(["data", "test"], q.Get(q.Var("X")))) ),
        postulant: q.Select( ["data"], q.Get(q.Select(["data", "postulant"], q.Get(q.Var("X")))) ),
        company: q.Select( ["data"], q.Get(q.Select(["data", "company"], q.Get(q.Var("X")))) ),
        analyst: q.Let({
          data: q.Get(q.Select(["data", "analyst"], q.Get(q.Var("X")))) 
          
        }, 
        {
          firstName: q.Select(['data', 'firstName'], q.Var('data')),
          lastName: q.Select(['data', 'lastName'], q.Var('data'))
        }
        ),
        state: q.Select( ["data"], q.Get(q.Select(["data", "state"], q.Get(q.Var("X")))) ),
        date: q.Select(["data", "createdAt"], q.Get(q.Var("X")))
      })
    )
  )
  .then(response => response.data)
  .catch((error) => {
    console.error('test search', error)
    throw new Error(error)
  })
}


