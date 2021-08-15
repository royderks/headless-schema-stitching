const express = require('express');
const jsonGraphqlExpress = require('json-graphql-server');

const PORT = 3002;
const app = express();
const data = {
  products: [
    { id: 1, title: 'Grey t-shirt' },
    { id: 2, title: 'Tractor Puzzle' },
  ],
};
app.use('/graphql', jsonGraphqlExpress.default(data));
app.listen(PORT);
