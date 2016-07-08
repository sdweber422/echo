# game

[ ![Codeship Status for LearnersGuild/game](https://codeship.com/projects/8ee1a1d0-17e4-0134-1d69-2a776fb5d411/status?branch=master)](https://codeship.com/projects/158610)

This is the game service.

## Getting Started

Be sure you've read the [instructions for contributing](./CONTRIBUTING.md).

1. Clone the repository.

2. Setup and run [mehserve][mehserve]. Then figure out which port you intend to use and create the mehserve config file:

```bash
echo 9005 > ~/.mehserve/game.learnersguild
```

3. Set your `NODE_ENV` environment variable:

```bash
export NODE_ENV=development
```

4. [Install RethinkDB][install-rethinkdb].

5. Create your `.env.development` file for your environment. Example:

```
PORT=9005
APP_BASEURL=http://game.learnersguild.dev
REDIS_URL=redis://localhost:6379
RETHINKDB_URL=rethinkdb://localhost:28015/game_development
IDM_RETHINKDB_URL=rethinkdb://localhost:28015/idm_development
# To support extending JWT sessions:
IDM_BASE_URL=http://idm.learnersguild.dev
CHAT_BASE_URL=http://echo.learnersguild.dev
CHAT_API_USER_SECRET='s3cr3t-p@ssw0rd'
JWT_PRIVATE_KEY="<get from IDM service>"
JWT_PUBLIC_KEY="<get from IDM service>"
```

6. Install dependencies:

```bash
npm install
```

7. Create a test database

```bash
npm run db:create
```

```bash
npm run db:migrate -- up
```

8. (OPTIONAL) Generate some test data.  

In your `idm` repo directory, run:
```bash
# generate random users
npm run data:testdata
```
Continue in your `game` repo directory:
```bash
# find your user ID and write to `/tmp/users.txt`
npm run data:playtest -- --confirm --votes --users=tmp/users.txt "Playtest Chapter"
```

9. Run the server:

```bash
npm start
```

10. Visit the server in your browser:

```bash
open http://game.learnersguild.dev
```

11. Start the workers

```bash
npm run workers
```

## Continuous Integration

We use [Codeship](https://codeship.com/) for continuous integration. The following files are responsible for CI configuration:

- `Dockerfile`: basic Docker image for the app
- `codeship-services.yml`: similar to `docker-compose.yml`, but for CI
- `codeship-steps.yml`: the steps to run on each service for CI
- `app.env.encrypted`: encrypted environment vars for the app (e.g., `NPM_AUTH_TOKEN`)
- `herokudeployment.env.encrypted`: encrypted environment vars for Heroku deployment (e.g., `HEROKU_API_KEY`)


## License

See the [LICENSE](./LICENSE) file.


[idm]: https://github.com/LearnersGuild/idm
[github-register-application]: https://github.com/settings/applications/new
[install-rethinkdb]: https://www.rethinkdb.com/docs/install/
[mehserve]: https://github.com/timecounts/mehserve
