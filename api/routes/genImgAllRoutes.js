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

    // cron.schedule('30 14 * * Mon', async () => {



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

    const forLoop = async _ => {
        // loop for generate report
        for (var i = 0; i < finalResults.length; i++) {
            console.log('gen img automatic id ' + array[i]);

            await dataCollection.findOne({ line_id: array[i] })
                .exec()
                .then(docs => {

                    var countingLength = docs.counting.length;

                    if (docs.week_current < week) {
                        console.log(docs.week_current + ' and ' + week)

                        if (countingLength != 0) {
                            console.log(array[i] + ' GENERATE IMAGE : have arr');

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
                                line_id: array[i],
                                date_img: new Date(Date.now()).toLocaleDateString(),
                                date_start: startDay,
                                date_end: endDay,
                                ges_age_week: docs.ges_age_week,
                                list_data: list
                            };

                            / call function gen img from another file */
                            buildImageWeek.buildImage(resultWeek, array[i], week);

                        }
                        else {
                            console.log(array[i] + ' GENERATE IMAGE : state is not timeout and close')
                        }
                    }
                })
                .catch(err => {
                    console.log(err);
                });
        }
    }

    forLoop()


    // }, {
    //         scheduled: true,
    //         timezone: "Asia/Bangkok"
    //     });

});

module.exports = router;





// / call function gen img from another file */
//                             // await buildImageWeek.buildImage(resultWeek, array[i], week);
//                             let server = 'https://f9d14e1a.ngrok.io';

//                             console.log(array[i] + ' generating..')

//                             const compile = async function (templateName, resultWeek) {
//                                 const filePath = await path.join(process.cwd(), 'templates', `${templateName}.hbs`);
//                                 const html = await fs.readFile(filePath, 'utf-8');
//                                 return await hbs.compile(html)(resultWeek);
//                             };

//                             hbs.registerHelper('dateFormat', function (value, format) {
//                                 return moment(value).format(format);
//                             });

//                             (async function () {
//                                 try {

//                                     //file name
//                                     let date = new Date(Date.now());
//                                     let d = date.getDate();
//                                     let m = date.getMonth() + 1;
//                                     let y = date.getFullYear();
//                                     let hr = date.getHours();
//                                     let mm = date.getMinutes();
//                                     let sec = date.getSeconds();
//                                     let sDate = d + '-' + m + '-' + y;
//                                     let sTime = hr + '-' + mm + '-' + sec;

//                                     let fileout = 'uploads/' + array[i] + 'x' + sDate + 'x' + sTime;
//                                     let pathImg = fileout + '.jpg'
//                                     let nameImg = '/' + array[i] + 'x' + sDate + 'x' + sTime + '.jpg';


//                                     //open html by puppeteer
//                                     const browser = await puppeteer.launch({
//                                         defaultViewport: { width: 720, height: 720 }
//                                     });
//                                     const page = await browser.newPage();

//                                     //use short-list as content
//                                     const content = await compile('shot-list', resultWeek);
//                                     await page.setContent(content);
//                                     await page.emulateMedia('screen');
//                                     await page.screenshot({
//                                         path: pathImg,
//                                         quality: 100
//                                     });

//                                     console.log('done');
//                                     await browser.close();

//                                     var imgLink = server + nameImg;
//                                     // var imgLink = server + '/screen.jpg';

//                                     // / push message to line */
//                                     // const client = new line.Client({
//                                     //     channelAccessToken: 'SCtu4U76N1oEXS3Ahq1EX9nBNkrtbKGdn8so1vbUZaBIXfTlxGqMldJ3Ego3GscxKGUB7MlfR3DHtTbg6hrYPGU9reSTBcCSiChuKmDCMx4FTtIPXzivaYUi3I6Yk1u/yF5k85Le0IUFrkBNxaETxFGUYhWQfeY8sLGRXgo3xvw='
//                                     // });
//                                     // const message = await [
//                                     //     {
//                                     //         type: 'text',
//                                     //         text: 'รายงานการนับลูกดิ้นค่ะ'
//                                     //     },
//                                     //     {
//                                     //         type: "image",
//                                     //         originalContentUrl: imgLink,
//                                     //         previewImageUrl: imgLink
//                                     //     }
//                                     // ]
//                                     // await client.pushMessage(line_id, message)
//                                     //     .then(() => {
//                                     //         console.log(line_id + ' GENERATE IMAGE : push image done!')

//                                     //         dataCollection.findOneAndUpdate({ line_id: line_id }, {
//                                     //             $inc: {
//                                     //                 ges_age_week: 1,
//                                     //             },
//                                     //             $set: {
//                                     //                 week_current: week
//                                     //             }
//                                     //         }, function (err, docs) {
//                                     //             console.log(err)
//                                     //             console.log(line_id + ' GENERATE IMAGE : inc ges_age_week successful')
//                                     //         });
//                                     //     })
//                                     //     .catch((err) => {
//                                     //         console.log(err);   // error when use fake line id 
//                                     //     });

//                                 } catch (e) {
//                                     console.log('our error', e);
//                                 }
//                             });