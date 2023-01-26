/*
 * Copyright 2023 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// @ts-check

const knex = /** @type {import('knex')} */ require('knex');
const Client_BetterSQLite3 = /** @type {import('knex/lib/dialects/better-sqlite3')} */ require('knex/lib/dialects/better-sqlite3');
const BetterSqlite3 = /** @type {import('better-sqlite3')} */ require('better-sqlite3');

// class CustomClient extends Client_BetterSQLite3 {
//   constructor(client) {
//     return this.#client
//   }

//   _driver() {
//     return require('better-sqlite3');
//   }

//   // Get a raw connection from the database, returning a promise with the connection object.
//   async acquireRawConnection() {
//     return new this.driver(this.connectionSettings.filename);
//   }

//   // Used to explicitly close a connection, called internally by the pool when
//   // a connection times out or the pool is shutdown.
//   async destroyRawConnection(connection) {
//     return connection.close();
//   }

// }

const db = new BetterSqlite3(':memory:');

db.prepare(
  `
  CREATE TABLE users (
    name TEXT
  );
`,
).run();
db.prepare(
  `
  INSERT INTO users (name) VALUES ('Tim');
`,
).run();

// const dbData = db.serialize();

// const statement = db2.prepare(`
//   SELECT * FROM users;
// `);
// const result = statement.get();

// console.log(`DEBUG: result=`, result);
// await db.raw(`CREATE DATABASE ??`, [database]);

async function main() {
  const db2 = knex.default({
    client: 'better-sqlite3',
    connection: {
      filename: db.serialize(),
    },
  });

  console.log(
    `DEBUG: db2.pool=`,
    await db2.client.pool.creator().then(x => x.serialize()),
  );
  const data = db2.client.driver.serialize();
  console.log(`DEBUG: data=`, data);

  // await db.schema.createTable('users', table => {
  //   table.string('name');
  // });
  const users = await db2('users').select();
  console.log(`DEBUG: users=`, users);
}

main();
