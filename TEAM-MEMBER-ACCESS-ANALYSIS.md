# Team Member Access — Complete Feature Analysis & Re-Implementation Blueprint

> Source app: Pabbly Subscription Billing (Sails.js backend + React/Redux frontend).
> Every claim below is traced to real source with `file:line`. Verified by reading the actual files.

---

## 0. TL;DR — the mental model in 6 sentences

1. **"Team Member Access" lets a merchant (account owner) grant another *existing* platform user access to operate inside the owner's account**, at one of two permission levels: `full` or `read_only`.
2. There is **no invitation email and no token** — the invitee must already have a platform account (in the external **Users API**); adding them simply writes a *grant row* (`teammember` collection) and the grant is live instantly.
3. Access is exercised by **session impersonation**: the member logs into their own account, lists accounts shared with them, clicks "Access Now", and the server **rewrites their encrypted session** so `customer = merchant`, `accessed_by = member`, `permission = grant row`.
4. From then on every request runs through **`Auth.sessionAuth`**, which detects `accessed_by`, **re-reads the grant from the DB on every request**, and enforces permission **by HTTP method**: `full` → all methods; `read_only` → `GET` only.
5. The member is **scoped to the merchant's data** because every controller uses `session.customer.id` (now the merchant) as the `user_id` filter; members are additionally **hard-blocked from managing the team-member list itself**.
6. The frontend gating (hidden menus, `read-only-user` body class) is **cosmetic UX only** — the authoritative enforcement is server-side.

---

## 1. Feature Overview

### 1.1 What it does
Team Member Access is a **shared-account / delegated-access** feature. An account **owner (merchant)** invites other users to access and operate the owner's billing account without sharing credentials. It is implemented as an **account-impersonation model with a 2-level permission grant**, not as a multi-tenant team/org with seats.

### 1.2 Roles involved
| Role | Who | How identified at runtime |
|---|---|---|
| **Owner / Merchant** | The account holder who creates grants | Normal session: `session.customer` is them, **no** `accessed_by` |
| **Team Member (Full)** | Invited user with `global_permission = 'full'` | Impersonation session: `accessed_by` present, `permission.global_permission = 'full'` |
| **Team Member (Read-Only)** | Invited user with `global_permission = 'read_only'` | Impersonation session: `accessed_by` present, `permission.global_permission = 'read_only'` |

There is **no super-admin / manager tier and no per-module roles**. The entire role system is the single enum field `global_permission ∈ {full, read_only}` (`client/src/data/member-permissions.json`).

### 1.3 Permission system (summary — full detail in §8)
- **2-tier, global, method-based.** `full` = read+write everywhere; `read_only` = read-only everywhere (writes blocked).
- Stored as one string field `global_permission` on the `teammember` grant row.
- Enforced **once, centrally**, at the top of every controller via `Auth.sessionAuth` (`server/api/services/Auth.js:180-204`), keyed on `req.method`.
- **Not** RBAC-by-resource and **not** ABAC. `module_name` on routes is *only* for activity-log labelling, never authorization.

### 1.4 Access-control flow (one line)
`request → controller calls Auth.sessionAuth → decrypt session → if accessed_by: re-read grant from DB + allow/deny by method → (for team-mgmt endpoints) block if accessed_by → run query scoped to session.customer.id`.

### 1.5 "Invitation / join" flow (summary — full detail in §2)
There is **no accept step**. Owner adds member by email → server verifies the email belongs to a real platform account → grant row written → member instantly sees the account under "shared with me" and can switch into it. "Joining" = the grant existing.

### 1.6 How members are managed
Owner-only screen (`/app/setting/team-member`): list members, see stats (count full / count read-only), Add (modal), Update access (edit permission), Remove access (delete grant). Members get a separate "Accounts shared with you" table on the same screen with "Access Now" (switch in) and "Remove Access" (leave).

### 1.7 Owner / Member capabilities matrix
| Capability | Owner | Member (full) | Member (read-only) |
|---|---|---|---|
| Add / edit / remove team members | ✅ | ❌ (403 shared-block) | ❌ |
| View team-member admin page | ✅ | ❌ (redirected to `/`) | ❌ |
| Read merchant data (GET) | ✅ | ✅ | ✅ |
| Write merchant data (POST/PUT/DELETE) | ✅ | ✅ | ❌ (blocked in `sessionAuth`) |
| Manage Multi-Currency / API keys / Gateways | ✅ | ❌ (hidden/redirect) | ❌ |
| Switch into account / Exit access | n/a | ✅ | ✅ |
| Leave a shared account (`delete-shared`) | n/a | ✅ | ✅ |

---

## 2. Complete Workflow (end-to-end)

### 2.1 ASCII flow diagram

