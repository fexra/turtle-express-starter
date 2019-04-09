// Copyright (c) 2019, Fexra, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.
'use strict'

const express = require('express')
const router = express.Router()
const permission = require('permission')
const verify2FA = require('../middleware/verify2FA')
const db = require('../utils/utils').knex
const { check } = require('express-validator/check')
const validateInput = require('../middleware/validateInput')
const speakEasy = require('speakeasy')
const QR = require('qrcode')
const bcrypt = require('bcrypt')

// Preference Panel
router.get('/', permission(), async function(req, res, next) {
  res.render('settings', {
    title: 'Settings',
    user: (req.user) ? req.user : undefined
  })
})

router.get('/2fa/new', permission(),
async function(req, res, next) {
  try {
    if (req.user.verified === 1) {
      req.flash('error', 'You already have a 2FA coupled to this account.')
      res.redirect('/settings')
    }

    const secret = speakEasy.generateSecret({
      name: 'TurtleService - ' + req.user.email
    })

    await db('users')
      .update({
        secret: secret.base32
      })
      .where('id', req.user.id)
      .limit(1)

    const qr = await QR.toDataURL(secret.otpauth_url)

    res.render('settings/2fa/new', {
      title: 'Add 2FA',
      user: (req.user) ? req.user : undefined,
      qr: qr,
      secret: secret.base32
    })
  } catch (err) {
    req.flash('error', 'An error occured while setting up 2FA.')
    res.redirect('/settings')
  }
})

router.post('/2fa/verify', permission(),
[
  check('token')
  .not().isEmpty()
  .trim()
  .escape()
  .isLength({
    min: 6,
    max: 6
  })
  .isFloat()
  .withMessage('Please enter a valid token.')
],
validateInput,
async function(req, res, next) {
  try {
    if (req.user.verified === 1) {
      req.flash('error', 'You already have a 2FA coupled to this account.')
      res.redirect('/settings')
    }

    let verify = await speakEasy.totp.verify({
      secret: req.user.secret,
      encoding: 'base32',
      token: req.body.token
    })

    if (verify) {
      await db('users')
        .update({
          verified: 1
        })
        .where('id', req.user.id)
        .limit(1)

      req.user.verified = true
      req.flash('success', '2FA succesfully coupled with your account.')
      res.redirect('/settings')
    } else {
      req.flash('error', 'You have entered an invalid token.')
      const qr = await QR.toDataURL('otpauth://totp/TurtleService%20-%20' + encodeURIComponent(req.user.email) + '?secret=' + req.user.secret)

      res.render('settings/2fa/new', {
        title: '2FA',
        user: (req.user) ? req.user : undefined,
        qr: qr,
        secret: req.user.secret
      })
    }
  } catch (err) {
    req.flash('error', 'An error occured while setting up 2FA.')
    res.redirect('/settings')
  }
})

router.get('/2fa/delete', permission(), async function(req, res, next) {
  res.render('settings/2fa/delete', {
    title: 'Remove 2FA',
    user: (req.user) ? req.user : undefined
  })
})

router.post('/2fa/delete', permission(), verify2FA,
async function(req, res, next) {
  try {

    await db('users')
      .update({
        secret: null,
        verified: 0
      })
      .where('id', req.user.id)
      .limit(1)

    req.user.verified = false

    req.flash('success', 'You decoupled 2FA succesfully.')
    res.redirect('/settings')
  } catch (err) {
    console.log(err)
    req.flash('error', 'An error occured decouping 2FA.')
    res.redirect('/settings')
  }
})

router.get('/password', permission(), async function(req, res, next) {
  res.render('settings/password', {
    title: 'Change Password',
    user: (req.user) ? req.user : undefined
  })
})

router.post('/password', permission(), verify2FA,
[
  check('new')
  .not().isEmpty()
  .trim()
  .escape()
  .isLength({
    min: 8,
    max: 32
  })
  .withMessage('Please enter password with a minimum length of 8 characters.'),

  check('verify')
  .not().isEmpty()
  .trim()
  .escape()
  .isLength({
    min: 8,
    max: 32
  })
  .withMessage('Please enter password with a minimum length of 8 characters.'),

  check('current')
  .not().isEmpty()
  .trim()
  .escape()
  .withMessage('Please enter a valid password.')
],
validateInput,
async function(req, res, next) {
  try {
    if (req.body.new !== req.body.verify) {
      throw (new Error('The new password does not match.'))
    }

    const user = await db('users')
      .select('password')
      .from('users')
      .where('id', req.user.id)
      .limit(1)

    if ((!user.length) || (!bcrypt.compareSync(req.body.current, user[0].password))) {
      throw (new Error('You have entered an incorrect password.'))
    }

    await db('users')
      .update({
        password: bcrypt.hashSync(req.body.new, bcrypt.genSaltSync(10))
      })
      .where('id', req.user.id)
      .limit(1)

    req.flash('success', 'Password succesfully changed.')
    res.redirect('/settings/')
  } catch (err) {
    console.log(err)
    req.flash('error', err.message)
    res.redirect('/settings/password')
  }
})

module.exports = router
