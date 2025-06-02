# fisco
- [Live website](https://fisco.social/)
- [Release summary](https://docs.google.com/document/d/1J6Sz9DN8iJD84SU72Irff8T1gGiHZlWR9WuunpRb4rU/edit?usp=sharing)
- [Sprint plans and reports](https://docs.google.com/document/d/1RP4bDNeu_EoFbjNu6x8wTmj0F8g0B8utpj6EFhYrYAo/edit?usp=sharing)
- [Test plan and report](https://docs.google.com/document/d/1RMdfvFb9Hu0y9cLgaM8NDjAhtJDZPDw-JVDqmp1DBoI/edit?usp=sharing)
- [Slide deck](https://docs.google.com/presentation/d/1bl29FBvzCq-hOCRFGiHpdf-ExbWqHOaed0eh7ZtG3G4/edit?usp=sharing)
- [Scrum board](https://github.com/users/RaglandDev/projects/2/views/1?layout=board&filterQuery=)

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
