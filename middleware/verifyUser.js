// Copyright (c) 2019, Fexra, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.
'use strict'

async function verifyUser(req, res, next) {
  try {
    if (req.user && req.user.terms != 1) {
      res.redirect('/welcome')
    } else if (req.session && req.session.verified == 0) {
      res.redirect('/verify')
    } else {
      return next()
    }
  } catch (err) {
    next(err)
  }
}

module.exports = verifyUser
