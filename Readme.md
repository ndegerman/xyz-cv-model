XYZ CV API
==========

## What?

This is a REST API server, representing the data model for xyz-cv-ui, built using ExpressJS and Bluebird.

## Getting started

1. Connect your app to XYZ build system; follow the instructions [here](https://github.com/guzmo/xyz-docker-docs).

### TODO

## Development

1. Install [NodeJS](http://nodejs.org/download/).
2. Install and run a local copy of the xyz-cv-api from [here](https://github.com/Softhouse/xyz-cv-api).
3. Open your terminal and do the following:

```bash
git clone <this repo>

cd <repo folder>

npm install

node app/server.js

```
## API

**NOTE** Every request to the api needs to contain two headers, containing `x-forwarded-user` and `x-forwarded-email`. The is used by the server to create users upon connecting.

### `GET /profile/current`

Get the profile for the current user.

#### Responses

`200` - the profile, as an object, containing all nested objects connected to the user and the user itself.

`500` - Something went wrong when querying the meta backend.

### `GET /profile/:userId`

Get the profile for the given userId.

#### Responses

`200` - the profile, as an object, containing all nested objects connected to the user and the user itself.

`500` - Something went wrong when querying the meta backend.



## License

TODO

PROMISES
