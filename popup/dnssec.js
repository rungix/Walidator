browser.runtime.sendMessage({}, function(response) {
  for (tag of document.getElementsByClassName('domain')) {
    tag.textContent = response.domain;
  }

  if (response.scheme == 'https') {
    var http = document.getElementById('http');
    
    if (http != null) {
      http.style.display = 'inline';
    }
  }
});


function handleMessage(request, sender, sendResponse) {
  console.log("Message from the content script: " +
    request.greeting);
  sendResponse({
    response: "Response from background script"
  });
}

browser.runtime.onMessage.addListener(handleMessage);