```
 OWNER SIDE                                   MEMBER SIDE
 ─────────                                    ──────────
 [Settings ▸ Team Members]
        │
        │ Add Team Member (email + permission)
        ▼
 POST /team-members ───────────────────────────────────────────┐
   Auth.sessionAuth (owner)                                     │
   block if accessed_by (owner only)                            │
   validate email + permission∈{full,read_only}                 │
   owner != member                                              │
   UsersApi.userByEmail(email)  ── must already exist ──────────┤
   dup guard (user_id, member_user_id)                          │
   TeamMember.create({user_id, user_email,                      │
        member_email, member_user_id, global_permission})       │
        │                                                        │
        │  (NO email, NO token, NO password — grant is instant)  │
        ▼                                                        │
   grant row persisted ─────────────────────────────────────────┘
                                                     │
                              member logs into THEIR OWN account
                                                     │
                                                     ▼
                              GET /team-members/get-shared
                                TeamMember.find({member_user_id: me,
                                                 user_id: {!= me}})
                                                     │
                                          "Accounts shared with you" list
                                                     │
                                          click "Access Now" (merchant_id)
                                                     ▼
                              POST /team-members/login/:merchant_id
                                Auth.sessionAuth (member)
                                UsersApi.userById(merchant_id)
                                TeamMember.findOne({user_id:merchant,
                                                    member_user_id:me})
                                session := {customer: MERCHANT,
                                            accessed_by: MEMBER,
                                            permission: grant}
                                UsersApi.createSession → encrypt → save
                                                     │
                                  redirect_url → window.location = base
                                                     ▼
                              ── now operating AS the merchant ──
                              every request: Auth.sessionAuth
                                 re-reads grant, enforces by method
                                 (full=all, read_only=GET only)
                                                     │
                                          click "Exit Access" (Topnav banner)
                                                     ▼
                              GET /team-members/logout
                                requires accessed_by
                                session := {customer: MEMBER}
                                                     │
                                       back to member's own account
```

### 2.2 Step-by-step

1. **Team "creation"** — There is no explicit team entity. A "team" is implicitly the set of `teammember` rows sharing the same `user_id` (owner). The owner account exists already; nothing is created to start a team.

2. **Invite member** — `POST /team-members` (`controllers/settings/teammember/create.js`):
   - `Auth.sessionAuth` authenticates the owner (`create.js:25`).
   - Shared-block: members can't invite (`create.js:31-33`).
   - Validate `member_email` and `global_permission` present (`create.js:37-43`).
   - Owner can't add self (`create.js:46-48`).
   - Validate permission enum `['full','read_only']` (`create.js:51-57`).
   - **`UsersApi.userByEmail(member_email)`** resolves the invitee to an existing platform account; if not found → `"Member email doesn't exist"` (`create.js:60-67`).
   - Duplicate guard on `(user_id, member_user_id)` (`create.js:75-82`).
   - `TeamMember.create({user_id, user_email, member_email, member_user_id, global_permission})` (`create.js:69-85`).

3. **Accept invitation** — **No accept flow exists.** The grant is active immediately. The member "discovers" it via `GET /team-members/get-shared` next time they're in their own account.

4. **Role assignment** — Done at invite time (`global_permission`), changed later via `PUT /team-members/:id` (`edit.js:57` → `TeamMember.updateOne({id,user_id}).set({global_permission})`). Only the permission level is mutable; the member identity/email cannot be edited.

5. **Permission checking** — On *every* request while impersonating, `Auth.sessionAuth` re-reads the grant from the DB and allows/denies by HTTP method (`Auth.js:180-204`). Live — revoking/downgrading takes effect on the very next request.

6. **Access restriction** — Two layers: (a) method-based read-only block in `sessionAuth`; (b) shared-block on team-management endpoints (`accessed_by` present → 403). Plus data scoping by `session.customer.id`.

7. **Removing members** — Two distinct paths:
   - **Owner revokes**: `DELETE /team-members/:id` → `delete.js:40` → `TeamMember.destroyOne({id, user_id})` (matched by row id + owner).
   - **Member leaves**: `DELETE /teammember/delete-shared/:user_id` → `delete-shared.js:34` → `TeamMember.destroyOne({user_id: <param=owner>, member_user_id: <session=member>})`.

8. **Updating roles** — `PUT /team-members/:id` with new `global_permission` (re-validated against the enum). Scoped by `user_id` so an owner can only edit their own grants.

9. **Team switching (account switching)** — This *is* a first-class feature:
   - Switch in: `POST /team-members/login/:merchant_id` (`login.js`) rewrites the session to impersonate the merchant.
   - Switch out: `GET /team-members/logout` (`logout.js`) restores the member's own session.
   - A member with grants on multiple merchants switches between them by exiting and entering again.

---

## 3. File Dependency Mapping

### 3.1 File tree (everything touching the feature)

