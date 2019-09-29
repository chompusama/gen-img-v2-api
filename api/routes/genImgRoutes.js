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

    var cron = require('node-cron');

    res.status(200).send('running');

    cron.schedule('55 23 * * Sun', () => {
        genImage(req.body.line_id);
        console.log('running corn');
    }, {
            scheduled: true,
            timezone: "Asia/Bangkok"
        });

    // genImage(req.body.line_id);

    function genImage(line_id) {
        dataCollection.findOne({ line_id: req.body.line_id })
            .exec()
            .then(docs => {
                // res.status(200).json(docs);
                console.log(docs.counting.length);

                var countingLength = docs.counting.length;

                if (countingLength != 0) {
                    listCounting(docs.counting[countingLength - 1].week_by_date);
                    console.log(docs.counting[countingLength - 1].week_by_date)
                }
                else {
                    console.log('no array');
                }

                // list counting in array
                function listCounting(week) {
                    if (docs.timer_status == 'timeout' && docs.counting[(docs.counting.length) - 1].status == 'close') {
                        var list = [];
                        for (var i = 0; i < 7 ; i++) {    // countingLength
                            var arr = docs.counting[i];
                            if (arr.week_by_date == week) {
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