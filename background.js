// Store active tab URL and scheme to pass to popup
var activeScheme = undefined;
var activeHost = undefined;



function schemeFromURL(url) {
  var scheme = 'http';
  if (url.substring(0, 8) == "https://") {
    scheme = 'https';
  }
}

console.hex = (d) => console.log((Object(d).buffer instanceof ArrayBuffer ? new Uint8Array(d.buffer) :
  typeof d === 'string' ? (new TextEncoder('utf-8')).encode(d) :
  new Uint8ClampedArray(d)).reduce((p, c, i, a) => p + (i % 16 === 0 ? i.toString(16).padStart(6, 0) + '  ' : ' ') +
  c.toString(16).padStart(2, 0) + (i === a.length - 1 || i % 16 === 15 ?
    ' '.repeat((15 - i % 16) * 3) + Array.from(a).splice(i - i % 16, 16).reduce((r, v) =>
      r + (v > 31 && v < 127 || v > 159 ? String.fromCharCode(v) : '.'), '  ') + '\n' : ''), ''));


function hexToBase64(str) {
  return btoa(String.fromCharCode.apply(null,
    str.replace(/\r|\n/g, "").replace(/([\da-fA-F]{2}) ?/g, "0x$1 ").replace(/ +$/, "").split(" ")));
}

// Base64 to Hex
function base64ToHex(str) {
  for (var i = 0, bin = atob(str.replace(/[ \r\n]+$/, "")), hex = []; i < bin.length; ++i) {
    let tmp = bin.charCodeAt(i).toString(16);
    if (tmp.length === 1) tmp = "0" + tmp;
    hex[hex.length] = tmp;
  }
  return hex.join(" ");
}


function hostFromURL(url) {
  var host = url.match(/:\/\/(.[^/]+)/)[1];
  return host;
}

function domainSuffixFromHost(host) {
  var parsed = psl.parse(host);
  var domain = parsed.domain;
  return domain;
}



function checkDNSSEC(details) {
  // !!!!
  browser.pageAction.show(details.tabId);

  // Only consider requests for main web pages
  if (details.type != 'main_frame') return;
  var host = hostFromURL(details.url);
  var domain = domainSuffixFromHost(host);
  var xhr = new XMLHttpRequest();

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      try {
        response = JSON.parse(xhr.responseText);
      } catch (SyntaxError) {
        console.log("Parse JSON response error: %s", xhr.responseText);
        return;
      }

      var icons = {};
      if (response['Status'] === 0 && response['AD'] === true) {
        for (var i in response['Answer']) {
          //  console.log(response['Answer'][i]['data']);
          var key = response['Answer'][i]['data'];
          var pubkey = key.split(" ");
          /* if (parseInt(pubkey[0]) == 256) {
              console.log(pubkey[3]);
              console.hex(Base64.decode(pubkey[3]));  // Get ZSK's pubkey
            }
          */
          // 3: DANE-EE, Domain Issued Certificate; 1: SPKI, Use subject public key; 0: Full, No Hash
          if (parseInt(pubkey[0]) == 3) {
            console.hex(pubkey[3]);
            var base64key = pubkey[3];
            /*
                                    browser.tabs.executeScript({
                                      file: "jsrsasign-all-min.js"
                                    });
                                    browser.tabs.executeScript({
                                      file: "inject.js"
                                    });
                                    browser.tabs.executeScript({
                                      file: "base64x-1.1.js"
                                    });
          */
            var xhrXML = new XMLHttpRequest();
            xhrXML.onreadystatechange = function () {
              
              if (this.readyState == 1) {
                          xhrXML.setRequestHeader("Cache-Control", "max-stale");
              }

              if (this.readyState == 4 && this.status == 200) {
                console.log(xhrXML.response);
                console.log(xhrXML.responseText);
                var patten = /([\s\S]*?)<p id="DANE_SHA1_BASE64">([\s\S]*?)<\/p>/g;

                var htmlGroup = xhrXML.responseText.split(patten);
                var rawHTML = htmlGroup[1];
                var sigValueBase64 = htmlGroup[2];

                console.log(rawHTML);
                console.log(sigValueBase64);

                var sigValueHex = base64ToHex(sigValueBase64);
                console.log(sigValueHex);

                var pemString = KJUR.asn1.ASN1Util.getPEMStringFromHex(base64key, "CERTIFICATE");
                console.log(pemString);

                // initialize
                var sig = new KJUR.crypto.Signature({
                  "alg": "SHA1withRSA"
                });
                // initialize for signature validation
                sig.init(pemString); // signer's certificate
                // Get the whole HTML page

                // sig.updateHex("68656c6c300a");
                sig.updateString(rawHTML);

                // verify signature
                var isValid = sig.verify(sigValueHex);
                console.log(isValid);
                if (isValid) {
                  browser.pageAction.setTitle({
                    tabId: details.tabId,
                    title: 'HTTP validation succeeded'
                  });
                  browser.pageAction.setIcon({
                    tabId: details.tabId,
                    path: 'button/HTTPSecure.png'
                  });
                  browser.pageAction.setPopup({
                    tabId: details.tabId,
                    popup: 'popup/dnssecure_HtmlSecure.html'
                  })
                } else {
                  browser.pageAction.setTitle({
                    tabId: details.tabId,
                    title: 'HTTP validation failed'
                  });
                  browser.pageAction.setIcon({
                    tabId: details.tabId,
                    path: 'button/HTTPTampering.png'
                  });
                  browser.pageAction.setPopup({
                    tabId: details.tabId,
                    popup: 'popup/dnssecure_HtmlInsecure.html'
                  })
                }
              }
            };

            xhrXML.overrideMimeType('text/html');
            xhrXML.open("GET", details.url, true);
            xhrXML.send();
            /*
                        var querying = browser.tabs.query({
                          active: true,
                          currentWindow: true
                        });

                        function messageTab(tabs) {
                          browser.tabs.sendMessage(tabs[0].id, {
                            base64key: pubkey[3]
                          });
                        }
                        querying.then(messageTab);
            */


          }
        }
        browser.pageAction.setTitle({
          tabId: details.tabId,
          title: 'DNSSEC validation succeeded'
        });
        browser.pageAction.setIcon({
          tabId: details.tabId,
          path: 'button/dnssec.png'
        });
        browser.pageAction.setPopup({
          tabId: details.tabId,
          popup: 'popup/dnssecure.html'
        });
      } else {
        browser.pageAction.setTitle({
          tabId: details.tabId,
          title: 'DNSSEC not provided'
        });
        browser.pageAction.setIcon({
          tabId: details.tabId,
          path: 'button/dnssec-lack.png'
        });
        browser.pageAction.setPopup({
          tabId: details.tabId,
          popup: 'popup/dnsinsecure.html'
        });
      }

      // If the loaded tab is still the active one, update popup data
      browser.tabs.get(details.tabId, function (tab) {
        if (tab.active) {
          activeScheme = schemeFromURL(details.url);
          activeHost = host;
        }
      });
    }
  };

  var url = null;

  var service = browser.storage.local.get('service');
  service.then(onService, onError);

  function onService(config) {
    var url = null;
    switch (config.service) {
      case 'cloudflare':
        // url = 'https://cloudflare-dns.com/dns-query?ct=application/dns-json&type=dnskey&name=' + domain;
        url = 'https://cloudflare-dns.com/dns-query?ct=application/dns-json&type=tlsa&name=_80._tcp.' + domain;
        break;
      case 'google':
        // url = 'https://dns.google.com/resolve?type=dnskey&name=' + domain;
        url = 'https://dns.google.com/resolve?type=tlsa&name=_80._tcp.' + domain;
        break;
      default:
        // url = 'https://cloudflare-dns.com/dns-query?ct=application/dns-json&type=TXT&name=key.' + host;
        // url = 'https://cloudflare-dns.com/dns-query?ct=application/dns-json&type=dnskey&name=' + domain;
        url = 'https://cloudflare-dns.com/dns-query?ct=application/dns-json&type=tlsa&name=_80._tcp.' + domain;
        break;
    }
    console.log(url);
    if (url != null) {
      xhr.open('GET', url, true)
      xhr.send();
    }
  }

  function onError(error) {
    console.log('ERROR: could not retrieve saved config.');
  }
}

