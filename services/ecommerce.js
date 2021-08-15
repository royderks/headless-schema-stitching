const express = require('express');
const jsonGraphqlExpress = require('json-graphql-server');

const PORT = 3002;
const app = express();
const data = {
  products: [
    { id: 1, title: 'Gray T-shirt', category_id: 123 },
    { id: 2, title: 'Dog Toy', category_id: 456 },
  ],
  categories: [
    { id: 123, name: 'Fashion' },
    { id: 456, name: 'Pets' },
  ],
};
app.use('/graphql', jsonGraphqlExpress.default(data));
app.listen(PORT);
