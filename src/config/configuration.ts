export default () => ({
  database: {
    host: process.env.HOST,
    port: Number(process.env.PORT_DB),
    db_user: process.env.DB_USER,
    password: process.env.PASS,
    database: process.env.DATABASE,
    synchronize: process.env.SYNCH === 'true',
    logging: false,
  }
});
