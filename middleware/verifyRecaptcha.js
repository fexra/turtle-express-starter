// Copyright (c) 2019, Fexra, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.
'use strict'

const axios = require('axios')

async function verifyRecaptcha(req, res, next) {
  try {

    if (req.body['g-recaptcha-response'].length <= 0) {
      throw (new Error('Please complete the recaptcha.'))
    } else {
      const verify = await axios({
        method: 'POST',
        url: 'https://www.google.com/recaptcha/api/siteverify',
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: req.body['g-recaptcha-response'],
          remoteip: req.headers['x-real-ip']
        }
      })

      if (verify.data.success) {
        next()
      } else {
        throw (new Error('You failed the recaptcha test.'))
      }
    }
  } catch (err) {
    req.flash('error', err.message)
    res.redirect(req.protocol + '://' + req.get('host') + req.originalUrl)
  }
}

module.exports = verifyRecaptcha
