
// STATES

let domainCookies = {};
let updatedTabs = {};
let ipfsGateway = JSON.parse(localStorage.getItem("ipfsGateway"));

// EVENTS

chrome.browserAction.onClicked.addListener(() => {
  chrome.tabs.create({
    url: chrome.runtime.getURL("index.html"),
    index: 0
  }, function(win) {
    // win represents the Window object from windows API
    // Do something after opening
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  gatewayHandler(tab);
});

chrome.tabs.onCreated.addListener((tab) => {
  if(tab.id) {
    gatewayHandler(tab);
  } else {
    console.log("log id not created", tab);
  }
});

chrome.webRequest.onErrorOccurred.addListener((details) => {
  console.log("ERROR4!", details);
},{
  urls: [ipfsGateway + "/*"]
});

// FUNCTIONS

function gatewayHandler(tab) {
  if(tab.url) {
    //refresh gateways
    ipfsGateway = JSON.parse(localStorage.getItem("ipfsGateway"));

    //TODO for swarm too
    pageUrlArray = tab.url.split("/");
    if (pageUrlArray.length < 5) {
      return;
    }
    const gatewayUrl = pageUrlArray[0] + "//" + pageUrlArray[2];
    const contentUrl = pageUrlArray[3] + "/" + pageUrlArray[4];
    const pageUrl = gatewayUrl + "/" + contentUrl;

    if(!updatedTabs[tab.id] && ipfsGateway === gatewayUrl) {
      updatedTabs[tab.id] = {...tab, gatewayUrl};
      console.log("tab", tab);
      console.log("ipfsGateway", ipfsGateway + "/*");

      /// @dev Redirect any request on the gateway, which url doesn't start with ipfs or ipns. (IPFS gateway)
      chrome.webRequest.onBeforeRequest.addListener((details) => {
          const requestUrlArray = details.url.split("/");
          let requestPath = "";
          for (var i = 3; i < requestUrlArray.length; i++) {
            requestPath += "/" + requestUrlArray[i];
          }

          //handle ipfs gateway setting
          if(requestUrlArray[3] !== "ipfs"
          && requestUrlArray[3] !== "ipns") {
            const redirectUrl = gatewayUrl + "/" + contentUrl + requestPath;
            console.log("redirect", redirectUrl);
            return {
              redirectUrl: redirectUrl
            };
          }
        },
        {
          urls: [ipfsGateway + "/*"],
          tabId: tab.id
        },
        ["blocking"]
      );

      chrome.webRequest.onHeadersReceived.addListener(
        saveCookies,
        {
          urls: ["<all_urls>"],
          tabId: tab.id
        },
        ["responseHeaders", "extraHeaders"]
      );

      chrome.webRequest.onBeforeSendHeaders.addListener(
        addCookiesToRequest,
        {
          urls: ["<all_urls>"],
          tabId: tab.id
        },
        ["blocking", "requestHeaders", "extraHeaders"]
      );
    } else if(updatedTabs[tab.id] && updatedTabs[tab.id].gatewayUrl !== gatewayUrl) {
      console.log("This tab isn't gateway anymore");
      updatedTabs[tab.id] = null;
      chrome.webRequest.onHeadersReceived.removeListener(saveCookies);
      chrome.webRequest.onBeforeSendHeaders.removeListener(addCookiesToRequest);
    }
  }
}

/// @dev save every set-cookie value to its domain.
function saveCookies(details) {
  console.log("receivedHeaders", details);
  const urlArray = details.url.split("/");
  const domain = urlArray[2];

  for (const responseHeader of details.responseHeaders) {
    if(responseHeader.name === "set-cookie") {
      const responseHeaderArray = responseHeader.value.split(";");
      const cookieArray = responseHeaderArray[0].split("=");
      const cookie = {
        name: cookieArray[0],
        value: cookieArray[1]
      };
      domainCookies[domain] = {...domainCookies[domain], [cookie.name]: cookie.value};
    }
  }
}

/// @dev Append auth cookies to every request.
function addCookiesToRequest(details) {
  const domain = details.url.split("/")[2];

  if(domainCookies[domain]) {
    // If the request already contains cookie, don't append
    let cookies = "";
    for (const [key, value] of Object.entries(domainCookies[domain])) {
      cookies += key + "=" + value + "; ";
    }
    details.requestHeaders = details.requestHeaders.concat([{name: "Cookie", value: cookies }]);
  }
  console.log("requestHeaders", details);
  return {
    requestHeaders: details.requestHeaders
  };
}
