# echo (formerly game)

[ ![Codeship Status for LearnersGuild/echo](https://codeship.com/projects/8ee1a1d0-17e4-0134-1d69-2a776fb5d411/status?branch=master)](https://codeship.com/projects/158610)
[![Code Climate GPA](https://codeclimate.com/repos/579a4ec2e7852e0064005f1b/badges/595cf326e7b71a7ac600287c/gpa.svg)](https://codeclimate.com/repos/579a4ec2e7852e0064005f1b/feed)
[![Code Climate Issue Count](https://codeclimate.com/repos/579a4ec2e7852e0064005f1b/badges/595cf326e7b71a7ac600287c/issue_count.svg)](https://codeclimate.com/repos/579a4ec2e7852e0064005f1b/feed)
[![Test Coverage](https://codeclimate.com/repos/579a4ec2e7852e0064005f1b/badges/595cf326e7b71a7ac600287c/coverage.svg)](https://codeclimate.com/repos/579a4ec2e7852e0064005f1b/coverage)

This is the echo service.

## GETTING STARTED

Welcome to [Echo](http://i.giphy.com/MGU6B1h1jSfja.gif).

Before you can run echo you need:
- To install and set up the [IDM service](https://github.com/LearnersGuild/idm)

### SET UP ECHO

##### 1. **Globally** install [nvm][nvm], [avn][avn], and [avn-nvm][avn-nvm].

```bash
curl -o- https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash
npm install -g avn avn-nvm
avn setup
```

##### 2. Fork and clone the repository.

##### 3. Setup and run [mehserve][mehserve].

Figure out which port you intend to use and create the mehserve config file:
```bash
echo 9005 > ~/.mehserve/echo.learnersguild
```

##### 4. Set your `NODE_ENV` environment variable:

```bash
export NODE_ENV=development
```

##### 5. [Install RethinkDB][install-rethinkdb].

##### 6. Create a free AWS account:
[https://aws.amazon.com](https://aws.amazon.com/)

Make a copy of your access key ID and secret access key. You'll need to include these in your  environment variables in the next step.

##### 7. Create your `.env.development` file for your environment.
Take out all comments in your final version.
Example:
```
PORT=9005
APP_BASE_URL=http://echo.learnersguild.dev
REDIS_URL=redis://localhost:6379
RETHINKDB_URL=rethinkdb://localhost:28015/echo_development
# IDM / JWT settings, including session extension
IDM_BASE_URL=http://idm.learnersguild.dev
JWT_PRIVATE_KEY="<get from IDM service>"
JWT_PUBLIC_KEY="<get from IDM service>"
# Slack / command CLI settings
CHAT_BASE_URL=https://slack.com
CHAT_API_TOKEN=<get from dev slack instance (or another teammate)>
CLI_COMMAND_TOKEN=<get from echo slash commands app (or another teammate)>
# external API settings
GITHUB_ORG_ADMIN_TOKEN="<GitHub token with permissions in LearnersGuild, GuildCrafts, and GuildCraftsTesting>"
GITHUB_CRAFTS_REPO="https://github.com/GuildCraftsTesting/web-development-js-testing"
S3_BUCKET=guild-development
S3_KEY_PREFIX=db
AWS_ACCESS_KEY_ID=<YOUR_AWS_ACCESS_KEY_ID>
AWS_SECRET_ACCESS_KEY=<YOUR_AWS_SECRET_ACCESS_KEY>
```

##### 8. Install dependencies:

```bash
npm install
```

##### 9. Create a development & test databases:

```bash
npm run db:create
NODE_ENV=test npm run db:create
```

```bash
npm run db:migrate:up
NODE_ENV=test npm run db:migrate:up
```

### RUN THE SERVER

**NOTE:** you'll need [mehserve][mehserve], [idm][idm] and this server all running at the same time for things to work.

```bash
npm start
```

Visit the server in your browser:

```bash
open http://echo.learnersguild.dev
```

Start the workers
```bash
npm run workers
npm run workers:cycleLaunched
```

**NOTE:** If you want to use `/slash` commands from the development Slack instance, you'll need to set up localtunnel, as well:

```bash
npm install -g localtunnel
lt --port $(cat ~/.mehserve/echo.learnersguild) --subdomain slackslash
```

## CONTINUOUS INTEGRATION

We use [Codeship](https://codeship.com/) for continuous integration. The following files are responsible for CI configuration:

- `Dockerfile`: basic Docker image for the app
- `codeship-services.yml`: similar to `docker-compose.yml`, but for CI
- `codeship-steps.yml`: the steps to run on each service for CI
- `app.env.encrypted`: encrypted environment vars for the app (e.g., `NPM_AUTH_TOKEN`)


## LICENSE

See the [LICENSE](./LICENSE) file.


[idm]: https://github.com/LearnersGuild/idm
[github-register-application]: https://github.com/settings/applications/new
[install-rethinkdb]: https://www.rethinkdb.com/docs/install/
[mehserve]: https://github.com/timecounts/mehserve
[nvm]: https://github.com/creationix/nvm
[avn]: https://github.com/wbyoung/avn
[avn-nvm]: https://github.com/wbyoung/avn-nvm
