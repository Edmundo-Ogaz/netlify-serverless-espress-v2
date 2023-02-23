const utils = require('../utils')
const discData = require('../utils/discData.json')
const faunadb = require('faunadb')
const q = faunadb.query

const BASE_NAME = 'testPostulantRepository'

const Console = {
  debug: function(message, params) {console.log(`${BASE_NAME} ${message}`, ...params)},
  error: function(message, params) {console.error(`${BASE_NAME} ${message}`, ...params)},
}

function getById(id) {
  Console.debug('getById', [id])
  if (isNaN(id)) {
    throw new Error('BAD_REQUEST')
  }
  const client = new faunadb.Client({
    secret: process.env.FAUNADB_SERVER_SECRET,
    endpoint: process.env.FAUNADB_SERVER_ENDPOINT
  })
  return client.query(
    q.Let({
      data: q.Get(q.Ref(q.Collection("test_postulant"), id))
    },
    {
      id: q.Select(['ref', 'id'], q.Var('data')),
      test: {
        id: q.Select(['ref', 'id'], q.Get(q.Select(['data', 'test'], q.Var('data')))),
        name: q.Select(['data', 'name'], q.Get(q.Select(['data', 'test'], q.Var('data')))),
      },
      postulant: q.Select(['data'], q.Get(q.Select(['data', 'postulant'], q.Var('data')))),
      answer: 
        q.If( q.ContainsPath(['data', 'answer'], q.Var('data')), 
          q.Select(['data', 'answer'], q.Var('data')), 
          {}
        ),
      updatedAt: 
        q.If( q.ContainsPath(['data', 'updatedAt'], q.Var('data')), 
            q.Select(['data', 'updatedAt'], q.Var('data')), 
            {}
          ),
      state: {
        id: q.Select(['ref', 'id'], q.Get(q.Select(['data', 'state'], q.Var('data')))),
        name: q.Select(['data', 'name'], q.Get(q.Select(['data', 'state'], q.Var('data')))),
      }
    })
  )
  .then(async (response) => {
    return response
  }).catch((error) => {
    Console.error('getById', [error])
    throw new Error(error)
  })
}

async function assign(assign) {
  try {
    Console.debug('assign', [assign])
    if (!assign.testId || !assign.postulantId || !assign.companyId || !assign.analystId || !assign.createdById) {
      throw new Error('BAD_REQUEST')
    }
    const client = new faunadb.Client({
      secret: process.env.FAUNADB_SERVER_SECRET,
      endpoint: process.env.FAUNADB_SERVER_ENDPOINT
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
      Console.debug('assign created', [])
      return response.data
  } catch(e) {
    Console.error('assign error', [e])
    throw new Error(e.message)
  }
}

async function saveIC(id, checks) {
  try {
    Console.debug('saveIC', [id, checks])
    if (isNaN(id) || !Array.isArray(checks)) {
      throw new Error('BAD_REQUEST')
    }

    let binaryAnswer = "000000000000000000000000000000000000000000000000000000000000000000000000000"
    let preb, postb;
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
      secret: process.env.FAUNADB_SERVER_SECRET,
      endpoint: process.env.FAUNADB_SERVER_ENDPOINT
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
              updatedAt: q.Now(),
            },
          },
      )
    )
    Console.debug('saveIC created', [])
    return response.data
  } catch(e) {
    Console.error('saveIC error', [e])
    throw new Error(e.message)
  }
}

async function saveDISC(id, masChecks, menosChecks) {
  try {
    const NUM_CARDS = 28
    Console.debug('saveDISC', [id, masChecks, menosChecks])
    if (isNaN(id) || !Array.isArray(masChecks) || !Array.isArray(menosChecks) || 
      masChecks.length !== NUM_CARDS || menosChecks.length !== NUM_CARDS) {
      throw new Error('BAD_REQUEST')
    }

    mas = ""
    menos = ""
    values = {
        "D": 0,
        "I": 0,
        "E": 0,
        "C": 0
    }
    segment = [0, 0, 0, 0]
    scores = [
        [-29, -8, -4, -1, 1, 4, 8],
        [-29, -8, -4, -2, 1, 3, 6],
        [-29, -11, -7, -4, 1, 2, 7],
        [-29, -6, -3, -1, 2, 4, 8]
    ]

    for (let i = 0; i <  NUM_CARDS; i++) {
      values[masChecks[i]] += 1
      values[menosChecks[i]] -= 1
    }
    values_keys = Object.keys(values)
    for (let i = 0; i < values_keys.length; i++) {
      for (let j = 0; j < scores[0].length; j++) {
        if (values[values_keys[i]] > scores[i][j]) {
          segment[i] += 1
        }
      }
    }

    const db_segment_n = segment[0]*1000 + segment[1]*100 + segment[2]*10 + segment[3]
    console.log('type', typeof discData)
    const db_segment = discData.find(element => element.id === db_segment_n)

    const client = new faunadb.Client({
      secret: process.env.FAUNADB_SERVER_SECRET,
      endpoint: process.env.FAUNADB_SERVER_ENDPOINT
    })

    const stateRef = await client.query(q.Select(["ref"], q.Get(q.Ref(q.Collection('test_state'), process.env.TEST_STATE_DONE_ID))))

    const response = await client.query(
      q.Update(
        q.Ref(q.Collection('test_postulant'), id),
          {
            data: {
              answer: {
                positive: masChecks,
                negative: menosChecks,
                D: values["D"],
                I: values["I"],
                S: values["E"],
                C: values["C"],
                segment: db_segment,
              },
              state: stateRef,
              updatedAt: q.Now(),
            },
          },
      )
    )
    Console.debug('saveDISC created', [])
    return response.data
  } catch(e) {
    Console.error('saveDISC error', [e])
    throw new Error(e.message)
  }
}

module.exports = { getById, assign, saveIC, saveDISC }

