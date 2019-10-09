/**
 *  @POST
 *  for build and push image
 * 
 *  body require
 *      line_id: String
 *   
 *  Created by CPU on 20/8/19
 */

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const line = require('@line/bot-sdk');
const cron = require('node-cron');
const moment = require('moment');

const buildImageWeek = require('./buildImageWeek');
const dataCollection = require("../models/dataModel");

router.post("/", (req, res, next) => {

    res.status(200).send('running');


    / call json generator */
    genImage(req.body.line_id);

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

    function genImage(line_id) {
        dataCollection.findOne({ line_id: req.body.line_id })
            .exec()
            .then(docs => {

                var countingLength = docs.counting.length;

                if (countingLength != 0) {
                    console.log(req.body.line_id + ' GENERATE IMAGE : have arr');

                    dt = new Date(Date.now());
                    var week = ISO8601_week_no(dt) - 1;

                    listCounting(week);
                }
                else {
                    console.log(req.body.line_id + ' GENERATE IMAGE : no array to gen img');
                }

                // list counting in array
                function listCounting(week) {
                    // if (docs.timer_status == 'timeout' && docs.counting[(docs.counting.length) - 1].status == 'close') {
                    if (docs.timer_status == 'timeout') {

                        console.log(req.body.line_id + ' GENERATE IMAGE : status it is ok (timeout and close) generating...')

                        var list = [];

                        for (var i = 0; i < countingLength; i++) {    // countingLength

                            var arr = docs.counting[i];
                            var week_by_date = docs.counting[i].week_by_date;

                            if (week_by_date == week) {
                                var emoji
                                (arr.result == 'ลูกดิ้นดี' ? emoji = ' 👍' : emoji = ' 👎');

                                if (arr.count_type == 'CTT') {
                                    var row = {
                                        date: arr.date.toLocaleDateString(),
                                        count_amount: arr.ctt_amount,
                                        result: arr.result + emoji,
                                        emoji_code: emoji
                                    }
                                }
                                else {
                                    var row = {
                                        date: arr.date.toLocaleDateString(),
                                        count_amount: arr.sdk_first_meal + ' / ' + arr.sdk_second_meal + ' / ' + arr.sdk_third_meal,
                                        result: arr.result + emoji,
                                        emoji_code: emoji
                                    }
                                }
                                list.push(row);
                            }
                        }

                        var resultWeek = {
                            line_id: docs.line_id,
                            date_img: new Date(Date.now()).toLocaleDateString(),
                            date_start: startDay,
                            date_end: endDay,
                            ges_age_week: docs.ges_age_week,
                            list_data: list
                        }
                        // res.status(200).json(resultWeek);
                        dataCollection.findOneAndUpdate({ line_id: req.body.line_id }, {
                            $inc: {
                                ges_age_week: 1,
                            },
                        }, function (err, docs) {
                            console.log(err)
                            console.log(req.body.line_id + ' GENERATE IMAGE : inc ges_age_week successful')
                        });

                        / call function gen img from another file */
                        buildImageWeek.buildImage(resultWeek, line_id);
                    }
                    else {
                        console.log(req.body.line_id + ' GENERATE IMAGE : state is not timeout and close')
                    }
                }
            })
            .catch(err => {
                console.log(err);
                res.status(500).json({
                    error: err
                });
            });
    }



});

module.exports = router;

//  &#128077
//  &#128078

 // var yesterday = new Date(Date.now() - 86400000);
                    // var yesterdayString = yesterday.toLocaleDateString();

                    // previous day
                    // var days = 7; // Days you want to subtract
                    // var date = new Date();
                    // var last = new Date(date.getTime() - (days * 24 * 60 * 60 * 1000));
                    // var day = last.getDate();
                    // var month = last.getMonth() + 1;
                    // var year = last.getFullYear();
                    // var previousday = day + '/' + month + '/' + year;