```
server/
├── api/
│   ├── controllers/settings/teammember/
│   │   ├── create.js          # POST /team-members  — invite/grant
│   │   ├── edit.js            # PUT  /team-members/:id — change permission
│   │   ├── delete.js         # DELETE /team-members/:id — owner revoke
│   │   ├── delete-shared.js  # DELETE /teammember/delete-shared/:user_id — member leave
│   │   ├── get-all.js        # GET  /team-members — owner's member list (paginated)
│   │   ├── get-one.js        # GET  /team-members/:id — single grant
│   │   ├── get-shared.js     # GET  /team-members/get-shared — accounts shared WITH me
│   │   ├── stats.js          # GET  /team-members/stats — counts by permission
│   │   ├── login.js          # POST /team-members/login/:merchant_id — switch IN
│   │   └── logout.js         # GET  /team-members/logout — switch OUT
│   ├── models/
│   │   ├── TeamMember.js     # `teammember` collection — the grant row (schemaless)
│   │   ├── User.js           # thin local mirror; real accounts live in Users API
│   │   ├── SubAccounts.js    # ⚠ UNRELATED (billing artifact) — do NOT use as the link
│   │   └── AdminPlans.js     # plan limits — NO member limit field exists
│   ├── services/
│   │   ├── Auth.js           # sessionAuth() = the gatekeeper + (dead) checkPermission()
│   │   ├── UsersApi.js       # userByEmail(), userById(), createSession()
│   │   └── Encryption.js     # AES-256-CBC encrypt/decrypt of session.user
│   ├── models/ActivityLogs.js# createLogs() — consumes route module_name (logging only)
│   └── policies/
│       ├── isAuthenticated.js# admin-only (Passport) — NOT used by this feature
│       └── sessionAuth.js    # exists but UNWIRED (not mapped in policies.js)
└── config/
    ├── routes/teamMemberRoutes.js  # the 10 route declarations
    ├── routes.js                  # aggregates teamMemberRoutes (routes.js:56)
    ├── policies.js                # only admin/* gated; team routes ungated
    ├── session.js                # Mongo-backed encrypted session, 24h cookie
    └── payments.js                # appDomains allow-list (host check in sessionAuth)

client/src/
├── actions/MemberAction.js        # 10 Redux action creators (one per endpoint)
├── reducers/MemberReducer.js      # state key `teammember`; 5 load cases
├── reducers/index.js              # combines MemberReducer as `teammember` (:71)
├── functions/
│   ├── isSharedMember.js          # isSharedMember(), haveFullAccess()
│   ├── callApi.js                # CSRF-aware API caller (injects _csrf)
│   └── Helper.js                 # clearAllFilterState()
├── data/member-permissions.json   # the {full, read_only} option list
├── components/settings/teammember/
│   ├── TeamMember.js             # list + stats + shared-accounts + switch-in/out
│   ├── AddTeamMember.js          # invite modal (redux-form)
│   └── EditTeamMember.js         # edit-permission modal (route-nested)
├── components/
│   ├── Wrapper.js                # adds `read-only-user` body class (:252)
│   ├── Topnav.js                 # "logged in as / Exit Access" banner (:615-630)
│   └── custom/DialogBox.js       # suppresses success toast for read-only (:54)
├── components/settings/
│   ├── Setting.js                # hides Team/API/Multi-currency nav for members
│   ├── MultiCurrency.js          # redirects shared members away
│   ├── ConnectedGateway.js       # hides gateway actions for members (:168)
│   └── ApiSetting.js             # redirects shared members away (:50-53)
└── css/css-chart.css              # `.read-only-user` rules disable write controls (:764-785)
```

### 3.2 Dependency chains (who calls what)

**Backend — write request while impersonating (e.g. PUT /subscription):**
```
Sails router (attaches req.options.module_name)
  └─ (no policy — team routes ungated)
      └─ Controller.fn
          └─ Auth.sessionAuth(req)                         [Auth.js:166]
              ├─ Encryption.decrypt(session.user)          [Encryption.js]
              ├─ TeamMember.findOne({user_id, member_user_id})  [re-read grant, Auth.js:184]
              ├─ enforce read_only/full by req.method      [Auth.js:193-203]
              ├─ ActivityLogs.createLogs(...)              [Auth.js:211]
              └─ host allow-list check                     [Auth.js:217]
          └─ query scoped to session.customer.id (merchant)
```

**Backend — switch in:**
```
POST /team-members/login/:merchant_id → login.js
  ├─ Auth.sessionAuth(req)              # authenticate member
  ├─ UsersApi.userById(merchant_id)     # fetch merchant object  [UsersApi.js:182]
  ├─ TeamMember.findOne({user_id:merchant, member_user_id:me})  # load grant
  └─ UsersApi.createSession(req, {customer:merchant, accessed_by:member, permission})
        └─ Encryption.encrypt(JSON.stringify(...)) → req.session.user → req.session.save()
```

**Frontend — invite:**
```
AddTeamMember.js (redux-form submit)
  └─ MemberAction.addTeamMember(values, cb)
        └─ callApi('team-members','POST', values)   # injects _csrf
              └─ axios → POST /team-members
        └─ on success: getTeamMembers() + getTeamMemberStats(); modal hide; form reset
```

**Frontend — switch in / out:**
```
TeamMember.loginNow(user_id)
  └─ MemberAction.loginInSharedAccount(user_id, cb)  → POST /team-members/login/:id
        └─ on success: clearAllFilterState(); window.location = response.data.redirect_url

Topnav.logoutSharedMember()
  └─ MemberAction.logoutSharedAccount(cb)  → GET /team-members/logout
        └─ on success: clearAllFilterState(); window.location = accountpath()
```

