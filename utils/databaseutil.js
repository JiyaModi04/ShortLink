// const {Client} = require('pg');

// const con = new Client({
//     host: "localhost",
//     user: "postgres",
//     port: 5432,
//     password: "12345",
//     database: "demodb"
// })

const { Pool } = require('pg');

const pool = new Pool({
  host: "localhost",
  user: "postgres",
  port: 5432,
  password: "12345",
  database: "demodb"
});

pool.query('SELECT * FROM registerdetails',(err,res)=>{
    if(!err){
        console.log(res.rows);
    }
    else{
        console.log(err.message);
    }
})

module.exports = pool;