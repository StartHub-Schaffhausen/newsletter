const functions = require('firebase-functions');

functions.region('europe-west6');
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

var admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);

/*
var serviceAccount = require("./starthub-schaffhausen-firebase-adminsdk-jkcz8-c2c5b5a4f1.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://starthub-schaffhausen.firebaseio.com"
});*/

const db = admin.firestore();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

const express = require('express');
const cors = require('cors');

const axios = require('axios');
const fetch = require('node-fetch');
const apicache = require('apicache');

const app = express();

const FormData = require('form-data');

const htmlToText = require('html-to-text');

const nodemailer = require('nodemailer');

const moment = require('moment');

app.use(cors({
    origin: true
}));


// create reusable transporter object using the default SMTP transport
/*let transporter = nodemailer.createTransport({
    host: "quarz.metanet.ch",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: "sandro@starthub.sh",
        pass: "%En403rd",
    },
});*/


//Cache
//let cache = apicache.middleware;
//app.use(cache('10 minutes'));


/* 
1 Einzelunternehmen /Einzelfirma ef
2 Kollektivgesellschaft kig
3 Aktiengesellschaft ag
4 GmbH gmbh
5 Genossenschaft
6 Verein
7 Stiftung
8 Institut des öffentlichen Rechts
9 Zweigniederlassung CH
10 Kommanditgesellschaft
11 Zweigniederlassung einer ausl. Gesellschaft
12 Kommanditaktiengesellschaft
13 Besondere Rechtsform
14 Gemeinderschaft
15 Investmentgesellschaft mit festem Kapital
16 Investmentgesellschaft mit variablem Kapital
17 Kommanditgesellschaft für kollektive Kapitalanlagen
18 Nichtkaufmännische Prokura

Alte Suche: "body": "{\"legalForms\":[4],\"registryOffices\":[290],\"languageKey\":\"de\",\"searchType\":\"undefined\",\"maxEntries\":5000,\"offset\":22676}",
Nur neueintragungen "body": "{\"publicationDate\":\"2020-06-01\",\"publicationDateEnd\":\"2020-06-14\",\"legalForms\":[4],\"registryOffices\":[290],\"maxEntries\":30,\"mutationTypes\":[2],\"offset\":0}",

*/



//https://stackoverflow.com/questions/31260837/how-to-run-a-cron-job-on-every-monday-wednesday-and-friday#31260911

/* EVERY 1. of MONTH */
exports.scheduleMonthlyEmail = functions.region("europe-west6").pubsub.schedule('00 08 1 * *')
    .timeZone('Europe/Zurich')
    .onRun((context) => {
        console.log('This will be run every 1. of Month at 08:00!');

        // calculate TimeStamps for request:
        const now = moment();
        let date = now.subtract(1, 'months'); // 7 months, 7 days and 7 seconds ago

        const now2 = moment();
        let dateNow = now2.subtract(1 , 'days');
        //let dateNow = new Date();

        fetch("https://europe-west6-starthub-schaffhausen.cloudfunctions.net/api/startups/all/" + date.toISOString().slice(0, 10) + "/" + dateNow.toISOString().slice(0, 10), {
            "headers": {
                "accept": "application/json, text/plain, */*",
                "content-type": "application/json;charset=UTF-8",
            },
            "method": "GET",
            "mode": "cors"
        }).then(res => res.json())
        .then(async json => {

            let startupString = "";
            for (let startup of json) {
                //console.log(startup.name);

                if (startup.address.careOf) {
                    startupString = startupString + "<li><b>" + startup.name + "</b> - " + startup.uid + " / " + String(startup.shabDate).substr(8, 2) + "." + String(startup.shabDate).substr(5, 2) + "." + String(startup.shabDate).substr(0, 4) + "</br> (" + startup.address.organisation + ", " + startup.address.careOf + ", " + startup.address.street + " " + startup.address.houseNumber + ", " + startup.address.swissZipCode + " " + startup.address.town + ")";
                } else {
                    startupString = startupString + "<li><b>" + startup.name + "</b> - " + startup.uid + " / " + String(startup.shabDate).substr(8, 2) + "." + String(startup.shabDate).substr(5, 2) + "." + String(startup.shabDate).substr(0, 4) + "</br> (" + startup.address.organisation + ", " + startup.address.street + " " + startup.address.houseNumber + ", " + startup.address.swissZipCode + " " + startup.address.town + ")"; 
                }
                // Add purpose
                startupString = startupString + "<p>" + startup.purpose + "</p>" + "</br>" + "</li>";

            }

            let partnerRef = await db.collection('partnerprogramm').where('active', '==', true).where('monthly', '==', true).get();
            partnerRef.forEach(async partner => {

                let mail = await db.collection('mail').add({
                    to: partner.data().email,
                    template: {
                        name: 'PartnerMonthlyNewsletter',
                        data: {
                            firstName: partner.data().firstName,
                            lastName: partner.data().lastName,
                            startupString: startupString
                        },
                    },
                })
            });
        }); //fetch Ende
    });


