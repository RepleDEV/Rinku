import Connection = require('./connection.test');

describe('Rinku Testing', () => {
    const connection = new Connection();
    connection.run();
});

after(() => {
    process.exit(0);
});
