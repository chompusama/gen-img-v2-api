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

async function buildImage(data, line_id) {
   
    let server = 'https://api.babykickbot.site';   / change when deployed */
    // let server = 'https://83bbbd4a.ngrok.io';

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

            let fileout = 'uploads/' + data.line_id + 'x' + sDate + 'x' + sTime ;
            let pathImg = fileout + '.jpg'
            let nameImg = '/' + data.line_id + 'x' + sDate + 'x' + sTime + '.jpg';


            //open html by puppeteer
            const browser = await puppeteer.launch({
                defaultViewport: {width: 720, height: 720}
            });
            const page = await browser.newPage();

            //use short-list as content
            const content = await compile('shot-list', data);
            await page.setContent(content);
            await page.emulateMedia('screen');
            await page.screenshot({
                path: pathImg,
                quality: 100
            });

            console.log('done');
            await browser.close();

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



// /**
//  *  BUILD 
//  *  for build a count summary image
//  *  parameter is a json form
//  *  json > html > pdf > jpg
//  *  @compete @trycatch 
//  * 
//  *  Created by CPU on 19/8/19
//  */

// const puppeteer = require('puppeteer');
// const fsOld = require('fs');
// const fs = require('fs-extra');
// const hbs = require('handlebars');
// const path = require('path');
// const pdf = require('pdf-poppler');
// const moment = require('moment');
// const line = require('@line/bot-sdk');

// async function buildImage(data, line_id) {

//     // let server = 'https://babykick-report.herokuapp.com';     / change when deployed */
//     let server = 'https://839f3284.ngrok.io'; 

//     const compile = async function (templateName, data) {
//         const filePath = await path.join(process.cwd(), 'templates', `${templateName}.hbs`);
//         const html = await fs.readFile(filePath, 'utf-8');
//         return await hbs.compile(html)(data);
//     };

//     hbs.registerHelper('dateFormat', function (value, format) {
//         return moment(value).format(format);
//     });

//     (async function () {
//         try {

//             let date = new Date(Date.now());
//             let d = date.getDate();
//             let m = date.getMonth() + 1;
//             let y = date.getFullYear();
//             let hr = date.getHours();
//             let mm = date.getMinutes();
//             let sec = date.getSeconds();
//             let sDate = d + '-' + m + '-' + y;
//             let sTime = hr + '-' + mm + '-' + sec;

//             console.log('>>>>>' + hr)

//             const browser = await puppeteer.launch();
//             const page = await browser.newPage();

//             const content = await compile('shot-list', data);

//             await page.setContent(content);
//             await page.emulateMedia('screen');
//             let height = await page.evaluate(() => document.documentElement.offsetHeight);
//             await page.pdf({
//                 path: 'uploads/' + data.line_id + 'x' + sDate + 'x' + sTime + '.pdf',
//                 // height: height + 'px',
//                 height: '10cm',
//                 width: '10cm',
//                 printBackground: true,
//                 pageRanges: '1'
//             });

//             let file = await 'uploads/' + data.line_id + 'x' + sDate + 'x' + sTime + '.pdf';
//             let fileout = 'uploads/' + data.line_id + 'x' + sDate + 'x' + sTime ;
//             let fileImg = fileout + '.jpg'
//             let opts = {
//                 format: 'jpeg',
//                 out_dir: path.dirname(file),
//                 out_prefix: path.basename(fileout, path.extname(file)),
//             }

//             console.log(fileout)

//             await pdf.convert(file, opts)
//                 .then(res => {
//                     console.log('Successfully converted');
//                     fsOld.unlink(file, function () {
//                         console.log('Remove pdf file');
//                     });
//                     fs.rename(fileout + '-1.jpg', fileImg, function(err) {
//                         if ( err ) console.log('ERROR: ' + err);
//                     });
//                 })
//                 .catch(error => {
//                     console.error(error);
//                 })


//             console.log('done');
//             await browser.close();

//             var imgLink = server + '/' + data.line_id + 'x' + sDate + 'x' + sTime + '.jpg';

//             / push message to line */
//             const client = new line.Client({
//                 channelAccessToken: 'SCtu4U76N1oEXS3Ahq1EX9nBNkrtbKGdn8so1vbUZaBIXfTlxGqMldJ3Ego3GscxKGUB7MlfR3DHtTbg6hrYPGU9reSTBcCSiChuKmDCMx4FTtIPXzivaYUi3I6Yk1u/yF5k85Le0IUFrkBNxaETxFGUYhWQfeY8sLGRXgo3xvw='
//             });
//             const message = await [
//                 {
//                     type: 'text',
//                     text: 'รายงานการนับลูกดิ้น'
//                 },
//                 {
//                     type: "image",
//                     originalContentUrl: imgLink,
//                     previewImageUrl: imgLink
//                 }
//             ]
//             await client.pushMessage(line_id, message)
//                 .then(() => {
//                     console.log('push message done!')
//                     fsOld.unlink(file, function () {
//                         console.log('Remove pdf file');
//                     });
//                 })
//                 .catch((err) => {
//                     console.log(err);   // error when use fake line id 
//                 });

//         } catch (e) {
//             console.log('our error', e);
//         }
//     })();
// }
// module.exports.buildImage = buildImage;