/* EVERY MONDAY */
exports.scheduleMondayEmail = functions.region("europe-west6").pubsub.schedule('00 08 * * 1')
    .timeZone('Europe/Zurich') // Users can choose timezone - default is America/Los_Angeles
    .onRun((context) => {
        console.log('This will be run every monday at 08:00!');

        // calculate TimeStamps for request:
        const now = moment();
        let date = now.subtract(7, 'days'); // 7 months, 7 days and 7 seconds ago

        const now2 = moment();
        let dateNow = now2.subtract(1, 'days');
        //let dateNow = new Date();

        fetch("https://europe-west6-starthub-schaffhausen.cloudfunctions.net/api/startups/all/" + date.toISOString().slice(0, 10) + "/" + dateNow.toISOString().slice(0, 10), {
            "headers": {
                "accept": "application/json, text/plain, */*",
                "content-type": "application/json;charset=UTF-8",
            },
            "method": "GET",
            "mode": "cors"
        }).then(res => res.json())
        .then(async json => {

            let startupString = "";
            for (let startup of json) {
                //console.log(startup.name);

                if (startup.address.careOf) {
                    startupString = startupString + "<li><b>" + startup.name + "</b> - " + startup.uid + " / " + String(startup.shabDate).substr(8, 2) + "." + String(startup.shabDate).substr(5, 2) + "." + String(startup.shabDate).substr(0, 4) + "</br> (" + startup.address.organisation + ", " + startup.address.careOf + ", " + startup.address.street + " " + startup.address.houseNumber + ", " + startup.address.swissZipCode + " " + startup.address.town + ")";
                } else {
                    startupString = startupString + "<li><b>" + startup.name + "</b> - " + startup.uid + " / " + String(startup.shabDate).substr(8, 2) + "." + String(startup.shabDate).substr(5, 2) + "." + String(startup.shabDate).substr(0, 4) + "</br> (" + startup.address.organisation + ", " + startup.address.street + " " + startup.address.houseNumber + ", " + startup.address.swissZipCode + " " + startup.address.town + ")"; 
                }
                // Add purpose
                startupString = startupString + "<p>" + startup.purpose + "</p>" + "</br>" + "</li>";

            }

            let partnerRef = await db.collection('partnerprogramm').where('active', '==', true).where('weekly', '==', true).get();
            partnerRef.forEach(async partner => {

                let mail = await db.collection('mail').add({
                    to: partner.data().email,
                    template: {
                        name: 'PartnerWeeklyNewsletter',
                        data: {
                            firstName: partner.data().firstName,
                            lastName: partner.data().lastName,
                            startupString: startupString
                        },
                    },
                })
            });
        }); //fetch Ende
    });


