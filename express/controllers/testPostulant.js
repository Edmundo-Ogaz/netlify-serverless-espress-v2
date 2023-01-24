const testPostulant = require('../test-postulant')
const search = require('../repositories/search')

exports.search = async (req) => {
  try {
    const {rut, email} = {...req.query}
    console.log('constroller test postulant search', rut, email)

    let resp = []
    if (rut && email) {
      resp = await search.findByRutAndEmail(rut, email)
    } else if (rut) {
      resp = await search.findByRut(rut)
    } else {
      resp = await search.findAll()
    }

    console.log('constroller test postulant search response', resp)
    return resp
  } catch(e) {
    console.error('constroller test postulant search error', e)
    throw e
  }
}