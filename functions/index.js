const functions = require('firebase-functions');
const {
    parse
} = require('json2csv');

const stripe = require('stripe')('sk_test_51ItfioE6utsimb7AdlVEbhfCn17yp5l0BRuUR2pkOiFckkdmraP84l8qimWff7VCypY7XzuP1w8QUvrXbz9q0I6b00eIVnxFph');


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

const wordpress = require("wordpress");

const app = express();

const FormData = require('form-data');

const htmlToText = require('html-to-text');

const moment = require('moment');
const {
    json
} = require('express');

/*
import {
    config
} from '../functions/config/config'

import {
    format
  } from 'date-fns'
*/

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

                createWordPressPage(json, date, dateNow);

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

                //createWordPressPage(json, date, dateNow);
            }); //fetch Ende
    });

app.get('/oidc/.well-known/openid-configuration', (req, res) => {

    fetch('https://eid.sh.ch/.well-known/openid-configuration', {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "content-type": "application/json;charset=UTF-8",
        },
        "method": "GET",
        "mode": "cors"
    }).then(resp => resp.json()).then(json => {
        return res.json(json);
    });
});

app.get('/oidc', (req, res) => {

    fetch('https://eid.sh.ch/.well-known/openid-configuration', {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "content-type": "application/json;charset=UTF-8",
        },
        "method": "GET",
        "mode": "cors"
    }).then(resp => resp.json()).then(json => {
        return res.json(json);
    });
});

app.get('/oidc-test', (req, res) => {

    fetch('https://gateway.test.eid.sh.ch/.well-known/openid-configuration', {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "content-type": "application/json;charset=UTF-8",
        },
        "method": "GET",
        "mode": "cors"
    }).then(resp => resp.json()).then(json => {
        return res.json(json);
    });
});

app.get('/oidc-test/.well-known/openid-configuration', (req, res) => {

    fetch('https://gateway.test.eid.sh.ch/.well-known/openid-configuration', {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "content-type": "application/json;charset=UTF-8",
        },
        "method": "GET",
        "mode": "cors"
    }).then(resp => resp.json()).then(json => {
        return res.json(json);
    });
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


app.get('/printStartups/:type/:from/:to', (req, res) => {

    //https://europe-west6-starthub-schaffhausen.cloudfunctions.net/api/printStartups/all/2021-01-01/2021-08-01

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
            "body": "{\"publicationDate\":\"" + dateFromISO + "\",\"publicationDateEnd\":\"" + dateToISO + "\",\"legalForms\":[" + legalForm + "],\"legalSeats\":[1306,1300,1308,1319,1316,1303,1314,1315,1313,1318,1302,1288,1299,1297,1294,1311,1286,1305,1301,1310,1309,1289,1317,1300,1300,1295,31,26,27,24,22,32,37,19,3050,1977,2908,1974,1835],\"maxEntries\":1000,\"mutationTypes\":[2],\"offset\":0}",
            "method": "POST",
            "mode": "cors"
        }).then(res => res.json())
        .then(json => {
            //console.log(json)
            let data = [];
            if (json && json.list && json.list.length) {
                data = convertHtml(json.list);
            }
            if (json.error) {
                console.log(type + ": " + json.error.suggestion);
            }

            let lineItem = "";
            let csvFileArray = [];
            for (let entry of data) {
                lineItem = {
                    "organisation": entry.address.organisation,
                    "careOf": entry.address.careOf,
                    "street": entry.address.street,
                    "houseNumber": entry.address.houseNumber,
                    "swissZipCode": entry.address.swissZipCode,
                    "town": entry.address.town,
                    "purpose": entry.purpose
                };

                //entry.address.organisation + ";" + entry.address.careOf + ";" + entry.address.street + ";" + entry.address.houseNumber + ";" + entry.address.swissZipCode + ";" + entry.address.town ; //+ "\r\n";
                //console.log(lineItem);
                csvFileArray.push(lineItem);
            }

            try {
                const fields = ['organisation', 'careOf', 'street', 'houseNumber', 'swissZipCode', 'town', 'purpose'];
                const opts = {
                    fields,
                    //excelStrings: true,
                    withBOM: true
                };
                const csv = parse(csvFileArray, opts);
                //console.log(csv);

                res.set('Content-Type', 'text/csv;charset=utf-8');
                res.attachment('starthub_adressen_' + dateFrom + '-' + dateTo + '.csv');
                res.status(200).send(csv); //"data:text/csv;charset=utf-8,%EF%BB%BF" + 

            } catch (err) {
                console.error(err);
                res.send("error");
            }




        }).catch(error => {
            res.send("starthub backend error");
        });

    //res.send("Einzelunternehmen ef | Kollektivgesellschaft kig | Aktiengesellschaft ag | GmbH gmbh");
});



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
    console.log("New User with E-Mail: " + email);

    if (email.search('@starthub.sh') !== -1) {
        admin.auth().setCustomUserClaims(user.uid, {
            admin: true,
            isStartHub: true,
            isBock: false
        });
        return db.collection('users').doc(user.uid).set({
            email: email,
            admin: true,
            isStartHub: true,
            isBock: false,
            profilePicture: "https://via.placeholder.com/600/7d94ff",
            bio: "Noch keine Bio vorhanden"
        }, {
            merge: true
        });
    } else if (email.search('@bockonline.ch') !== -1) {
        admin.auth().setCustomUserClaims(user.uid, {
            admin: false,
            isStartHub: false,
            isBock: true
        })

        return db.collection('users').doc(user.uid).set({
            email: email,
            admin: true,
            isStartHub: true,
            isBock: false,
            profilePicture: "https://via.placeholder.com/600/7d94ff",
            bio: "Noch keine Bio vorhanden"
        }, {
            merge: true
        });
    } else {
        return db.collection('users').doc(user.uid).set({
            email: email,
            admin: false,
            isStartHub: false,
            isBock: false,
            profilePicture: "https://via.placeholder.com/600/7d94ff",
            bio: "Noch keine Bio vorhanden"
        }, {
            merge: true
        });
        //TODO: Send Welcome Mail with Instructions to the tool

    }
});


