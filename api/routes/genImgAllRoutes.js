/**
 *  @POST
 *  generate counting report automatic every day at 3.10 am 
 * 
 * 
 *  Created by CPU on 14/10/19
 */

const express = require("express");
const router = express.Router();
const cron = require('node-cron');
const moment = require('moment');
const fs = require('fs-extra');
const hbs = require('handlebars');
const path = require('path');
const puppeteer = require('puppeteer');

const buildImageWeek = require('./buildImageWeek');
const dataCollection = require("../models/dataModel");

router.post("/", async (req, res, next) => {

    process.setMaxListeners(0);

    res.status(200).send('running');

    cron.schedule('5 3 * * Mon', async () => {

        var endDay = moment().subtract(1, 'days').format("DD/MM/YYYY");         // yesterday because, monday is the day that gen img but end day of week is Sunday
        var startDay = moment().subtract(7, 'days').format("DD/MM/YYYY");       // previous 7 days 

        function ISO8601_week_no(dt) {
            var tdt = new Date(dt.valueOf());
            var dayn = (dt.getDay() + 6) % 7;
            tdt.setDate(tdt.getDate() - dayn + 3);
            var firstThursday = tdt.valueOf();
            tdt.setMonth(0, 1);
            if (tdt.getDay() !== 4) {
                tdt.setMonth(0, 1 + ((4 - tdt.getDay()) + 7) % 7);
            }
            return 1 + Math.ceil((firstThursday - tdt) / 604800000);
        }

        var dt = new Date(Date.now());
        var week = ISO8601_week_no(dt) - 1;

        var array = [];

        // query all line id in database
        const finalResults = await new Promise((resolve, reject) => {
            dataCollection.find({}, {
                _id: 0, message: 0, mom_age: 0, ges_age_week: 0, week_current: 0, timer_status: 0, sdk_status: 0, extra: 0, count_type: 0, counting: 0, __v: 0
            }, function (err, docs) {
                resolve(docs)
            });
        });

        // push docs value to array
        for (var i = 0; i < finalResults.length; i++) {
            var a = finalResults[i].line_id;
            array.push(a);
        }

        console.log('all id', array)

        const forLoop = async _ => {
            // loop for generate report
            for (var i = 0; i < finalResults.length; i++) {
                setTimeout(function (i) {
                    console.log(array[i] + ' gen img automatic');

                    dataCollection.findOne({ line_id: array[i] })
                        .exec()
                        .then(docs => {

                            var countingLength = docs.counting.length;

                            if (docs.week_current < week) {
                                console.log(docs.week_current + ' and ' + week)

                                var arr_num = 0;
                                for (var k = 0; k < countingLength; k++) {
                                    var week_by_date = docs.counting[k].week_by_date;
                                    if (week_by_date == week) {
                                        arr_num++ ;
                                    }
                                }

                                if (arr_num != 0) {
                                    console.log(array[i] + ' GENERATE IMAGE : have arr = ' + arr_num);

                                    listCounting(week);
                                }
                                else {
                                    console.log(array[i] + ' GENERATE IMAGE : no array to gen img');
                                }
                            }
                            else {
                                console.log('id: ' + array[i] + ' has received report ')
                            }

                            function listCounting(week) {
                                // if (docs.timer_status == 'timeout' && docs.counting[(docs.counting.length) - 1].status == 'close') {
                                if (docs.timer_status == 'timeout') {

                                    console.log(array[i] + ' GENERATE IMAGE : status it is ok (timeout and close) generating...')

                                    var list = [];

                                    for (var j = 0; j < countingLength; j++) {    // countingLength

                                        var arr = docs.counting[j];
                                        var week_by_date = docs.counting[j].week_by_date;

                                        if (week_by_date == week) {
                                            var emoji
                                            (arr.result == 'ลูกดิ้นดี' ? emoji = ' 👍' : emoji = ' 👎');

                                            var dateFormatDMY = arr.date.getDate() + '/' + (arr.date.getMonth() + 1) + '/' + arr.date.getFullYear();
                                            if (arr.count_type == 'CTT') {
                                                var row = {
                                                    date: dateFormatDMY,
                                                    count_amount: arr.ctt_amount,
                                                    result: arr.result,
                                                    emoji_code: emoji
                                                }
                                            }
                                            else {
                                                var row = {
                                                    date: dateFormatDMY,
                                                    count_amount: arr.sdk_first_meal + ' / ' + arr.sdk_second_meal + ' / ' + arr.sdk_third_meal,
                                                    result: arr.result,
                                                    emoji_code: emoji
                                                }
                                            }
                                            list.push(row);
                                        }
                                    }

                                    const arr_element = array[i]
                                    var resultWeek = {
                                        line_id: arr_element,
                                        date_img: new Date(Date.now()).toLocaleDateString(),
                                        date_start: startDay,
                                        date_end: endDay,
                                        ges_age_week: docs.ges_age_week,
                                        list_data: list
                                    };

                                    / call function gen img from another file */
                                    buildImageWeek.buildImage(resultWeek, arr_element, week);

                                }
                                else {
                                    console.log(array[i] + ' GENERATE IMAGE : state is not timeout and close')
                                }
                            }
                        })
                        .catch(err => {
                            console.log(err);
                        });
                }, 30000 * i, i)

            }
        }

        forLoop();


    }, {
            scheduled: true,
            timezone: "Asia/Bangkok"
        });

});

module.exports = router;
