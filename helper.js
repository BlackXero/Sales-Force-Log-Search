const util = require('node:util');
const exec = util.promisify(require('node:child_process').exec);
const url = process.env.SF_LOGIN_URL;
const fs = require('fs');
const path = require('path');
module.exports = {
    setFormat: function (data) {
        let columns = [];
        let dataRecords = [];
        let first = data.records[0];
        let keysArray = Object.keys(first);
        for (let h of keysArray) {
            if (h !== 'attributes') {
                columns.push({
                    type: 'text',
                    title: h,
                    width: 250
                });
            }
        }
        for (let d of data.records) {
            let set = [];
            for (let i of columns) {
                if (d.hasOwnProperty(i.title)) {
                    set.push(d[i.title]);
                }
            }
            dataRecords.push(set);
        }
        return {columns: columns, data: dataRecords};
    },
    async makeAuthorization() {
        let cmd = 'sfdx force:auth:web:login -r ' + url;
        const {stdout, stderr} = await exec(cmd);
        if (stdout) {
            return {success: true, response: stdout};
        }
        if (stderr) {
            return {success: false, response: stderr};
        }
    },
    async getLogs(number,user) {
        let pathDir = __dirname + path.sep + 'logs' + path.sep + user;
        this.createDirectoryIfNotExist(pathDir);
        let cmdLogList = 'sfdx force:apex:log:get -n ' + number + ' -d ' + pathDir + ' -u ' + user;
        const {stdout, stderr} = await exec(cmdLogList);
        if (stdout) {
            return {success: true, response: stdout};
        }
        if (stderr) {
            return {success: false, response: stderr};
        }
    },
    createDirectoryIfNotExist(path){
        fs.access(path, (error) => {
            if (error) {
                fs.mkdir(path, (error) => {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log("New Directory created successfully !!");
                    }
                });
            }
        });
    }
}