### 3.3 Per-file purpose & connections (condensed)
- **`teamMemberRoutes.js`** — declares the 10 routes + `module_name`. Connects URLs → controllers. Imported by `routes.js`.
- **`create/edit/delete/get-*/stats/login/logout.js`** — Sails *actions2* modules; each begins with `Auth.sessionAuth`; all read/write `TeamMember`; `login/logout` additionally call `UsersApi`. No service is `require`d — `Helper/Auth/UsersApi/Response/Logs/TeamMember/_` are Sails globals.
- **`TeamMember.js` (model)** — the single source of truth for grants; queried by `user_id` (owner view), by `member_user_id` (member view), by both (uniqueness + enforcement). `getByAggregate()` powers stats.
- **`Auth.js`** — `sessionAuth()` is the linchpin (auth + permission + logging + host check). `checkPermission()` is **dead, broken** code (see §8/§10).
- **`UsersApi.js`** — bridges to the external accounts platform; only place sessions are minted/rewritten.
- **`Encryption.js`** — AES-256-CBC for the session payload.
- **`MemberAction.js` / `MemberReducer.js`** — Redux glue; reducer only stores GET results, mutations rely on imperative callbacks + re-fetch.
- **`isSharedMember.js`** — the client's role detector; consumed by Wrapper/Topnav/DialogBox/Setting/MultiCurrency/ConnectedGateway/ApiSetting for conditional rendering.
- **`TeamMember.js` (component)** — the whole UI surface: member list, stats cards, shared-accounts table, switch-in (`loginNow`), remove flows, pagination, embeds `EditTeamMember` as a nested route.

---

## 4. Authentication & Authorization Analysis

### 4.1 Which auth mechanism (there are four; only one matters here)
| Mechanism | Consumer | Established by | Validated by |
|---|---|---|---|
| **Sails/Express session (Mongo, AES-encrypted)** | **Owner + Team Member** | `UsersApi.createSession()` → `req.session.user` | **`Auth.sessionAuth(req)`** |
| Passport (API key) | Public REST API v1/v2 | API credential | `Auth.isValidApi()` |
| Passport `req.isAuthenticated()` | Admin panel only | Admin login | `isAuthenticated` policy (`policies.js:53`) |
| JWT | Customer portal | Portal login | `Auth.portalSessionAuth()` |

**The owner and the member use the identical session mechanism.** A member is just a normal session whose identity has been re-pointed at the merchant, with an `accessed_by` marker.

### 4.2 Session: what's stored & how
- Stored as a **single AES-256-CBC-encrypted string** `req.session.user` (`Encryption.js:4` 32-byte key; `UsersApi.js:289`).
- Backed by **Mongo `sessions` collection**, **24h** cookie (`session.js:34-37,89-91`), `saveUninitialized:false`, `resave:false`.
- Decrypted shape:
  - Owner: `{ customer: <owner>, token }` — no `accessed_by`.
  - Member (impersonating): `{ customer: <merchant>, accessed_by: <member>, permission: <grant row> }` (`login.js:48-52`).
- `session.customer.id` is the effective `user_id` everywhere. The "shared flag" is simply **presence of `accessed_by`**.

### 4.3 Protected routes & middleware chain
- **Team routes have NO Sails policy.** `policies.js` only maps `admin/*` → `isAuthenticated`. `sessionAuth.js` exists as a policy but is **not wired**. Auth is enforced **inline** by each controller calling `Auth.sessionAuth(this.req)` first.
- Order for a protected request: **router (sets `module_name`) → CSRF (global) → controller `fn` → `Auth.sessionAuth` (decrypt, content-type guard, permission gate, activity log, host allow-list) → shared-block (team-mgmt endpoints only) → DB query scoped by `session.customer.id`.**

### 4.4 `Auth.sessionAuth` internals (verified `Auth.js:166-227`)
1. Require `req.session.user`, else `'Session expired please login again.'` (`:223-224`).
2. **Content-type guard**: non-multipart `POST/PUT/DELETE` must be `application/json`, else `'Access denied'` (`:171-175`). *(This is why the React client must send JSON.)*
3. Decrypt session (`:177`).
4. **If `accessed_by`** → re-read grant + enforce by method (`:180-204`, see §8).
5. **Activity log** attributed to the member if shared, else owner (`:207-214`).
6. **Host allow-list**: `sails.config.payments.appDomains.includes(req.hostname)` else `'Access denied'` (`:217-222`).
7. Resolve decrypted session to the controller.

### 4.5 Ownership checks & team-scoped isolation
- Every controller derives `const user_id = session.customer.id;` and filters all queries by it. While impersonating, that **is** the merchant — there is no way to query by the member's own id in shared mode.
- `edit/delete/get-one` add `user_id` to the match so a member/owner can't touch another merchant's row by guessing an `id`.
- To *become* a member requires the merchant to have created the grant, and `login.js:44` re-verifies it; without the row, `sessionAuth` later rejects `"Permission not specified"`.

### 4.6 Frontend access restrictions (cosmetic)
- `isSharedMember(user)` / `haveFullAccess(user)` (`isSharedMember.js:8-19`) drive: redirect away from owner-only pages, hide nav items, show "Access" banner, and add the `read-only-user` body class. **All cosmetic** — the backend is authoritative (§11).

---

## 5. Database Analysis

### 5.1 `TeamMember` — collection `teammember` (the grant)
The model declares **only** `user_id: {type:'string'}` and is **schemaless** (`TeamMember.js:16-33`); the real schema is whatever `create.js` writes:

