'use strict';
var express = require('express');
var router = express.Router();

var config = require('../config.json')
var Memcached = require('memcached');

var memcached = new Memcached({
    locations: config.memcachedServer + ':' + config.memcachedPort
});

/* GET home page. */
router.get('/', function (req, res) {
    res.render('index', { title: 'Express' });
});

//  GET years listing.
router.get('/getAvaibleYears', function (req, res) {
    var years = getAvaibleYears().then(years => {
        res.send(years);
    }).catch(err => {
        res.send(err);
    });
});

// GET Data listing
router.get('/getData/:year', function (req, res) {
    var data = getDataMySql(req.year, req.playerName, req.clubName)
        .then(data => {
            res.send(data);
        });
});

function getDataMySql(year, playerName, clubName) { //TODO: PARAMETROS DE BUSCA MYSQL
    var mysql = require('mysql');

    var con = mysql.createConnection({
        host: config.serverIP,
        user: "root",
        password: "",
        database: "sist_distrib"
    });

    con.connect(function (err) {
        if (err) throw err;
        con.query("SELECT * FROM players limit 5", function (err, result, fields) {
            if (err) throw err;
            console.log(result);
        });
    });
}

function getAvaibleYears() {

    return new Promise((resolve, reject) => {
        var years = [];
        memcached.get('SD_ListServers', function (err, data) {
            if (err) {
                reject(err);
            }

            data.forEach(server => {
                if (server.active == true) {
                    years.push(server.years);
                    years.sort();
                }
            });
            resolve(years);
        });
    });
}

function getDataMemCached() { //TODO: PARAMETROS DE BUSCA MEMCACHED

}

function setDataMemCached() { //TODO: PARAMETROS DE SET

}

module.exports = router;