exports.verifyEmail = functions.region("europe-west6").auth.user().onCreate((user) => {

    if (!user.emailVerified) {
        return admin
            .auth()
            .generateEmailVerificationLink(user.email)
            .then(link => {
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
    } else {
        return;
    }
    // ...
});


exports.updateInvoiceStripeWebHook = functions.region('europe-west6').https.onRequest(async (req, resp) => {
    //TRIGGER FIRESTORE FROM STRIPE: 

    console.log(">>> WEBHOOK MODE: " + req.body.type);
    //console.log(">>> stripeInvoiceId: " + req.body.data.object.id);
    //console.log(">>> DATA: " + JSON.stringify(req.body));

    const stripeInvoiceId = req.body.data.object.id; // wird über firebase function gesetzt.. anschliessend mit webhook (=hier gelesen)
    const invoiceList = await db.collection('invoices').where('stripeInvoiceId', '==', stripeInvoiceId).get();

    if (invoiceList.empty) {
        console.log(">>> NO Invoice found with stripeInvoiceId: " + stripeInvoiceId);
    } else {
        console.log(">>> Invoice found: " + stripeInvoiceId);

        const invoiceData = invoiceList.docs[0].data();
        const userId = invoiceData.userId; //only one!
        const reservationId = invoiceData.reservationId; //only one!
        const pdf = req.body.data.object.invoice_pdf || "";

        const reservationRef = await db.collection('users').doc(userId).collection('reservations').doc(reservationId).get();
        console.log(">>> USER RESERVATION DATA: " + JSON.stringify(reservationRef.data()));

        const reservation = reservationRef.data().reservation;
        console.log(">>> Reservation Object DATA" + JSON.stringify(reservation));

        const meta = reservationRef.data().meta;
        console.log(">>> Meta Object DATA" + JSON.stringify(meta));

        if (req.body.type == 'invoice.created') {

        } else if (req.body.type == 'invoice.updated') {
            //update user invoice

            await db.collection('users').doc(userId).collection('reservations').doc(reservationId).set({
                statusPaid: req.body.data.object.paid,
                pdf: pdf,

                stripeInvoiceId: stripeInvoiceId,
                stripeInvoiceUrl: invoiceData.stripeInvoiceUrl,
                stripeInvoiceRecord: invoiceData.stripeInvoiceRecord

                //RESERVATION SACHEN SIND SCHON HIER
            }, {
                merge: true
            });

            //update invoice:
            await db.collection('invoices').doc(reservationId).set({
                statusPaid: req.body.data.object.paid,
                pdf: pdf,

                //STRIPE SACHEN SIND SCHON HIER

                reservationFrom: reservation.dateFrom,
                reservationTo: reservation.dateTo,
                reservationDeskId: reservation.desk.id,
                reservationDeskName: reservation.desk.name,
                reservationDeskDescription: reservation.desk.description,
                reservationTypeDescription: reservation.bookingTypeDescription,

            }, {
                merge: true
            });

        } else if (req.body.type == 'invoice.paid') {

            //TODO Check this...
            //Add Reservation to DESK
            /*const reservation = await db.collection('users').doc(userId).collection('reservations').doc(reservationId).get();
            const deskReservation = await db.collection('desks').doc(reservation.data().desk.id).collection('reservations').doc(reservationId).set(
            reservation.data(), {
                merge: true
            });*/

            //update user invoice
            await db.collection('users').doc(userId).collection('reservations').doc(reservationId).set({
                statusPaid: req.body.data.object.paid,
            }, {
                merge: true
            });

            //update invoice:
            await db.collection('invoices').doc(reservationId).set({
                statusPaid: req.body.data.object.paid,
            }, {
                merge: true
            });

        }
    }
    resp.end();
});


exports.deleteReservation = functions.region('europe-west6').firestore.document('/users/{userId}/reservations/{reservationId}').onDelete(async (snapshot, context) => {
    //CLEAN UP RESERVATION / INVOICES
    console.log(">>> CLEAN UP/DELETE INVOICES & RESERVATIONS");

    const userId = context.params.userId;
    const reservationId = context.params.reservationId;

    let reservation = snapshot.data().reservation;
    console.log(">>> Delete Reservation: " + JSON.stringify(reservation));

    //Format Date
    reservation.dateFrom = new Date(reservation.dateFrom._seconds * 1000);
    reservation.dateTo = new Date(reservation.dateTo._seconds * 1000);

    console.log(reservation.dateFrom);
    console.log(reservation.dateTo);
    console.log(reservation.bookingType);

    //Falls Tagesbuchungen, dann ganze Reservation löschen
    if (reservation.bookingType == 'Day' || reservation.bookingType == 'Week' || reservation.bookingType == 'Month') {
        for (var d = reservation.dateFrom; d <= reservation.dateTo; d = new Date(d.getTime() + (1000 * 60 * 60 * 24))) {
            await db.collection('desks').doc(reservation.desk.id).collection('reservations').doc(d.toISOString().substr(0, 10)).delete();
            console.log(">>> DELETE RESERVATION DATE: " + d.toISOString().substr(0, 10));
        }
    } else { //Falls halbtagesbuchungen: 
        let dayRef = await db.collection('desks').doc(reservation.desk.id)
            .collection('reservations')
            .doc(reservation.dateFrom.toISOString().substr(0, 10)).get();

        const object = dayRef.data();

        delete object[reservation.bookingType]

        if (object.hasOwnProperty('Morning') || object.hasOwnProperty('Afternoon')) {
            //Falls noch morgen/nachmittag, dann nichts am object ändern.
            await db.collection('desks').doc(reservation.desk.id)
                .collection('reservations')
                .doc(reservation.dateFrom.toISOString().substr(0, 10)).set(object);
        } else {
            //falls keine halbtagesbuchung mehr vorhanden, dann löschen.
            await db.collection('desks').doc(reservation.desk.id)
                .collection('reservations')
                .doc(reservation.dateFrom.toISOString().substr(0, 10)).delete()
        }
    }

    await db.collection('community').doc(reservationId).delete();

    // TODO --> STRIPE API aufrufen und Rechnung gutschreiben.
    // SEND MAIL AN SANDRO für MANUELLE VERARBEITUNG?

    /*const invoiceRef = await db.collection('invoices').doc(reservationId).get();
    console.log("payment id from stripe: " + invoiceRef.data().stripeInvoiceId);
    
    const invoice = await stripe.invoices.finalizeInvoice(
        invoiceRef.data().stripeInvoiceId
      );
    console.log("finalize invoice in stripe: " + JSON.stringify(invoice));

    const refund = await stripe.refunds.create({
        charge: invoiceRef.data().payment_intent,
    });
    console.log("Stripe Refund: " + JSON.stringify(refund));
    */

    //Delete Invoice
    const invoiceRef = await db.collection('invoices').doc(reservationId).set({
        canceled: true
    }, {
        merge: true
    });

    await db.collection('invoices').doc(reservationId).delete();

    return true;
});

exports.createInvoice = functions.region('europe-west6').firestore.document('/users/{userId}/reservations/{reservationId}').onCreate(async (snapshot, context) => {
    //CREATE GLOBAL INVOICE FROM RESERVATION in APP TO TRIGGER EXTENSION

    const userId = context.params.userId;
    const reservationId = context.params.reservationId;

    let userReservationData = snapshot.data().reservation;
    userReservationData.id = snapshot.id;

    let metadata = snapshot.data().meta;
    console.log(">>> Invoice on user Profile created with data: ");
    console.log(JSON.stringify(userReservationData));
    console.log(JSON.stringify(metadata));

    //GET USERDATA
    const userRef = await db.collection('users').doc(userId).get();
    const userData = userRef.data();

    //SEND E-MAIL mit RECHNUNG!!!! --> Wird schon von Stripe gemacht, aber wir machen das auch noch mit Starthub Branding
    try {
        await db.collection('mail').add({
            to: userData.email,
            template: {
                name: 'MeetinPointReservation',
                data: {
                    tisch: userReservationData.desk.name,
                    firstName: metadata.firstName,
                    startDatum: metadata.dateFromStringDate,
                    //new Date(reservation.data().dateFrom._seconds *1000 + ( new Date().getTimezoneOffset() * 60 * 1000 )).toISOString().substring(8, 10) + "." + new Date(reservation.data().dateFrom._seconds *1000 + ( new Date().getTimezoneOffset() * 60 * 1000 )).toISOString().substring(5, 7) + "." + new Date(reservation.data().dateFrom._seconds * 1000 + ( new Date().getTimezoneOffset() * 60 * 1000 )).toISOString().substring(0, 4),
                    startUhrzeit: metadata.dateFromStringTime,
                    //new Date(reservation.data().dateFrom._seconds *1000 + ( new Date().getTimezoneOffset() * 60 * 1000 + ( new Date().getTimezoneOffset() * 60 * 1000 ) ) ).toISOString().substring(11, 16),
                    endeDatum: metadata.dateToStringDate,
                    //new Date(reservation.data().dateTo._seconds *1000 + ( new Date().getTimezoneOffset() * 60 * 1000 )).toISOString().substring(8, 10) + "." + new Date(reservation.data().dateTo._seconds * 1000 + ( new Date().getTimezoneOffset() * 60 * 1000 )).toISOString().substring(5, 7) + "." + new Date(reservation.data().dateTo._seconds * 1000 + ( new Date().getTimezoneOffset() * 60 * 1000 )).toISOString().substring(0, 4),
                    endeUhrzeit: metadata.dateToStringTime,
                    //new Date(reservation.data().dateTo._seconds *1000 + ( new Date().getTimezoneOffset() * 60 * 1000 )).toISOString().substring(11, 16),
                    //stripeInvoiceUrl: invoiceData.stripeInvoiceUrl
                },
            },
        })
    } catch (e) {
        console.error(e);
    }

    /// ADD COMMUNITY FEED
    //const userRef = await db.collection('users').doc(userId).get(); // WIESO HATTE ICH DAS DRIN?
    console.log("Create Community");
    await db.collection('community').doc(reservationId).set({
        metadata,
        bio: userData.bio || "noch keine Bio vorhanden",
        profilePicture: userData.profilePicture || "https://via.placeholder.com/600/7d94ff"
    });


    //Create Invoice 
    if (userReservationData.bookingType == "Morning") {
        userReservationData.price = 7;
        if (userData.isStudent) {
            userReservationData.price = 5;
        }
    } else if (userReservationData.bookingType == "Afternoon") {
        userReservationData.price = 7;
        if (userData.isStudent) {
            userReservationData.price = 5;
        }
    } else if (userReservationData.bookingType == "Day") {
        userReservationData.price = 12;
        if (userData.isStudent) {
            userReservationData.price = 10;
        }
    } else if (userReservationData.bookingType == "Week") {
        userReservationData.price = 55;
        if (userData.isStudent) {
            userReservationData.price = 50;
        }
    } else { //month
        userReservationData.price = 250;
        if (userData.isStudent) {
            userReservationData.price = 200;
        }
    }

    //SAVE TO STRIPE ONLY ON NOT WEDNESDAY and Day / HALFDAY BOOKING
    const isMittwoch = new Date(userReservationData.dateFrom._seconds * 1000);
    if ((userReservationData.bookingType == "Morning" || userReservationData.bookingType == "Afternoon" || userReservationData.bookingType == "Day") && isMittwoch.getDay() === 3) {
        // GRATIS TAG!!!!
        console.log(">> IS FREE DAY!!! ")
        userReservationData.price = 0;
    }
    console.log(">>> USER IS STUDENT? " + userData.isStudent);
    console.log(">>> PRICE FOR BOOKING IS: " + userReservationData.price);

    const invoiceRef = await db.collection('invoices').doc(reservationId).set({
        email: userData.email,
        daysUntilDue: 0,
        items: [{
            amount: userReservationData.price * 100, //rappen
            currency: "chf",
            quantity: 1, // Optional, defaults to 1.
            description: 'Meetingpoint Reservation "' + userReservationData.desk.name + '": ' + userReservationData.bookingTypeDescription +
                '. Beginn: ' + metadata.dateFromStringDate + " " + metadata.dateFromStringTime +
                ' Ende: ' + metadata.dateToStringDate + " " + metadata.dateToStringTime
        }],
        reservationId: reservationId,
        canceled: false,
        userId: userId,
        firstName: userData.firstName || "Kein Vorname",
        lastName: userData.lastName || "Kein Nachname",
        profilePicture: userData.profilePicture || "Kein Bild",
    });


    // BOOK TABLE
    const dateFrom = new Date(userReservationData.dateFrom._seconds * 1000);
    const dateTo = new Date(userReservationData.dateTo._seconds * 1000);

    for (var d = dateFrom; d <= dateTo; d = new Date(d.getTime() + (1000 * 60 * 60 * 24))) {

        //get current Date
        let dayRef = await db.collection('desks').doc(userReservationData.desk.id)
            .collection('reservations')
            .doc(new Date(d).toISOString().substr(0, 10)).get();

        let dataObject = dayRef.data() || {};

        dataObject[userReservationData.bookingType] = reservationId;

        if (userReservationData.bookingType === 'Morning') { //Falls Morgen gebucht, Tagesbuchung nicht möglich
            dataObject['Day'] = reservationId;

        } else if (userReservationData.bookingType === 'Afternoon') { //Falls Nachmittag gebucht, Tagesbuchung nicht möglich
            dataObject['Day'] = reservationId;

        } else {
            dataObject['Day'] = reservationId; //Wird oben schon gesetzt 
        }

        console.log(">>> " + new Date(d).toISOString().substr(0, 10) + " save desk: " + JSON.stringify(dataObject));

        //set current Date
        await db.collection('desks').doc(userReservationData.desk.id)
            .collection('reservations')
            .doc(new Date(d).toISOString().substr(0, 10)).set(dataObject);
    }
    console.log(">>> Invoice on firebase created");
    return true;

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


function createWordPressPage(json, date, dateNowe) {

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


    var client = wordpress.createClient({
        url: "https://www.starthub.sh",
        username: functions.config().wordpress.username,
        password: functions.config().wordpress.password
    });

    client.newPost({
        type: "page",
        title: "Gründungen " + moment().subtract(1, 'day').locale('de').format('MMM YYYY'),
        content: startupString,
        status: "publish",
        slug: "gruendungen-" + moment().subtract(1, 'day').locale('de').format('YYYY') + "-" + moment().subtract(1, 'day').locale('de').format('MM'),
        parent: 1998


    }, function (error, data) {
        console.log("Post sent! The server replied with the following:\n");
        console.log(arguments);
        console.log("\n");
    });

    /*client.getPosts(function( error, posts ) {
        for (let post of posts){
            console.log(JSON.stringify(post));
        }
    });*/

};