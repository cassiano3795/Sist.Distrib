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
    var year = req.param('year');
    var playerName = req.param('playerName');
    var clubName = req.param('clubName');

    //TODO: TENTAR BUSCAR NO MEMCACHED
    //SE DER, RETORNA O VALOR, NÃO EXISTIR, BUSCA LOCAL

    var toExecute;
    if (typeof playerName == 'undefined' && typeof clubName == 'undefined'){
        toExecute = getDataMysqlAllNull(year);
    } else if (typeof playerName == 'undefined') {
        toExecute = getDataMySqlPlayerNull(year, clubName);
    } else if (typeof clubName == 'undefined') {
        toExecute = getDataMySqlClubNull(year, playerName);
    } else {
        toExecute = getDataMySql(year, playerName, clubName);
    }

    //TODO: INSERE NO MEMCACHED

    toExecute.then(data => {
        res.send(data);
    })
});

function getClubId(clubName) {
    return new Promise((resolve, reject) => {
        var data;

        var mysql = require('mysql');
        var con = mysql.createConnection({
            host: config.serverIP,
            user: "root",
            password: "hD30Qq23",
            database: "sist_distrib"
        });

        var sql = `select * from team where team_long_name like '${clubName}'`;
        //TODO: GET DOS DADOS COM ANO E CLUB
        con.connect(function (err) {
            if (err) throw err;

            con.query(sql, function (err, result, fields) {
                if (err) throw err;

                data = result[0].team_api_id;
                resolve(data);
            });
        });
    })
}

function getPlayerId(playerName) {
    return new Promise((resolve, reject) => {
        var data;

        var mysql = require('mysql');
        var con = mysql.createConnection({
            host: config.serverIP,
            user: "root",
            password: "hD30Qq23",
            database: "sist_distrib"
        });

        var sql = 'select * from player where player_name like "?"';
        //TODO: GET DOS DADOS COM ANO E CLUB
        con.connect(function (err) {
            if (err) throw err;
            con.query(sql, playerName, function (err, result, fields) {
                if (err) throw err;

                data = result.player_api_id;
                resolve(data);
            });
        });
    })
}

function getDataMySqlPlayerNull(year, clubName) { //TODO: PARAMETROS DE BUSCA MYSQL
    return new Promise((resolve, reject) => {


        var mysql = require('mysql');
        var con = mysql.createConnection({
            host: config.serverIP,
            user: "root",
            password: "hD30Qq23",
            database: "sist_distrib"
        });

        var clubId;
        getClubId(clubName).then(data => {
            var dataHome;
            var dataAway;

            var matchs = 0;
            var wins = 0;
            var loses = 0;

            clubId = data;

            var sqlAway = `select home_team_goal, away_team_goal
                                from \`match\`
                                where DATE(date) like '%${year}%'
                                and away_team_api_id = ${clubId}`;

            var sqlHome = `select home_team_goal, away_team_goal
                            from \`match\`
                                where DATE(date) like '%${year}%'
                                and home_team_api_id = ${clubId}`;
            Promise.all([
                getMatchsHome(sqlHome),
                getMatchsAway(sqlAway)
            ]).then(results => {
                var resp = {
                    matchs: results[0].matchs + results[1].matchs,
                    wins: results[0].wins + results[1].wins,
                    losses: results[0].loses + results[1].loses,
                };
                resolve(resp);
            })

        })
    });
}

function getMatchsHome(sqlHome) {
    return new Promise((resolve, reject) => {
        var dataHome;
        var mysql = require('mysql');
        var con = mysql.createConnection({
            host: config.serverIP,
            user: "root",
            password: "hD30Qq23",
            database: "sist_distrib"
        });

        var match = {
            matchs: 0,
            wins: 0,
            loses: 0
        }
        con.connect(function (err) {
            if (err) throw err;
            con.query(sqlHome, function (err, result, fields) {
                if (err) throw err;
                dataHome = result;
                dataHome.forEach(home => {
                    match.matchs += 1;
                    if (home.home_team_goal > home.away_team_goal) {
                        match.wins += 1;
                    } else {
                        match.loses += 1;
                    }
                });

                resolve(match);
            });
        });
    });
}

function getMatchsAway(sqlAway) {
    return new Promise((resolve, reject) => {
        var dataAway;
        var mysql = require('mysql');
        var con = mysql.createConnection({
            host: config.serverIP,
            user: "root",
            password: "hD30Qq23",
            database: "sist_distrib"
        });

        var match = {
            matchs: 0,
            wins: 0,
            loses: 0
        }
        con.connect(function (err) {
            if (err) throw err;
            con.query(sqlAway, function (err, result, fields) {
                if (err) throw err;
                dataAway = result;
                dataAway.forEach(home => {
                    match.matchs += 1;
                    if (home.home_team_goal > home.away_team_goal) {
                        match.wins += 1;
                    } else {
                        match.loses += 1;
                    }
                });

                resolve(match);
            });
        });
    });
}


function getDataMySqlClubNull(year, playerName) { //TODO: PARAMETROS DE BUSCA MYSQL
    return new Promise((resolve, reject) => {


        var mysql = require('mysql');
        var con = mysql.createConnection({
            host: config.serverIP,
            user: "root",
            password: "hD30Qq23",
            database: "sist_distrib"
        });

        var playerId;
        getPlayerId(playerName).then(data => {
            var dataHome;
            var dataAway;

            var matchs = 0;
            var wins = 0;
            var loses = 0;

            playerId = data;

            var sqlAway = `select home_team_goal, away_team_goal
                                from \`match\`
                                where DATE(date) like '%${year}%'
                                and away_team_api_id = ${clubId}`;

            var sqlHome = `select home_team_goal, away_team_goal
                            from \`match\`
                                where DATE(date) like '%${year}%'
                                and home_team_api_id = ${clubId}`;
            Promise.all([
                getMatchsHome(sqlHome),
                getMatchsAway(sqlAway)
            ]).then(results => {
                var resp = {
                    matchs: results[0].matchs + results[1].matchs,
                    wins: results[0].wins + results[1].wins,
                    losses: results[0].loses + results[1].loses,
                };
                resolve(resp);
            })

        })
    });
}
function getDataMysqlAllNull(year){
    return new Promise((resolve, reject) => {
        var data;

        var mysql = require('mysql');
        var con = mysql.createConnection({
            host: config.serverIP,
            user: "root",
            password: "hD30Qq23",
            database: "sist_distrib"
        });

        var sqlAway = `select home_team_goal, away_team_goal
                                from \`match\`
                                where DATE(date) like '%${year}%'`;
    });
}

function getDataMySql(year, playerName, clubName) { //TODO: PARAMETROS DE BUSCA MYSQL
    return new Promise((resolve, reject) => {
        var data;

        var mysql = require('mysql');
        var con = mysql.createConnection({
            host: config.serverIP,
            user: "root",
            password: "hD30Qq23",
            database: "sist_distrib"
        });

        var sql = '';
        //TODO: GET DOS DADOS COM ANO E CLUB
        con.connect(function (err) {
            if (err) throw err;
            con.query(sql, function (err, result, fields) {
                if (err) throw err;

                data = result;
                resolve(data);
            });
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

function getDataMemCached(year, playerName, clubName) { //TODO: PARAMETROS DE BUSCA MEMCACHED
    return new Promise((resolve, reject) => {
        var key = `SD_Data_${year}_${typeof clubName != 'undefined' ? clubName : ''}_${typeof playerName != 'undefined' ? playerName : ''}`

        memcached.get(key, function (err, data) {
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

function setDataMemCached() { //TODO: PARAMETROS DE SET

}

module.exports = router;