| Field | Type | Source | Required | Meaning |
|---|---|---|---|---|
| `_id`/`id` | ObjectId | Waterline | auto | PK |
| `user_id` | string | `create.js:52` (`=session.customer.id`) | always | **Owner/merchant FK** (the account being shared) |
| `user_email` | string | `create.js:69` | always | Owner email (denormalized) |
| `member_email` | string | `create.js:70` | always | Invited member email |
| `member_user_id` | string | `create.js:71` (`=user.id` from Users API) | always | **Member FK** (external platform id) — drives shared login |
| `global_permission` | string | `create.js:72` | always | **Role**: `'full'` \| `'read_only'` |
| `createdAt`/`updatedAt` | Date | hooks `TeamMember.js:38-59` | auto | timestamps (coerced to Date) |

- **No password, no status/active flag, no invitation token, no expiry.** Auth is delegated to the external Users API; a row is purely a *grant*.
- **Uniqueness** of `(user_id, member_user_id)` is **application-level** (`create.js:75-82`), not a DB index.
- **No indexes defined** (no `createIndexes()`). Recommended for re-implementation: unique compound `{user_id:1, member_user_id:1}` + secondary `{member_user_id:1}`.
- **Lifecycle hooks** only normalize timestamps — **no password hashing** (contrast `Customer`).
- Helper `getByAggregate(pipeline)` (`TeamMember.js:66-80`) powers `stats.js` (`$group by global_permission`).

### 5.2 Relationship mapping (ER)
```
 OWNER (Users-API id = A)                      MEMBER (Users-API id = M)
 email owner@x.com                             email mem@x.com
        │                                              │
        │ user_id=A, user_email=owner@x.com   member_user_id=M, member_email=mem@x.com
        ▼                                              │
 ┌─────────────────────── teammember ───────────────────────┐
 │ _id, user_id=A, user_email, member_user_id=M, member_email │
 │ global_permission ∈ {full, read_only}, createdAt/updatedAt │
 │ uniqueness (user_id, member_user_id) enforced in app code  │
 └────────────────────────────┬───────────────────────────────┘
                              │ loaded at login (login.js:44)
                              ▼
        SESSION (runtime only — NOT a DB row)
        { customer: A (merchant), accessed_by: M (member), permission: <row> }
```

### 5.3 Data lifecycle
`create (grant) → active (login reads it) → edit (change permission) → destroy (owner: delete by id+user_id  | member: delete-shared by owner-param+own member_user_id)`. Hard delete (`destroyOne`), no soft-delete/status.

### 5.4 ⚠ `SubAccounts` is NOT related
`SubAccounts.js` (`subaccounts`: `user_id, customer_id, subscription_id, plan_id, type`) is a **billing artifact** for the reserved API and **never references team members**. Do not mistake it for the owner↔member link. The link is the `teammember` row + the runtime session shape.

### 5.5 AdminPlans / limits
`AdminPlans.js` has `customer_limit, affiliate_limit, tax_limit, custom_gateway_limit, custom_domain_limit` — **no member limit**, and `create.js` performs **no count/limit check**. Team members are currently **unbounded** by plan tier. (Add a `member_limit` field + count check if you want caps.)

---

## 6. API Analysis

All routes in `server/config/routes/teamMemberRoutes.js`; all controllers are *actions2* with `exits.invalid → 400`; all authenticate inline via `Auth.sessionAuth`.

| # | Method + Path | Controller | Body / Params | Auth | Shared-block? | DB op | Success response |
|---|---|---|---|---|---|---|---|
| 1 | `GET /team-members` | get-all | `?page,per_page` | sessionAuth | ✅ | `count`+`find({user_id},sort createdAt DESC)` | `Response.results(list,size,exist)` |
| 2 | `GET /team-members/:id` | get-one | `:id` | sessionAuth | ✅ | `findOne({id,user_id})` | `Response.success(row)` |
| 3 | `POST /team-members` | create | `{member_email, global_permission}` | sessionAuth | ✅ | `UsersApi.userByEmail`+`count`+`create` | `success("...added with X permission")` |
| 4 | `PUT /team-members/:id` | edit | `:id` + `{global_permission}` | sessionAuth | ✅ | `updateOne({id,user_id}).set(...)` | `success("Permission updated")` |
| 5 | `DELETE /team-members/:id` | delete | `:id` | sessionAuth | ✅ | `destroyOne({id,user_id})` | `success("Permission removed")` |
| 6 | `DELETE /teammember/delete-shared/:user_id` | delete-shared | `:user_id` (=owner) | sessionAuth | ❌ | `destroyOne({user_id:param, member_user_id:me})` | `success("Permission removed")` |
| 7 | `GET /team-members/stats` | stats | — | sessionAuth | ✅ | `getByAggregate($group global_permission)` | `success({full:{count},read_only:{count}})` |
| 8 | `GET /team-members/get-shared` | get-shared | — | sessionAuth | ❌ | `find({member_user_id:me, user_id:{'!=':me}})` | `success([{id,user_email,global_permission,user_id}])` |
| 9 | `POST /team-members/login/:merchant_id` | login | `:merchant_id` | sessionAuth | ❌ | `userById`+`findOne(grant)`+`createSession` | `success({redirect_url})` |
| 10 | `GET /team-members/logout` | logout | — | sessionAuth | ❌ (requires `accessed_by`) | `createSession({customer:accessed_by})` | `success("logged out")` |

### 6.1 Validation rules (create/edit)
- `member_email` required; `global_permission` required; `global_permission ∈ {full, read_only}`; owner ≠ member; invitee email must resolve via `UsersApi.userByEmail`; `(user_id, member_user_id)` unique.

