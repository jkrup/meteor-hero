# Meteor Hero
*meteor-hero* is a tool to instantly deploy MeteorJS applications for free with one command utilizing Heroku's service. Just run `meteor-hero` and instantly deploy your Meteor app like you could back in the good 'ol days of `meteor deploy`.

<p align="center">
  <img alt="Screenshot of meteor-hero" src="https://github.com/jkrup/meteor-hero/raw/master/assets/mhero.png">
</p>

# Install

## Prerequisites

Install heroku's CLI tool: https://devcenter.heroku.com/articles/heroku-cli#download-and-install

Via Homebrew:

```
brew tap heroku/brew && brew install heroku
```

And then install `meteor-hero` via NPM:


```
npm i -g meteor-hero
```

# Description

*meteor-hero* is the easiest zero-configuration tool to deploy MeteorJS apps for free, yet can scale up to production usage.

## Details
This program is designed to be run inside of a MeteorJS project and will do the following:

1. Build the meteor application to BUILD_DIR (Default: `~/.meteor-hero/builds`)
2. Unzip the contents of the built meteor application
3. Write a Dockerfile in the BUILD_DIR
4. Create a new heroku instance with a MongoDB addon and set the appropriate env variables
5. Release the heroku container and print the URL where it is accessible


# Usage
```
    meteor-hero [options] <command>

  Description:
    This program is designed to be run inside of a MeteorJS project and will do the following:

      1) Build the meteor application to BUILD_DIR (Default: ~/.meteor-hero/builds)
      2) Unzip the contents of the built meteor application
      3) Write a Dockerfile in the BUILD_DIR
      4) Create a new heroku instance with a MongoDB addon and set the appropriate env variables
      5) Release the heroku container and print the URL where it is accessible

    Note: If run outside of a meteor application, may crash due to `meteor build` failing

  Options:
    -h                 Displays help message
    -b DIR             Overwrite BUILD_DIR
    -e VAR=value       Environment variables to set on the deployed heroku instance.
    -E `FILE`          Env file to be read for environment variables to be set.

  Commands:
    []  By default deploys a MeteorJS application to heroku.
    -u  Update instead of creating a new url, update the previous deploy. The file .heroku_app_name must exist and contain the previous app name.

  Examples:

  – Deploy with environment variables

    $ meteor-hero -e MONGO_URL="mongodb://user:pass@example.mongo.com" -e ROOT_URL="example.net"`

  – Deploy using env file

    $ meteor-hero -E prod.env
```
