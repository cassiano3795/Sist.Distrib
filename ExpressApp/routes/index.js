'use strict';
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res) {
    res.render('index', { title: 'Express' });
});

/* GET users listing. */
router.get('/getAvaibleYears', function (req, res) {
    //TODO: CHAMAR FUNCTION QUE VAI NO MEMCACHED, BUSCA OS SERVIDORES ATIVOS, E RETORNA OS ANOS
    res.send('respond with a resource');
});

router.get('/getData/:year', function (req, res) {
    res.send('respond with a Data');
});

function getAvaibleYears() {

}

function getDataMySql() { //TODO: PARAMETROS DE BUSCA MYSQL

}

function getDataMemCached() { //TODO: PARAMETROS DE BUSCA MEMCACHED

}

module.exports = router;