// Check status on request
browser.webRequest.onCompleted.addListener(checkDNSSEC, {
  // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/RequestFilter
  urls: ['<all_urls>'],
  types: ['main_frame']
});

// Change popup data on tab change
browser.tabs.onActivated.addListener(function (info) {
  browser.tabs.query({
    active: true,
    lastFocusedWindow: true
  }).then(function (tab) {
    activeScheme = schemeFromURL(tab[0].url);
    activeHost = hostFromURL(tab[0].url);
  });
});

browser.webNavigation.onHistoryStateUpdated.addListener(function (details) {
  browser.pageAction.show(details.tabId);
});

// Send the popup its data
browser.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  //  console.log(sender);
  sendResponse({
    scheme: activeScheme,
    domain: activeHost
  });
});


var ua = "Opera/9.80 (X11; Linux i686; Ubuntu/14.10) Presto/2.12.388 Version/12.16";

function rewriteRequestHeader(e) {
  console.log("Modify request header User-Agent: " + ua);

  e.requestHeaders.forEach(function (header) {
    if (header.name.toLowerCase() == "user-agent") {
      header.value = ua;
    }
  });
  return {
    requestHeaders: e.requestHeaders
  };
}

var newCacheControlVaule = "public, max-age=360";

function rewriteResponseHeader(e) {
  var action = 'add';
  for (let header of e.responseHeaders) {
    if (header.name.toLowerCase() === "cache-control") {
      console.log("Modify response header cache-control: " +
        header.value + " -> " + newCacheControlVaule + " for url " + e.url);
      header.value = newCacheControlVaule;
      action = 'modified';
    }
  }
  if (action === 'add') {
    let new_header = {
      "name": "cache-control",
      "value": newCacheControlVaule
    };
    e.responseHeaders.push(new_header);
    console.log("Add response header cache-control: " +
      newCacheControlVaule + " for url " + e.url);
  }
  return {
    responseHeaders: e.responseHeaders
  };
}


var targetUrl = "<all_urls>";

browser.webRequest.onBeforeSendHeaders.addListener(
  rewriteRequestHeader, {
    urls: targetUrl.split(";")
  },
  ["blocking", "requestHeaders"]
);

browser.webRequest.onHeadersReceived.addListener(
  rewriteResponseHeader, {
    urls: targetUrl.split(";")
  },
  ["blocking", "responseHeaders"]
);

function dumpResponseHeader(details) {
  for (let header of details.responseHeaders) {
    console.log(header.name + ": " + header.value);
  }
}


browser.webRequest.onResponseStarted.addListener(
  dumpResponseHeader, {
    urls: targetUrl.split(";")
  },
  ["responseHeaders"]
);