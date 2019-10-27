/**
 *  BUILD 
 *  for build a count summary image
 *  parameter is a json form
 *  json > html > pdf > jpg
 *  @compete @trycatch 
 * 
 *  Created by CPU on 19/8/19
 */

const puppeteer = require('puppeteer');
const line = require('@line/bot-sdk');

const fsOld = require('fs');
const fs = require('fs-extra');
const hbs = require('handlebars');
const path = require('path');
const moment = require('moment');

const dataCollection = require("../models/dataModel");

async function buildImage(data, line_id, week) {

    let server = 'https://report.babykick.site'; / change when deployed */
    // let server = 'https://ac1c1ba6.ngrok.io';

    console.log(line_id + ' generating..')

    const compile = async function (templateName, data) {
        const filePath = await path.join(process.cwd(), 'templates', `${templateName}.hbs`);
        const html = await fs.readFile(filePath, 'utf-8');
        return await hbs.compile(html)(data);
    };

    hbs.registerHelper('dateFormat', function (value, format) {
        return moment(value).format(format);
    });

    (async function () {
        try {

            //file name
            let date = new Date(Date.now());
            let d = date.getDate();
            let m = date.getMonth() + 1;
            let y = date.getFullYear();
            let hr = date.getHours();
            let mm = date.getMinutes();
            let sec = date.getSeconds();
            let sDate = d + '-' + m + '-' + y;
            let sTime = hr + '-' + mm + '-' + sec;

            let fileout = 'uploads/' + data.line_id + 'x' + sDate + 'x' + sTime;
            let pathImg = fileout + '.jpg'
            let nameImg = '/' + data.line_id + 'x' + sDate + 'x' + sTime + '.jpg';


            //open html by puppeteer
            const browser = await puppeteer.launch({
                defaultViewport: { width: 720, height: 720 }
            });
            const page = await browser.newPage();

            //use short-list as content
            const content = await compile('shot-list', data);
            await page.setDefaultNavigationTimeout(0);
            await page.setContent(content);
            await page.emulateMedia('screen');
            await page.screenshot({
                path: pathImg,
                quality: 100
            });

            console.log(line_id, 'done');
            await browser.close();

            // dataCollection.findOneAndUpdate({ line_id: line_id }, {
            //     $inc: {
            //         ges_age_week: 1
            //     },
            //     $set: {
            //         week_current: week
            //     }
            // }, function (err, docs) {
            //     console.log(err)
            //     console.log(line_id + ' : increase ges_age week')
            // });

            var imgLink = server + nameImg;
            // var imgLink = server + '/screen.jpg';

            / push message to line */
            const client = new line.Client({
                channelAccessToken: 'SCtu4U76N1oEXS3Ahq1EX9nBNkrtbKGdn8so1vbUZaBIXfTlxGqMldJ3Ego3GscxKGUB7MlfR3DHtTbg6hrYPGU9reSTBcCSiChuKmDCMx4FTtIPXzivaYUi3I6Yk1u/yF5k85Le0IUFrkBNxaETxFGUYhWQfeY8sLGRXgo3xvw='
            });
            const message = await [
                {
                    type: 'text',
                    text: 'รายงานการนับลูกดิ้นค่ะ'
                },
                {
                    type: "image",
                    originalContentUrl: imgLink,
                    previewImageUrl: imgLink
                }
            ]
            await client.pushMessage(line_id, message)
                .then(() => {
                    console.log(line_id + ' GENERATE IMAGE : push image done!')
                    dataCollection.findOneAndUpdate({ line_id: line_id }, {
                        $inc: {
                            ges_age_week: 1
                        },
                        $set: {
                            week_current: week
                        }
                    }, function (err, docs) {
                        console.log(err)
                        console.log(line_id + ' : increase ges_age week')
                    });
                })
                .catch((err) => {
                    console.log(err);   // error when use fake line id 
                });

        } catch (e) {
            console.log('our error', e);
        }
    })();
}
module.exports.buildImage = buildImage;

