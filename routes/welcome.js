// Copyright (c) 2019, Fexra, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.
'use strict'

const express = require('express')
const router = express.Router()
const permission = require('permission')
const db = require('../utils/utils').knex
const { check } = require('express-validator/check')
const validateInput = require('../middleware/validateInput')

// Welcome + Terms View
router.get('/', permission(), function(req, res, next) {
  if (req.user.terms == 0) {
    res.render('welcome', {
      title: 'Welcome',
      user: (req.user) ? req.user : undefined,
      fee: process.env.TS_FEE,
      feeSelf: process.env.TS_FEE_SELF
    })
  } else {
    res.redirect('/dashboard')
  }
})

router.post('/', permission(),
  [
    check('termOne')
    .not().isEmpty(),

    check('termTwo')
    .not().isEmpty(),

    check('termThree')
    .not().isEmpty(),

    check('termFour')
    .not().isEmpty(),
  ],
  validateInput,
  async function(req, res, next) {
    try {
      await db('users')
        .update({
          terms: 1
        })
        .where('id', req.user.id)
        .limit(1)

      res.redirect('/dashboard')
    } catch (err) {
      req.flash('error', 'Please agree to all terms.')
      res.redirect('/welcome')
    }
  })

module.exports = router