### 6.2 Response envelopes (`Response.js`)
- `success(msg, data?)` → `{status:'success', message, data?}`
- `results(msg, list, count, exist)` → `{status:'success', message, data:{list, size, record_exist, all_count}}`
- `error(msg)` → `{status:'error', message}`

### 6.3 Error handling
- **403** (`res.forbidden`) — sessionAuth rejection (expired / non-JSON write / wrong host / read-only write attempt / missing grant) **and** the shared-block on team-mgmt endpoints.
- **400** (`exits.invalid` + `Response.error`) — missing/invalid inputs, unknown invitee, duplicate, Users-API failure, logout-when-not-impersonating.

### 6.4 Known route/code bugs (carry-forward fixes)
- **Route order**: `GET /team-members/:id` is declared **before** `/stats` and `/get-shared`, so those literals are shadowed by `:id` → register literals first.
- **`login.js:46`** calls `reject(err)` but `reject` is undefined inside an actions2 `fn` → use `throw err`.

---

## 7. Frontend Flow

### 7.1 Redux actions (`MemberAction.js`) — all via `callApi` (CSRF-aware, `withCredentials`)
`addTeamMember`(POST team-members) · `updateTeamMember`(PUT) · `deleteTeamMember`(DELETE) · `deleteSharedAccess`(DELETE teammember/delete-shared/:id) · `getTeamMembers`(GET) · `getTeamMember`(GET :id) · `getTeamMemberStats`(GET stats) · `getSharedAccounts`(GET get-shared) · `loginInSharedAccount`(POST login/:id) · `logoutSharedAccount`(GET logout). Payload is the `callApi` **promise** (redux-promise resolves it); each also takes an imperative `callback`.

### 7.2 Reducer (`MemberReducer.js`, key `teammember`)
Only 5 **load** cases write state: `teammember`(add resp), `memberlist`, `membersingle`, `memberstats`, `sharedaccounts`. **No cases** for update/delete/login/logout — those rely on the callback + re-fetch. Shapes: `memberlist={list,size}`; `memberstats={full:{count},read_only:{count}}`; `sharedaccounts=[{id,user_email,global_permission,user_id}]`; `membersingle={member_email,global_permission}`.

