# LibQuality

Track your favorite open source libraries

# Features
- Check for issue stats:
  - Current open issues count
  - Current open issues average age
  - Current open issues std age

# Installation
```
git clone https://github.com/guiquintelas/libquality.git
cd libquality
cp .env-example .env
```

Enter your `APP_SESSION_SECRET` and `GITHUB_TOKEN` in `.env` file then run:

```
docker-compose up -d
yarn && yarn start:dev
```

A webserver was started in http://localhost:3000  
You can tested using the `ping` route!   
Just enter `localhost:3000/ping` and the server will respond with `pong`

If you're familiar with `postman` here is the public link for the collection:  
https://www.getpostman.com/collections/5c7d956f32be9c0a866c

# Testing
```
yarn test:e2e
```

# Routes

## GET /repos/search/:repoName

`repoName` is the name (or part of it) of the desired repository to search

This route does 3 things:
 - Uses `repoName` to search a github repository via the v3 api
   - If some repository was found
     - Saves it to the user session
     - Persists in the database
   - Else responds with `400 Bad Request`

### Examples


```
// GET localhost:3000/repos/search/vue
{
    "id": 1,
    "githubId": 11730342,
    "name": "vue",
    "issueCount": 521,
    "issueAverageAge": 541,
    "issueStandardAge": 317,
    "createdAt": "2020-10-05T19:15:17.522Z"
}
```


```
// GET localhost:3000/repos/search/some-repo-that-doen't-exist
{
    "statusCode": 400,
    "message": "No repository was found!",
    "error": "Bad Request"
}
```


## GET /repos

Lists the session repositories

### Examples


```
// GET localhost:3000/repos
[
    {
        "githubId": 10270250,
        "name": "react",
        "issueCount": 583,
        "issueAverageAge": 533,
        "issueStandardAge": 525
    },
    {
        "githubId": 11730342,
        "name": "vue",
        "issueCount": 521,
        "issueAverageAge": 541,
        "issueStandardAge": 317
    },
    {
        "githubId": 24195339,
        "name": "angular",
        "issueCount": 3247,
        "issueAverageAge": 701,
        "issueStandardAge": 490
    }
]
```
