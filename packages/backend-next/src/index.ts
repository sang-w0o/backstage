/*
 * Copyright 2022 The Backstage Authors
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

const start = Date.now();
console.log('starting');

const { catalogPlugin } = require('@backstage/plugin-catalog-backend');
const {
  catalogModuleTemplateKind,
} = require('@backstage/plugin-scaffolder-backend');
const { createBackend } = require('@backstage/backend-defaults');
const { appPlugin } = require('@backstage/plugin-app-backend');

console.log('required ', Date.now() - start);

/*

Required requirements:

- Clone repo -> yarn install -> start backend in dev mode
- cd plugins/x-backend -> yarn start
- yarn start -> Ctrl-C -> yarn start = complete reset, by default
- yarn start -> save file -> server restart with database preserved
- yarn start -> save file -> all timers are cleared and restarted
- no polluting the working directory with tracked files

Optional requirements:

- no temporary files at all
- yarn start -> save file -> server restart with cache preserved
- yarn start -> save file -> server restart with in-memory state preserved

Performance hits:

- discovering and compiling configuration schema


Possible implementation:

- Use cluster module and share state with forks
  - NOPE: only possible to share cloned values
- Use VM modules to run backend in separate vm context
  - NOPE: VM contexts aren't isolated enough, can't be shut down, share timers with the main process
- Use worker threads and share state with them
  - NOPE: same issue as cluster module, only cloned values

- Use child process and share state by passing it over IPC. Needs a way to serialize state.
- Keep track of setTimeout, setInterval etc, clear all existing ones on restart
- Don't do any of the above - delete the require.cache for the changed files?
- webpack

Summary of SQLite exploration:
- It is possible to serialized and deserialize sqlite
  ```
  const data = db2.client.pool.creator().then(x => x.serialize())

  const db2 = knex.default({
    client: 'better-sqlite3',
    connection: { filename: data },
  });
  ```


*/

const backend = createBackend();

backend.add(catalogPlugin());
backend.add(catalogModuleTemplateKind());
backend.add(appPlugin({ appPackageName: 'example-app' }));
backend.start().then(() => {
  console.log('started ', Date.now() - start);
});
