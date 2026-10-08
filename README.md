<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Database setup

The backend uses Prisma 7 with PostgreSQL. Copy `.env.example` to `.env` and set
`DATABASE_URL` to a PostgreSQL database the backend can access.

Generate the Prisma Client and create/apply the initial development migration:

```bash
$ npm run prisma:generate
$ npm run prisma:migrate -- --name init
$ npm run prisma:seed
```

Use `npm run prisma:deploy` to apply committed migrations in a deployment
environment. The NestJS application registers a shared `PrismaService` through
`PrismaModule`; it connects during application startup and disconnects during
shutdown. The seed command requires `PLATFORM_ADMIN_EMAIL` and
`PLATFORM_ADMIN_PASSWORD` in `.env`; use a unique email and a password of at
least 12 characters. It creates or updates the single seeded platform admin,
storing only a bcrypt password hash.

## Authentication

Set `JWT_SECRET` in `.env` to a long, random secret. The login endpoint is
`POST /auth/login` and accepts:

```json
{
  "email": "admin@example.com",
  "password": "your-platform-admin-password"
}
```

It returns a 15-minute bearer access token and safe user details. Send the
token as `Authorization: Bearer <accessToken>` on authenticated requests.

## Organization onboarding

Platform organization routes require an active platform administrator bearer
token. The server verifies the token and reloads the user and organization
status from PostgreSQL for every request; the role in the token is not trusted
for authorization.

- `POST /platform/organizations` creates an active organization. Send `{ "name":
"YORK" }`; a URL-safe slug is generated from the name. An optional `slug` can
  be supplied.
- `GET /platform/organizations` lists organizations and user/invitation counts.
- `GET /platform/organizations/:id` returns organization details.
- `PATCH /platform/organizations/:id` updates the name or slug.
- `PATCH /platform/organizations/:id/status` accepts `{ "status": "SUSPENDED" }`
  or `{ "status": "ACTIVE" }`. Suspended organizations cannot use normal
  organization endpoints or accept invitations.
- `POST /invitations` is the single invite-creation route. It accepts `{ "email":
  "user@example.com", "role": "MANAGER", "organizationId": "org-id" }`.
  `organizationId` is omitted for a global `PLATFORM_ADMIN` invitation.
  Authorization is based on the authenticated user's current database role:
  - Platform Admin → any role. Non-platform roles require an organization ID.
  - Organization Admin → Manager or Employee in their own organization.
  - Manager → Employee in their own organization.
  - Employee → cannot invite users.
    Organization invites require an active organization. Non-platform
    organization roles require an existing organization admin. Platform Admins
    can invite an organization admin at any stage, and organization users cannot
    grant Platform Admin access. Invitations expire after seven days. In
    non-production environments, the response includes the raw token for
    testing; only its SHA-256 hash is stored.
- `POST /invitations/accept` accepts `{ "token": "...", "name": "...",
"password": "at-least-12-characters" }` and activates the account using the
  role and organization scope selected by the inviter. A global platform-admin
  invitation creates a platform admin without an organization.

Invitation tokens are returned only outside production; configure an email
delivery provider before using invitations in production.
Invitation routes and their repository/business logic live in the dedicated
`InvitationsModule`, separate from organization lifecycle management.
Apply the schema change with a Prisma migration before starting the updated
application.

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
