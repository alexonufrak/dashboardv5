VERCEL LOGS - DETAILED
/api/education/mine
Looking up user with normalized email: aonufrak@umd.edu
Cache miss for key: profile:aonufrak_umd_edu, fetching from source
Looking up user with normalized email: aonufrak@umd.edu
Email lookup result: 1 records found
Cache miss for key: profile:auth0_to_record_google_oauth2_104432848863333020607, fetching from source
Error fetching applications by contact ID: TypeError: e is not a function
    at p (/var/task/.next/server/chunks/4333.js:1:10175)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async m (/var/task/.next/server/chunks/4333.js:1:7097)
    at async d (/var/task/.next/server/pages/api/education/mine.js:1:4112)
    at async K (/var/task/node_modules/next/dist/compiled/next-server/pages-api.runtime.prod.js:20:16881)
    at async U.render (/var/task/node_modules/next/dist/compiled/next-server/pages-api.runtime.prod.js:20:17520)
    at async r9.runApi (/var/task/node_modules/next/dist/compiled/next-server/server.runtime.prod.js:17:44515)
    at async r9.handleCatchallRenderRequest (/var/task/node_modules/next/dist/compiled/next-server/server.runtime.prod.js:17:38432)
    at async r9.runImpl (/var/task/node_modules/next/dist/compiled/next-server/server.runtime.prod.js:16:17376)
    at async r9.handleRequestImpl (/var/task/node_modules/next/dist/compiled/next-server/server.runtime.prod.js:16:16465)
Error fetching user applications: s [AirtableError]: An error occurred while fetching applications by contact ID. Please try again or contact support.
    at a (/var/task/.next/server/chunks/1293.js:1:4676)
    at p (/var/task/.next/server/chunks/4333.js:7:719)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async m (/var/task/.next/server/chunks/4333.js:1:7097)
    at async d (/var/task/.next/server/pages/api/education/mine.js:1:4112)
    at async K (/var/task/node_modules/next/dist/compiled/next-server/pages-api.runtime.prod.js:20:16881)
    at async U.render (/var/task/node_modules/next/dist/compiled/next-server/pages-api.runtime.prod.js:20:17520)
    at async r9.runApi (/var/task/node_modules/next/dist/compiled/next-server/server.runtime.prod.js:17:44515)
    at async r9.handleCatchallRenderRequest (/var/task/node_modules/next/dist/compiled/next-server/server.runtime.prod.js:17:38432)
    at async r9.runImpl (/var/task/node_modules/next/dist/compiled/next-server/server.runtime.prod.js:16:17376) {
  originalError: TypeError: e is not a function
      at p (/var/task/.next/server/chunks/4333.js:1:10175)
      at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
      at async m (/var/task/.next/server/chunks/4333.js:1:7097)
      at async d (/var/task/.next/server/pages/api/education/mine.js:1:4112)
      at async K (/var/task/node_modules/next/dist/compiled/next-server/pages-api.runtime.prod.js:20:16881)
      at async U.render (/var/task/node_modules/next/dist/compiled/next-server/pages-api.runtime.prod.js:20:17520)
      at async r9.runApi (/var/task/node_modules/next/dist/compiled/next-server/server.runtime.prod.js:17:44515)
      at async r9.handleCatchallRenderRequest (/var/task/node_modules/next/dist/compiled/next-server/server.runtime.prod.js:17:38432)
      at async r9.runImpl (/var/task/node_modules/next/dist/compiled/next-server/server.runtime.prod.js:16:17376)
      at async r9.handleRequestImpl (/var/task/node_modules/next/dist/compiled/next-server/server.runtime.prod.js:16:16465),
  statusCode: undefined,
  context: {
    operation: 'fetching applications by contact ID',
    contactId: 'recwvNmg26KdwPECq'
  },
  timestamp: '2025-04-02T15:59:56.793Z',
  requestId: 'req_m9044vax'
}

/api/user/profile-v2
Looking up user with normalized email: aonufrak@umd.edu
Cache miss for key: profile:aonufrak_umd_edu, fetching from source
Looking up user with normalized email: aonufrak@umd.edu
Email lookup result: 1 records found
Throttling Airtable request for 833ms to avoid rate limiting
Error fetching applications by contact ID: TypeError: e is not a function
    at p (/var/task/.next/server/chunks/4333.js:1:10175)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async Object.m [as getCompleteProfile] (/var/task/.next/server/chunks/4333.js:1:7097)
    at async u (/var/task/.next/server/pages/api/user/profile-v2.js:1:2157)
    at async K (/var/task/node_modules/next/dist/compiled/next-server/pages-api.runtime.prod.js:20:16881)
    at async U.render (/var/task/node_modules/next/dist/compiled/next-server/pages-api.runtime.prod.js:20:17520)
    at async r9.runApi (/var/task/node_modules/next/dist/compiled/next-server/server.runtime.prod.js:17:44515)
    at async r9.handleCatchallRenderRequest (/var/task/node_modules/next/dist/compiled/next-server/server.runtime.prod.js:17:38432)
    at async r9.runImpl (/var/task/node_modules/next/dist/compiled/next-server/server.runtime.prod.js:16:17376)
    at async r9.handleRequestImpl (/var/task/node_modules/next/dist/compiled/next-server/server.runtime.prod.js:16:16465)
