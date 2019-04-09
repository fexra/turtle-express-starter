// Copyright (c) 2019, Fexra, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.
'use strict'

const speakEasy = require('speakeasy')

async function verify2FA(req, res, next) {
  try {
    if (req.user && req.user.verified === 1) {
      const verify = await speakEasy.totp.verify({
        secret: req.user.secret,
        encoding: 'base32',
        token: req.body.token
      })

      if (verify === false) {
        req.flash('warning', 'You have entered an invalid token.')
        return res.redirect('/dashboard')
      } else {
        return next()
      }
    } else {
      return next()
    }
  } catch (err) {
    next(err)
  }
}

module.exports = verify2FA
