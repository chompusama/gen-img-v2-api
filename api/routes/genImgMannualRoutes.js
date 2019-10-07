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

const buildImageWeek = require('./buildImageWeek');
const dataCollection = require("../models/dataModel");

router.post("/", (req, res, next) => {

    res.status(200).send('running');

    // cron.schedule('2 3 * * Mon', () => {   //every monday 03.02 am
    //     genImage(req.body.line_id);
    //     console.log(req.body.line_id + ' running corn gen img');
    // }, {
    //         scheduled: true,
    //         timezone: "Asia/Bangkok"
    //     });

    genImage(req.body.line_id);


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

                    // var date = new Date(Date.now());
                    // Date.prototype.getWeek = function () {
                    //     var dt = new Date(this.getFullYear(), 0, 1);
                    //     return Math.ceil((((this - dt) / 86400000) + dt.getDay() + 1) / 7);
                    // };
                    // var week = date.getWeek() - 1;           // week of sunday
                    // console.log(date)
                    // console.log(date.getWeek())
                    // console.log(week, '> -1')

                    dt = new Date(Date.now());
                    var week = ISO8601_week_no(dt) - 1;

                    // console.log(ISO8601_week_no(dt));
                    // console.log(week)

                    listCounting(week);

                    // listCounting(docs.counting[countingLength - 1].week_by_date);
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
                                (arr.result == 'ลูกดิ้นดี' ? emoji = '&#128077' : emoji = '&#128078');

                                if (arr.count_type == 'CTT') {
                                    var row = {
                                        date: arr.date.toLocaleDateString(),
                                        count_amount: arr.ctt_amount,
                                        result: arr.result,
                                        emoji_code: emoji
                                    }
                                }
                                else {
                                    var row = {
                                        date: arr.date.toLocaleDateString(),
                                        count_amount: arr.sdk_first_meal + ' / ' + arr.sdk_second_meal + ' / ' + arr.sdk_third_meal,
                                        result: arr.result,
                                        emoji_code: emoji
                                    }
                                }
                                list.push(row);
                            }
                        }

                        var resultWeek = {
                            line_id: docs.line_id,
                            date_img: new Date(Date.now()).toLocaleDateString(),
                            list_data: list
                        }
                        // res.status(200).json(resultWeek);
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