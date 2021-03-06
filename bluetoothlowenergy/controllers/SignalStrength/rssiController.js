/*
* Copyright (c) 2019, Arm Limited and affiliates.
* SPDX-License-Identifier: Apache-2.0
*
* Licensed under the Apache License, Version 2.0 (the “License”);
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*     http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an “AS IS” BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

var rssiController = {
    start: function (options) {
        var self = this;
        // console.log("here")
        this._resourceID = options.id;
        this._supportedStates = options.supportedStates;
        //"reachable" event
        //console.log(options)
        if ((options.initStates)) {
            this._rssi = options.initStates.rssi || this._rssi;
            //console.log(this._rssi);
        }
    },
    stop: function () {},
    state: {
        rssi: {
            get: function () {
                return Promise.resolve(this._rssi);
            },
            set: function (value) {
                var self = this;
                return Promise.reject('Readonly facade!');
            }
        }
    },
    getState: function () {
        var s = {};
        var self = this;
        var p = [];

        var rejected = false;

        return new Promise(function (resolve, reject) {

            self._supportedStates.forEach(function (type) {
                p.push(
                    new Promise(function (resolve, reject) {
                        self.state[type].get().then(function (value) {
                            if (value !== null) {
                                s[type] = value;
                            }
                            resolve();
                        }).catch(function (e) {
                            s[type] = e;
                            rejected = true;
                            resolve();
                        });
                    })
                );
            });

            Promise.all(p).then(function () {
                if (!rejected) {
                    return resolve(s);
                } else {
                    return reject(JSON.stringify(s));
                }
            });
        });
    },
    setState: function (value) {
        var self = this;
        var s = {};
        var p = [];

        var rejected = false;

        return new Promise(function (resolve, reject) {
            Object.keys(value).forEach(function (key) {
                p.push(
                    new Promise(function (resolve, reject) {
                        if (self._supportedStates.indexOf(key) > -1) {
                            self.state[key].set(value[key]).then(function (result) {
                                s[key] = (result === undefined) ? 'Updated successfully to value ' + value[key] : result;
                                resolve();
                            }).catch(function (e) {
                                s[key] = e;
                                rejected = true;
                                resolve();
                            });
                        } else {
                            rejected = true;
                            s[key] = 'This interface is not supported';
                            resolve();
                        }
                    })
                );
            });

            Promise.all(p).then(function (result) {
                if (!rejected) {
                    resolve(s);
                } else {
                    reject(JSON.stringify(s));
                }
            }, function (e) {
                reject(e);
            });
        });
    },
    commands: {
        emit: function () {
            var self = this;
            return this.getState().then(function (states) {
                return self.setState(states);
            });
        },
        reachable: function (value) {
            if (value) {
                this.emit('reachable');
            } else {
                this.emit('unreachable');
            }
        }
    }
};

module.exports = rssiController;