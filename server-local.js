'use strict';

const app = require('./express/server');

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
  }

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Local app listening on port ${PORT}!`));
