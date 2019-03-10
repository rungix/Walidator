console.hex = (d) => console.log((Object(d).buffer instanceof ArrayBuffer ? new Uint8Array(d.buffer) :
    typeof d === 'string' ? (new TextEncoder('utf-8')).encode(d) :
    new Uint8ClampedArray(d)).reduce((p, c, i, a) => p + (i % 16 === 0 ? i.toString(16).padStart(6, 0) + '  ' : ' ') +
    c.toString(16).padStart(2, 0) + (i === a.length - 1 || i % 16 === 15 ?
        ' '.repeat((15 - i % 16) * 3) + Array.from(a).splice(i - i % 16, 16).reduce((r, v) =>
            r + (v > 31 && v < 127 || v > 159 ? String.fromCharCode(v) : '.'), '  ') + '\n' : ''), ''));

/*
var observer = new MutationObserver(function (mutations, observer) {
    mutations.forEach(function (mutation) {
        var rawHTML = new XMLSerializer().serializeToString(document);
        console.hex(rawHTML);
    });
});

// Options for the observer (which mutations to observe)
var config = {
    attributes: true,
    childList: true,
    subtree: true
};

// Select the node that will be observed for mutations
//var targetNode = document.getElementById('DANE_SHA1_BASE64');
try {
    observer.observe(document, config);
} catch (e) {
    console.log(e instanceof TypeError); // true
    console.log(e.message); // "null has no properties"
    console.log(e.name); // "TypeError"
    console.log(e.fileName); // "Scratchpad/1"
    console.log(e.lineNumber); // 2
    console.log(e.columnNumber); // 2
    console.log(e.stack); // "@Scratchpad/2:2:3\n"
}
*/

function WalidatorPageReceiver(request, sender, sendResponse) {
    var sigValueBase64 = document.getElementById('DANE_SHA1_BASE64').innerHTML;
    console.log(sigValueBase64);
    var sigValueHex = b64tohex(sigValueBase64);
    console.log(sigValueHex);

    // remove sigValueBase64
    document.getElementById("DANE_SHA1_BASE64").outerHTML = "";

    var pemString = KJUR.asn1.ASN1Util.getPEMStringFromHex(request.base64key, "CERTIFICATE");
    console.log(pemString);

    // initialize
    var sig = new KJUR.crypto.Signature({
        "alg": "SHA1withRSA"
    });
    // initialize for signature validation
    sig.init(pemString); // signer's certificate
    // Get the whole HTML page
    var html = document.documentElement.outerHTML;
    console.log(html);
    console.hex(html);

    // sig.updateHex("68656c6c300a");
    sig.updateString("html");

    // verify signature
    var isValid = sig.verify(sigValueHex);
    console.log(isValid);

    browser.browserAction.setPopup({
        popup: 'popup/dnssecure_HtmlInsecure.html'
    });

    function handleResponse(message) {
        console.log(`Message from the background script:  ${message.response}`);
    }

    function handleError(error) {
        console.log(`Error: ${error}`);
    }


    if (isValid) {
        /*
        var sending = browser.runtime.sendMessage({
            greeting: "Greeting from the content script"
        });
        */

    } else {
        /*
        var sending = browser.runtime.sendMessage({
            greeting: "Failure"
        });
        */
    }
    // sending.then(handleResponse, handleError);

}

browser.runtime.onMessage.addListener(WalidatorPageReceiver);