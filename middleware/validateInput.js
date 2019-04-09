// Copyright (c) 2019, Fexra, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.
'use strict'
const { validationResult } = require('express-validator/check')

function validateInput (req, res, next) {
  try {
    var err = validationResult(req)

    if (!err.isEmpty()) {

      err = err.array()

      if (err[0].msg) {
        err = err[0].msg
      }

      req.flash('error', err)
      res.redirect(req.headers.referer)
    }
    else {
      next()
    }
    
  }
  catch(err) {
    next(err)
  }
}

module.exports = validateInput
