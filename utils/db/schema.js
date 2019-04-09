// Copyright (c) 2018, Fexra, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.
'use strict'

const db = require('../utils').knex

// Create 'users' table if it does not exist
db.schema.hasTable('users').then(function (exists) {
  if (!exists) {
    return db.schema.createTable('users', function (table) {
      table.increments()
      table.unique('email')
      table.string('email')
      table.string('password', 1024)
      table.string('recovery')
      table.string('secret')
      table.integer('verified').defaultTo(0)
      table.string('name')
      table.string('role')
      table.string('timezone').defaultTo('Europe/Andorra')
      table.integer('terms').defaultTo(0)
      table.datetime('seen')
      table.datetime('created').defaultTo(db.fn.now())
    })
  }
})