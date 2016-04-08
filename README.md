# game

This is the game service.

## Getting Started

Be sure you've read the [instructions for contributing](./CONTRIBUTING.md).

1. Clone the repository.

2. Setup and run [mehserve][mehserve]. Then figure out which port you intend to use and create the mehserve config file:

        $ echo 9005 > ~/.mehserve/game.learnersguild

3. Set your `NODE_ENV` environment variable:

        $ export NODE_ENV=development

4. [Install RethinkDB][install-rethinkdb].

7. Create your `.env` file for your environment. Example:

        PORT=9005
        APP_BASEURL=http://game.learnersguild.dev
        IDM_BASE_URL=http://url.learnersguild.dev   # to support extending JWT sessions
        RETHINKDB_URL=rethinkdb://localhost:28015/game_development
        JWT_PRIVATE_KEY="<get from IDM service>"  # to support extending JWT sessions
        JWT_PUBLIC_KEY="<get from IDM service>"

8. Run the setup tasks:

        $ npm install
        $ npm run db:create
        $ npm run db:migrate -- up

9. Run the server:

        $ npm start

10. Visit the server in your browser:

        $ open http://game.learnersguild.dev


## License

See the [LICENSE](./LICENSE) file.


[github-register-application]: https://github.com/settings/applications/new
[install-rethinkdb]: https://www.rethinkdb.com/docs/install/
[mehserve]: https://github.com/timecounts/mehserve