app.get('/testmail', async (req, res) => {

    // calculate TimeStamps for request:
    const now = moment();
    let date = now.subtract(2, 'weeks'); // 7 months, 7 days and 7 seconds ago
    let dateNow = new Date();

    console.log("Testmail");
    console.log("von " + date.toISOString().slice(0, 10));
    console.log("bis " + dateNow.toISOString().slice(0, 10));

    fetch("https://europe-west6-starthub-schaffhausen.cloudfunctions.net/api/startups/all/" + date.toISOString().slice(0, 10) + "/" + dateNow.toISOString().slice(0, 10), {
            "headers": {
                "accept": "application/json, text/plain, */*",
                "content-type": "application/json;charset=UTF-8",
            },
            "method": "GET",
            "mode": "cors"
        }).then(res => res.json())
        .then(async json => {

            let startupString = "";
            for (let startup of json) {
                console.log(startup.name);

                if (startup.address.careOf) {
                    startupString = startupString + "<li><b>" + startup.name + "</b> - " + startup.uid + " / " + String(startup.shabDate).substr(8, 2) + "." + String(startup.shabDate).substr(5, 2) + "." + String(startup.shabDate).substr(0, 4) + "</br> (" + startup.address.organisation + ", " + startup.address.careOf + ", " + startup.address.street + " " + startup.address.houseNumber + ", " + startup.address.swissZipCode + " " + startup.address.town + ")";
                } else {
                    startupString = startupString + "<li><b>" + startup.name + "</b> - " + startup.uid + " / " + String(startup.shabDate).substr(8, 2) + "." + String(startup.shabDate).substr(5, 2) + "." + String(startup.shabDate).substr(0, 4) + "</br> (" + startup.address.organisation + ", " + startup.address.street + " " + startup.address.houseNumber + ", " + startup.address.swissZipCode + " " + startup.address.town + ")"; 
                }
                // Add purpose
                startupString = startupString + "<p>" + startup.purpose + "</p>" + "</br>" + "</li>";

            }

            let partnerRef = await db.collection('partnerprogramm').where('active', '==', true).get();
            partnerRef.forEach(async partner => {

                let mail = await db.collection('mail').add({
                    to: partner.data().email,
                    template: {
                        name: 'PartnerMonthlyNewsletter',
                        data: {
                            firstName: partner.data().firstName,
                            lastName: partner.data().lastName,
                            startupString: startupString
                        },
                    },
                })
            });
            res.end();
        }); //fetch Ende
});

app.get('/startups/:type/:from/:to', (req, res) => {

    let type = req.params.type;
    let dateFrom = req.params.from;
    let dateTo = req.params.to;

    console.log("using dates: " + dateFrom + " / " + dateTo);

    let dateFromISO = new Date(dateFrom).toISOString().slice(0.10);
    let dateToISO = new Date(dateTo).toISOString().slice(0.10);
    console.log("using ISO dates: " + dateFromISO + " / " + dateToISO);

    let body = "";
    let legalForm = 0;
    switch (type) {
        case 'ef':
            legalForm = 1;
            break;
        case 'klg':
            legalForm = 2;
            break;
        case 'ag':
            legalForm = 3;
            break;
        case 'gmbh':
            legalForm = 4;
            break;
        case 'all':
            legalForm = "1,2,3,4";
            break;
        default:
            legalForm = 4;
    }


    // registryOffices\":[290] = Schaffhausen
    // registryOffices\":[20] = Zürich
    // registryOffices\":[440] = Thurgau

    /* LEGAL SEATS
Gemeinden	LegalSeats
Neuhausen am Rheinfall	1306
Thayngen	1300
Schaffhausen	1308
Wilchingen	1319
Hallau	1316
Buchberg	1303
Ramsen	1314
Stein am Rhein"	1315
Hemishofen	1313
Trasadingen	1318
Beringen	1302
Löhningen	1288
Stetten (SH)	1299
Lohn (SH)	1297
Büttenhard	1294
Siblingen	1311
Gächlingen	1286
Merishausen	1305
Bargen (SH)	1301
Schleitheim	1310
Beggingen	1309
Neunkirch	1289
Oberhallau	1317
Bibern	1300
Hofen	1300
Opfertshofen	
Altdorf	
Dörflingen	1295
	
	
Laufen-Uhwiesen	31
Flurlingen	26
Andelfingen	27
Feuerthalen	24
Dachsen	22
Marthalen	32
Trüllikon	37
Benken (ZH)	19
Stammheim	3050
	
Schlatt (TG)	1977
Diessenhofen	2908
Basadingen-Schlattingen	1974
Eschenz	1835


*/

    fetch("https://www.zefix.ch/ZefixREST/api/v1/shab/search.json", {
            "headers": {
                "accept": "application/json, text/plain, */*",
                "accept-language": "en-US,en;q=0.9,de;q=0.8,fr;q=0.7",
                "content-type": "application/json;charset=UTF-8",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin"
            },
            "referrer": "https://www.zefix.ch/de/search/shab/welcome",
            "referrerPolicy": "no-referrer-when-downgrade",
            "body": "{\"publicationDate\":\"" + dateFromISO + "\",\"publicationDateEnd\":\"" + dateToISO + "\",\"legalForms\":[" + legalForm + "],\"legalSeats\":[1306,1300,1308,1319,1316,1303,1314,1315,1313,1318,1302,1288,1299,1297,1294,1311,1286,1305,1301,1310,1309,1289,1317,1300,1300,1295,31,26,27,24,22,32,37,19,3050,1977,2908,1974,1835],\"maxEntries\":60,\"mutationTypes\":[2],\"offset\":0}",
//            "body": "{\"publicationDate\":\"" + dateFromISO + "\",\"publicationDateEnd\":\"" + dateToISO + "\",\"legalForms\":[" + legalForm + "],\"registryOffices\":[290],\"maxEntries\":60,\"mutationTypes\":[2],\"offset\":0}",
            "method": "POST",
            "mode": "cors"
        }).then(res => res.json())
        .then(json => {
            //console.log(json)
            let data = [];
            if (json && json.list && json.list.length) {
                //console.log(type + ": " + json.list.length + " entries fetched");
                data = convertHtml(json.list);
            }
            if (json.error) {
                console.log(type + ": " + json.error.suggestion);
            }
            res.json(data);

        }).catch(error => {
            res.send("starthub backend error");
        });

    //res.send("Einzelunternehmen ef | Kollektivgesellschaft kig | Aktiengesellschaft ag | GmbH gmbh");
});


