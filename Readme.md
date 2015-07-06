XYZ CV API
==========

## What?

This is a REST API server built using ExpressJS.
It is built for the XYZ build system and communicates with the [laughing batman](https://github.com/Softhouse/laughing-batman) DREAMS API.

## Getting started

1. Connect your app to XYZ build system; follow the instructions [here](https://github.com/guzmo/xyz-docker-docs).

### TODO

You'll now have a dynamic REST API listening on port `3232` (or the port provided via the `PORT` environment variable).

## Development

1. Install [NodeJS](http://nodejs.org/download/).
2. Install and run a local copy of the DREAMS api from [here](https://github.com/guzmo/xyz-docker-docs).
3. Open your terminal and do the following:

```bash
git clone <this repo>

cd <repo folder>

npm install

node app/server.js

```
## API

**NOTE** Every request to the api needs to contain two headers, containing `x-forwarded-user` and `x-forwarded-email`. The is used by the server to create users upon connecting.

### `POST /api/attribute`

Used to create attributes that are used for access purposes. Make sure that the request is a formatted JSON object (in [Postman](https://chrome.google.com/webstore/detail/postman-rest-client/fdmmgilgnpjigdojojpjoooidkmcomcm) you need to add a `Content-Type` header with `application/json`). The json object should have the following field:
	
	"name": "yourAttributeName" 
	
#### Responses

`200` - The given JSON body was saved to the `attribute` collection and returned in the response.

`400` - The JSON body was omitted when the request was made.

`500` - The item could not be saved.

### `GET /api/attribute`

Get all attributes.

#### Responses

`200` - all the items in the collection, contained in a list.

`500` - Something went wrong when querying the database.

### `GET /api/user`

Get all users.

#### Responses

`200` - all the items in the collection, contained in a list.

`500` - Something went wrong when querying the database.

### `GET /api/user/<id>`

Get a user item by its id.

#### Responses

`200` - The user with id `<id>` in the `user` collection.

`404` - No user with id `<id>` was found in the collection.

`500` - Something went wrong when querying the database.

TODO

## License

TODO
