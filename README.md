# [fisco](https://fisco.social/)
For the complete project process documentation, click [here](https://docs.google.com/document/d/1RMdfvFb9Hu0y9cLgaM8NDjAhtJDZPDw-JVDqmp1DBoI/edit?usp=sharing)

## Local
### Setup 
1. navigate to fisco/fisco/
2. run ``npm install``
3. run ``npm build``
4. create a file called ``.env.local`` place it in fisco/fisco/
5. copy provided environment variables into ``.env.local``
#### Note: the database URL provided in .env.local connects to the development data base

### Start the server
1. navigate to fisco/fisco/
2. run ``npm start``

## Testing
### Run unit tests
1. navigate to fisco/fisco/
2. run ``npm run coverage``

### Run end-to-end tests
1. navigate to fisco/fisco/
2. run ``npm run e2e``