Error fetching user applications: s [AirtableError]: An error occurred while fetching applications by contact ID. Please try again or contact support.
    at a (/var/task/.next/server/chunks/1293.js:1:4676)
    at p (/var/task/.next/server/chunks/4333.js:7:719)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async Object.m [as getCompleteProfile] (/var/task/.next/server/chunks/4333.js:1:7097)
    at async u (/var/task/.next/server/pages/api/user/profile-v2.js:1:2157)
    at async K (/var/task/node_modules/next/dist/compiled/next-server/pages-api.runtime.prod.js:20:16881)
    at async U.render (/var/task/node_modules/next/dist/compiled/next-server/pages-api.runtime.prod.js:20:17520)
    at async r9.runApi (/var/task/node_modules/next/dist/compiled/next-server/server.runtime.prod.js:17:44515)
    at async r9.handleCatchallRenderRequest (/var/task/node_modules/next/dist/compiled/next-server/server.runtime.prod.js:17:38432)
    at async r9.runImpl (/var/task/node_modules/next/dist/compiled/next-server/server.runtime.prod.js:16:17376) {
  originalError: TypeError: e is not a function
      at p (/var/task/.next/server/chunks/4333.js:1:10175)
      at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
      at async Object.m [as getCompleteProfile] (/var/task/.next/server/chunks/4333.js:1:7097)
      at async u (/var/task/.next/server/pages/api/user/profile-v2.js:1:2157)
      at async K (/var/task/node_modules/next/dist/compiled/next-server/pages-api.runtime.prod.js:20:16881)
      at async U.render (/var/task/node_modules/next/dist/compiled/next-server/pages-api.runtime.prod.js:20:17520)
      at async r9.runApi (/var/task/node_modules/next/dist/compiled/next-server/server.runtime.prod.js:17:44515)
      at async r9.handleCatchallRenderRequest (/var/task/node_modules/next/dist/compiled/next-server/server.runtime.prod.js:17:38432)
      at async r9.runImpl (/var/task/node_modules/next/dist/compiled/next-server/server.runtime.prod.js:16:17376)
      at async r9.handleRequestImpl (/var/task/node_modules/next/dist/compiled/next-server/server.runtime.prod.js:16:16465),
  statusCode: undefined,
  context: {
    operation: 'fetching applications by contact ID',
    contactId: 'recwvNmg26KdwPECq'
  },
  timestamp: '2025-04-02T15:59:56.292Z',
  requestId: 'req_m9044ux0'
}

BROWSER CONSOLE ERRORS
rror fetching applications by user ID: AirtableError: An error occurred while fetching user by Auth0 ID. Please try again or contact support.
    at i (_app-c8849251bfbc0be5.js:1:73119)
    at s (_app-c8849251bfbc0be5.js:1:131265)
    at async s (_app-c8849251bfbc0be5.js:1:69115)
    at async u (_app-c8849251bfbc0be5.js:1:74165)
    at async queryFn (_app-c8849251bfbc0be5.js:1:173673)
overrideMethod @ hook.js:608
u @ _app-c8849251bfbc0be5.js:1
await in u
queryFn @ _app-c8849251bfbc0be5.js:1
fetchFn @ _app-c8849251bfbc0be5.js:1
v @ _app-c8849251bfbc0be5.js:1
start @ _app-c8849251bfbc0be5.js:1
fetch @ _app-c8849251bfbc0be5.js:1
#K @ _app-c8849251bfbc0be5.js:1
setOptions @ _app-c8849251bfbc0be5.js:1
(anonymous) @ _app-c8849251bfbc0be5.js:1
uI @ framework-840cff9d6bb95703.js:1
oU @ framework-840cff9d6bb95703.js:1
(anonymous) @ framework-840cff9d6bb95703.js:1
oI @ framework-840cff9d6bb95703.js:1
oC @ framework-840cff9d6bb95703.js:1
r8 @ framework-840cff9d6bb95703.js:1
(anonymous) @ framework-840cff9d6bb95703.js:1
_app-c8849251bfbc0be5.js:1 Error fetching user applications: AirtableError: An error occurred while fetching user by Auth0 ID. Please try again or contact support.
    at i (_app-c8849251bfbc0be5.js:1:73119)
    at s (_app-c8849251bfbc0be5.js:1:131265)
    at async s (_app-c8849251bfbc0be5.js:1:69115)
    at async u (_app-c8849251bfbc0be5.js:1:74165)
    at async queryFn (_app-c8849251bfbc0be5.js:1:173673)
overrideMethod @ hook.js:608
queryFn @ _app-c8849251bfbc0be5.js:1
await in queryFn
fetchFn @ _app-c8849251bfbc0be5.js:1
v @ _app-c8849251bfbc0be5.js:1
start @ _app-c8849251bfbc0be5.js:1
fetch @ _app-c8849251bfbc0be5.js:1
#K @ _app-c8849251bfbc0be5.js:1
setOptions @ _app-c8849251bfbc0be5.js:1
(anonymous) @ _app-c8849251bfbc0be5.js:1
uI @ framework-840cff9d6bb95703.js:1
oU @ framework-840cff9d6bb95703.js:1
(anonymous) @ framework-840cff9d6bb95703.js:1
oI @ framework-840cff9d6bb95703.js:1
oC @ framework-840cff9d6bb95703.js:1
r8 @ framework-840cff9d6bb95703.js:1
(anonymous) @ framework-840cff9d6bb95703.js:1
