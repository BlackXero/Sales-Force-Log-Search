require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const bodyParser = require('body-parser');
const helper = require('./helper.js');
const jsforce = require('jsforce');
const fs = require('fs');
const userName = process.env.SF_USERNAME;
const password = process.env.SF_PASSWORD;
const url = process.env.SF_LOGIN_URL;
const conn = new jsforce.Connection({loginUrl: url});
const port = process.env.APP_PORT;
const moment = require('moment');
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(express.static('public'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.listen(port, () => {
    console.log(`App is running on port ${port}`)
});
global.authorized = false;

app.get('/', (req, res) => {

    let showPopup = false;
    if(req.query.terminate){
        showPopup = true;
    }
    res.render('index',{showPopup:showPopup});
})


app.get('/logs', (req, res) => {
    res.render('logs');
})


app.post('/get-logs', (req, res) => {
    let numberOfLogs = req.body.number;
    let user = req.body.user;
    helper.getLogs(numberOfLogs, user)
        .then(s => {
            return res.json(s)
        })
        .catch(e => {
            return res.json(e)
        })
});

app.post('/process', (req, res) => {
    let query = req.body.data;
    return conn.login(userName, password, function (err, res) {
        if (err) {
            return res.json({done: false, message: err});
        }
    }).then(r => {
        conn.query(query, function (err, result) {
            if (err) {
                return res.json({done: false, message: err});
            }
            res.contentType('application/json')
            return res.json({data: helper.setFormat(result)})
        })
    })
})

function setAuthorization(){
    authorized = true;
}

app.post('/authorization', (req, res) => {
    return helper.makeAuthorization()
        .then(s => {
            setAuthorization()
            return res.json(s)
        })
        .catch(e => {
            return res.json(e)
        })
})

app.get('/search-logs', (req, res) => {
    let q = null;
    let name = null;
    let contentArray = [];
    if (req.query.q) {
        q = req.query.q;
    }
    if (req.query.name) {
        name = req.query.name;
    }
    let pathDir = __dirname + path.sep + 'logs' + path.sep + name;
    let exist = fs.existsSync(pathDir);
    if(!exist){
        return res.render('search', {logs: contentArray,q:q,name:name,dir:false});
    }
    if(req.query.action && req.query.action === 'delete'){
        fs.unlinkSync(pathDir + path.sep + req.query.file);
    }

    if(q && name){
        let files = fs.readdirSync(pathDir);
        for (let i of files){
            let fullFilePath = pathDir + path.sep + i;
            let data = fs.readFileSync(fullFilePath);
            let content = data.toString();
            if(content.includes(q)){
                let stats = fs.statSync(fullFilePath);
                let momentDate = moment(stats.birthtime).format('Do MMMM,YYYY');
                let momentTime = moment(stats.birthtime).format('h:mm:ss a');
                let exactTime = momentDate + ' at ' + momentTime;
                contentArray.push({
                    user:name,
                    name:i,
                    path:fullFilePath,
                    size:(stats.size/1024) + ' KB',
                    time:exactTime,
                    content:content
                });
            }
        }
    }
    return res.render('search', {logs: contentArray,q:q,name:name,dir:true});
});

app.get('/session-terminate',(req,res) => {
    authorized = false;
    res.redirect('/?terminate=1');
});

app.get('/download-log',(req,res) => {
    let name = req.query.name;
    let file = req.query.file
    let filePath = __dirname + path.sep + 'logs' + path.sep + name + path.sep + file;
    return res.download(filePath);
});

app.get('/manage-logs',(req,res) => {
    let name = null;
    let deleteFiles = false;
    if (req.query.name) {
        name = req.query.name;
    }
    if (req.query.delete) {
        deleteFiles = true;
    }
    let contentArray = [];
    let pathDir = __dirname + path.sep + 'logs' + path.sep + name;
    let exist = fs.existsSync(pathDir);
    if(!exist){
        return res.render('manageLogs', {logs: contentArray,name:name,dir:false});
    }
    if(name){
        let files = fs.readdirSync(pathDir);
        for (let i of files){
            let fullFilePath = pathDir + path.sep + i;
            if(deleteFiles){
                fs.unlinkSync(fullFilePath);
                continue;
            }
            let data = fs.readFileSync(fullFilePath);
            let content = data.toString();
            let stats = fs.statSync(fullFilePath);
            let momentDate = moment(stats.birthtime).format('Do MMMM,YYYY');
            let momentTime = moment(stats.birthtime).format('h:mm:ss a');
            let exactTime = momentDate + ' at ' + momentTime;
            contentArray.push({
                user:name,
                name:i,
                path:fullFilePath,
                size:(stats.size/1024) + ' KB',
                time:exactTime,
                content:content
            });
        }
    }
    return res.render('manageLogs', {logs: contentArray,name:name,dir:true});
})