app.get('/startup/:id', (req, res) => {
    const startupId = req.params.id;
    fetch('https://www.zefix.ch/ZefixREST/api/v1/firm/' + startupId + '.json', {

            "method": "GET",
            "mode": "cors"
        }).then(res => res.json())
        .then(json => {

            let list = [];
            list.append(json);

            res.json(convertHtml(list)[0]);
        }).catch(error => {
            res.send("starthub backend error");
        });
    /*
    axios.get('https://www.zefix.ch/ZefixREST/api/v1/firm/' + startupId + '.json').then(function (response) {
                return res.json(response.data);
            });*/
});


function convertHtml(list) {
    for (let listEl in list) {
        for (let pubEl in list[listEl].shabPub) {

            list[listEl].shabPub[pubEl].message = htmlToText.fromString(list[listEl].shabPub[pubEl].message);
            list[listEl].shabPub[pubEl].pdfLink = "https://www.shab.ch/shabforms/servlet/Search?EID=7&DOCID=" + list[listEl].shabPub[pubEl].shabId;
        }
    }
    return list;
}

exports.api = functions.region("europe-west6").https.onRequest(app);


/*
exports.sendWelcomeEmail = functions.auth.user().onCreate((user) => {
    // ...
  });
  exports.sendByeEmail = functions.auth.user().onDelete((user) => {
    // ...
  });
*/

  exports.createUserProfile = functions.region("europe-west6").auth.user().onCreate((user) => {

    const email = user.email; // The email of the user.

    if ( email.search('@starthub.sh')){
        admin.auth().setCustomUserClaims(user.uid, {
            admin: true,
            isStartHub: true,
            isBock: false
        });
    }

    if (email.search('@bockonline.ch')){
        admin.auth().setCustomUserClaims(user.uid,{
            admin: false,
            isStartHub: false,
            isBock: true
        })
    }


    //const displayName = user.displayName; // The display name of the user.
    return db.collection('users').doc(user.uid).set({
        email: email
    });



    // ...
  });


  exports.verifyEmail = functions.region("europe-west6").auth.user().onCreate((user) => {

    if (!user.emailVerified){
        admin
            .auth()
            .generateEmailVerificationLink(user.email, {})
            .then( (link) => {
                // Construct email verification template, embed the link and send
                // using custom SMTP server.
                return db.collection('mail').add({
                    to: user.email,
                    template: {
                        name: 'userCreateSendWelcomeEmail',
                        data: {
                            link: link
                        },
                    },
                })
            })
            .catch((error) => {
                // Some error occurred.
            });
    }
    // ...
  });