### 7.3 List screen (`components/settings/teammember/TeamMember.js`)
- **Mount guard**: `isSharedMember(user)` → `window.location='/'` (members can't view this page).
- **Stats cards**: "Full Access" count + "Read Only" count (loader overlay while loading).
- **Members table**: S.No / Member Email / Permission Type / Assigned On + actions (Update/Remove). (Per-row dropdown is currently `d-none`.)
- **Remove**: `deleteTeamMember` → swal → re-fetch stats+list.
- **Shared-with-me table**: Access Shared By / Permission / "Access Now" / Remove Access.
- **Switch in** (`loginNow`): `loginInSharedAccount(user_id)` → `clearAllFilterState()` → `window.location = redirect_url`.
- **Pagination**: ReactPaginate; per-page 10/20/30/50/100/250; `{page,per_page}` to `getTeamMembers`.
- Embeds `<Route .../team-member-edit/:member_id component={EditTeamMember}/>`.

### 7.4 Add / Edit forms (redux-form)
- **AddTeamMember** (modal `#add_team_member`): `member_email` (InputField) + `global_permission` (Select2 from `member-permissions.json`). Validate both required. Submit → `addTeamMember` → swal + re-fetch + modal hide + form reset.
- **EditTeamMember** (route-nested modal): loads `getTeamMember(id)` → `initialize({member_email, global_permission})`; submit → `updateTeamMember(id, values)`; closing modal navigates back to the list.

### 7.5 Role-conditional rendering (all via `isSharedMember`/`haveFullAccess`)
- `Wrapper.js:252` — adds `read-only-user` body class when shared **and** not full.
- `Topnav.js:615-630` — "👋 {member} logged in as: {merchant}" banner + **Exit Access** (`logoutSharedAccount`).
- `DialogBox.js:54` — suppresses success toast for read-only.
- `Setting.js` — hides Team Members / API Settings / Multi-Currency nav for members; redirects on multi-currency route.
- `MultiCurrency.js`, `ApiSetting.js` — redirect shared members to `/`.
- `ConnectedGateway.js:168` — hides gateway action dropdown for members.

### 7.6 Loading / error
Per-section `Loader` overlays (`showLoader`, `showStatsLoader`, `showSharedDataLoader`, `exitAccessLoading`); errors via `sweetalert2`.

---

## 8. Permission System Breakdown

### 8.1 Model: 2-tier, global, method-based (NOT resource RBAC/ABAC)
- One enum field `global_permission ∈ {full, read_only}`.
- **Enforced centrally** in `Auth.sessionAuth` (`Auth.js:180-204`), keyed on `req.method`:
  - `full` → `restrictedMethods = ['POST','PUT','PATCH','DELETE','GET']` all allowed.
  - `read_only` → **only `GET`** allowed; any write → `'You have been granted Read-Only permissions...'`.
- **Re-read from DB every request** (`Auth.js:184`) → revocation/downgrade is immediate; the session value is never trusted for authorization.

### 8.2 Hardcoded vs dynamic
- The **enum** is hardcoded in three places that must stay in sync: backend `create.js:51` + `edit.js:46`, frontend `data/member-permissions.json`.
- The **grant** (who has which level on which account) is dynamic DB data.

### 8.3 `module_name` is NOT authorization
Every route carries `module_name` (e.g. `'teamMember'`, `'teamMemberLogin'`) but it's consumed **only** by `ActivityLogs.createLogs` for labelling (`ActivityLogs.js:113-115,161`). There is **no per-module ACL**.

### 8.4 Reusable utilities
- Backend: `Auth.sessionAuth` (gate), `Helper.hasProp(session,'accessed_by')` (shared detector / shared-block).
- Frontend: `isSharedMember()`, `haveFullAccess()`.

### 8.5 Dead code — do not port
`Auth.checkPermission()` (`Auth.js:133-161`) is **broken & unused**: references undefined `req`, reads wrong fields (`.user_id` vs `.id`), and hangs when `accessed_by` is absent (never resolves). The live logic is the inline block in `sessionAuth`.

---

## 9. Dependencies & Services

### 9.1 Backend (npm / platform)
- **Sails.js** (`actions2`, Waterline ORM, global services), **MongoDB** (`mongo` session adapter + `sessions` collection).
- **`bcrypt`** (`Auth.hashPassword/comparePassword`) — used for portal/customer accounts, **not** for members (member auth is upstream).
- **AES-256-CBC** via Node `crypto` (`Encryption.js`).
- **External "Users API"** (HTTP, basic-auth via `Functions.axios`) — `userByEmail`, `userById`, plus session enrichment. **This is the real identity provider**; the local `User` model is a thin mirror.
- **Winston** (`Logs`), **lodash** (`_.keyBy` in stats).
- **No email provider, no JWT, no websockets/realtime** are involved in this feature.

### 9.2 Frontend (npm)
- **react / redux / react-redux / redux-promise** (promise payload auto-resolve), **redux-form** (Add/Edit forms), **axios** (via `callApi`, `withCredentials`), **sweetalert2**, **react-paginate**, **react-router** (nested edit route), **bootstrap** (modals), `crypto-js` (client encryption lib, used app-wide).

### 9.3 Environment variables / config
- `DEV_DB_SESSION_STRING` — Mongo session store URL (`session.js:90`).
- `sails.config.payments.appDomains` — host allow-list (`payments.js`), checked in `sessionAuth`.
- **Hardcoded secrets to externalize**: session `secret` (`session.js:24`), `ENCRYPTION_KEY` (`Encryption.js:4`), Users-API base URL + basic-auth creds.

---

## 10. Important Hidden Logic

1. **No invitation email / token / password** — `create.js` never calls `EmailApi`/`Validate`/`hashPassword`. The invitee must pre-exist in the Users API; "acceptance" is implicit. *(Re-implementers expecting an email-invite flow will be surprised.)*
2. **`accessed_by` is the entire shared-mode sentinel** — its presence triggers permission enforcement (`Auth.js:180`), the shared-block on team-mgmt endpoints, the frontend banner, and the body class.
3. **Permission re-read every request** — not cached in session; immediate revocation.
4. **Identity swap = data isolation** — because `session.customer` becomes the merchant, *all* existing controllers transparently scope to the merchant with zero per-controller changes.
5. **`tokenlogin` preserves impersonation** — `UserController.tokenlogin` detects an existing shared session (`accessed_by.id === user.id`) and preserves `customer/accessed_by/permission` so an SSO refresh doesn't silently drop the member.
6. **Two different delete semantics** — owner `delete` (by `id`+`user_id`) vs member `delete-shared` (by owner-param + own `member_user_id`).
7. **GET-mutation bypass risk** — read-only is method-based, so any side-effecting `GET` would slip past it.
8. **Route shadowing & `reject` bug** — see §6.4.
9. **`read-only-user` is CSS-only** (`css-chart.css:764-785`) — disables buttons visually but doesn't remove handlers; security relies on the backend.
10. **Content-type guard doubles as CSRF hardening** — non-multipart writes must be `application/json` (`Auth.js:171-175`).

---

## 11. Security Analysis

**Strengths**
- **Backend is the real enforcement point** — read-only write-block lives in `sessionAuth`, run at the top of every protected controller; frontend hiding is cosmetic.
- **Permission re-validated from DB every request** → immediate revoke/downgrade.
- **Session payload AES-256-CBC encrypted**, server-side in Mongo; cookie holds only a session id; 24h lifetime.
- **Structural ownership isolation** — identity swap + `user_id` scoping; team-mgmt endpoints additionally hard-block `accessed_by` (prevents a member escalating by editing the grant list).
- **Audit trail** — activity logs attribute shared actions to the member and scrub secrets (`password/token/_csrf/...`).
- **Host allow-list** + content-type guard on top of Sails CSRF tokens.

**Weaknesses / fix when re-implementing**
- **Hardcoded secrets** (session secret, encryption key) — move to env/secret manager. The legacy `Encryption.en/de` (static password `crypto.createCipher`) is insecure — avoid.
- **Coarse read-only** — method-based only; a read-only member can `GET` *everything* (all customers/transactions/exports). Add resource/module-level checks if needed.
- **GET-mutation bypass** — don't perform side effects on `GET`, or enforce per-action.
- **Dead `checkPermission`** — delete to avoid future misuse.
- **Cookie flags** — set `Secure`/`HttpOnly`/`SameSite` in production (currently `secure` commented in `session.js`).
- **No member limit** — add plan-tier cap if abuse is a concern.

---

## 12. Implementation Blueprint (rebuild guide)

### 12.1 Recommended implementation order
1. Identity provider decision → 2. Grant data model + indexes → 3. Session + encryption → 4. Central auth/permission gate → 5. CRUD + discovery endpoints → 6. Switch-in/out (impersonation) endpoints → 7. Frontend Redux + screens → 8. Frontend role gating → 9. Hardening → 10. Tests.

### 12.2 Backend setup
- **Identity**: decide whether members are pre-existing platform users (this app's model, via an external Users API) **or** email-invited new users. If invite-based, add: `invitation_token`, `status (pending|active)`, `expires_at`, and an email step — none of which exist here.
- **Model `team_member`** (grant): `owner_id`, `owner_email`, `member_id`, `member_email`, `permission ('full'|'read_only')`, timestamps. Add **unique index `(owner_id, member_id)`** + index `(member_id)`.
- **Session**: server-side store (Mongo/Redis), encrypted payload, short TTL, `Secure/HttpOnly/SameSite` cookies. Session shape: `{ customer, accessed_by?, permission? }`.
- **Central gate** (`authGuard(req)`), run first in every protected handler:
  1. require session; 2. content-type guard on writes; 3. decrypt; 4. **if `accessed_by`: re-read grant from DB; allow by method (`full`=all, `read_only`=GET)** — better: explicit per-action allow-list, not raw method; 5. activity log; 6. host check.
- **Shared-block helper**: on team-management endpoints, reject if `accessed_by` present.
- **Data scoping**: every query filters by `session.customer.id`.

### 12.3 API setup (10 endpoints)
List / get-one / create(grant) / edit(permission) / delete(owner) / delete-shared(member-leave) / stats / get-shared(discover) / login(:id switch-in) / logout(switch-out). **Register literal routes (`/stats`, `/get-shared`) before `/:id`.** Validate permission enum on create+edit; dedupe; block owner-as-self.

### 12.4 Impersonation
- **Switch in**: verify grant exists → set session `{customer: merchant, accessed_by: member, permission}` → persist (await save) → return redirect URL.
- **Switch out**: require `accessed_by` → reset session `{customer: member}`.
- Never mint new credentials/JWT — rewrite the existing session.

### 12.5 Database setup
Single `team_member` collection as above. (If invite-based, add token/status/expiry.) No separate "team" or "members-of-team" tables are required for this model.

### 12.6 Frontend setup
- **State**: `teamMember` slice with `memberlist{list,size}`, `membersingle`, `memberstats{full,read_only}`, `sharedaccounts[]`.
- **Actions**: one per endpoint via a CSRF-aware API client; re-fetch list+stats after mutations.
- **Screens**: members table + stats cards + Add modal + Edit (route modal) + shared-with-me table with "Access Now"/"Remove".
- **Role gating**: `isSharedMember()` + `haveFullAccess()`; redirect members from owner-only pages; show "logged in as / Exit" banner; apply a read-only body class. **Treat all of this as UX only.**

### 12.7 Role system setup
Permission enum in exactly one shared source of truth (don't triplicate). Map permission→allowed-actions explicitly server-side (avoid the raw-method heuristic).

### 12.8 Testing flow
- **Unit**: enum validation, dedupe, owner-as-self block, grant re-read.
- **AuthZ**: read-only member blocked on POST/PUT/DELETE (and any side-effecting GET); full member allowed; revoked member rejected on next request; member can't hit team-mgmt endpoints (shared-block); member can't reach another merchant's row by `id`.
- **Session**: switch-in sets correct shape & persists before redirect; switch-out restores; SSO refresh preserves impersonation.
- **E2E**: owner invites → member discovers → switches in → performs allowed/blocked actions → exits → owner edits role → member sees change → owner/member delete paths.

---

## 13. Quick reference — exact file:line anchors

| Concern | Anchor |
|---|---|
| Permission enforcement (live) | `server/api/services/Auth.js:180-204` |
| Dead permission code | `server/api/services/Auth.js:133-161` |
| Session decrypt + content-type + host | `server/api/services/Auth.js:166-227` |
| Invite/grant | `server/api/controllers/settings/teammember/create.js:25-95` |
| Switch in | `.../login.js:26-58` (session shape `:48-52`) |
| Switch out | `.../logout.js:29-34` |
| Member-leave | `.../delete-shared.js:34` |
| Owner-revoke | `.../delete.js:40` |
| Discover shared | `.../get-shared.js:32-35` |
| Stats aggregation | `.../stats.js:36-54` |
| Routes (+ ordering bug) | `server/config/routes/teamMemberRoutes.js:5-14` |
| Session mint | `server/api/services/UsersApi.js:246,289-298` |
| Grant model | `server/api/models/TeamMember.js:16-80` |
| Client role detector | `client/src/functions/isSharedMember.js:8-19` |
| Permission enum (client) | `client/src/data/member-permissions.json` |
| Read-only body class | `client/src/Wrapper.js:252` |
| "Logged in as" banner | `client/src/components/Topnav.js:615-630` |
