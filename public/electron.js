const { app, session, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { spawn, execFile, execFileSync } = require('child_process');
const os = require('os');
const fs = require('fs'); //for ipfs string store

let domainCookies = {};
let ipfsGateway = 'http://localhost:8080';
const ipfsGatewayFilter = {
  urls: [ipfsGateway + "/*"]
}
const currentPlatform = os.platform();
let web3, ipfs;

function getP2pAppsPath() {
  let executablePath = ""
  if(isDev) {
    executablePath = path.join(__dirname, '../p2pApps')
  } else {
    executablePath = path.join(app.getAppPath(), '../../resources', 'p2pApps')
  }
  return executablePath
}

function getGethPath() {
  let executablePath =  path.join(getP2pAppsPath(), 'geth', currentPlatform, 'geth')
  if(currentPlatform === 'win32') {
    executablePath += '.exe'
  }
  return executablePath
}

function getIpfsPath() {
  let executablePath =  path.join(getP2pAppsPath(), 'ipfs', currentPlatform, 'ipfs')
  if(currentPlatform === 'win32') {
    executablePath += '.exe'
  }
  return executablePath
}

function initIpfs() {
  ipfs = spawn(getIpfsPath(), [
    'daemon'
  ])
  ipfs.stderr.on('data', data => {
    console.log(`ipfsErr: ${data}`);
  })
  ipfs.stdout.on('data', data => {
    console.log(`ipfsOut: ${data}`);
  })
}

function initWeb3() {
  let executablePath = getGethPath()

  console.log("Start Web3 with executable", executablePath)

  web3 = spawn(executablePath, [
    '--rinkeby',
    '--ws',
    '--wsapi', 'personal,eth,shh,web3,net',
    '--wsport', '8545',
    '--wsorigins', '*',
    '--wsaddr', '127.0.0.1',
    '--allow-insecure-unlock',
    '--syncmode', 'light'
  ]);

  web3.stderr.on('data', (data) => {
    console.error(`web3Error: ${data}`);
  });

  web3.stdout.on('data', (data) => {
    console.log(`web3Out: ${data}`);
  });

  web3.on('close', (code) => {
    console.log(`Web3 child process exited with code ${code}`);
  });
}

function initDecentralizedApps() {
  initWeb3()
  initIpfs()
}

function beforeRequestHandler() {
  // IPFS
  // Redirect request when the url doesn't contain the root CID
  session.defaultSession.webRequest.onBeforeRequest(ipfsGatewayFilter, (details, callback) => {
    let pageUrlArray = details.url.split("/");
    let referrer = details.referrer;

    if (pageUrlArray[3] === 'ipfs' || pageUrlArray[3] === 'ipns') {
      callback({
        cancel: false
      });
    } else {
      contentPath = pageUrlArray.slice(3).join("/");
      callback({
        redirectURL: referrer + contentPath
      })
    }
  })
}

function headersReceivedHandler() {
  // IPFS
  // Add cookies to requests
  session.defaultSession.webRequest.onHeadersReceived({
    urls: ["<all_urls>"]
  }, (details, callback) => {

    if(('set-cookie') in details.responseHeaders) {
      const cookieString  = details.responseHeaders['set-cookie'][0]
      const cookieAttrArray = cookieString.split(";");

      const pageUrlArray = details.url.split("/");
      const domain = pageUrlArray[0] + "//" + pageUrlArray[2]; //CID

      domainCookies[domain] = cookieAttrArray[0];
    }

    callback({
      cancel: false
    })
  })
}

function beforeSendHeadersHandler() {
  // IPFS
  // Append the Cookie header to the requests on the dApp page if saved Cookie before.
  session.defaultSession.webRequest.onBeforeSendHeaders({
    urls: ["<all_urls>"]
  }, (details, callback) => {
    const pageUrlArray = details.url.split("/");
    const domain = pageUrlArray[0] + "//" + pageUrlArray[2]; //CID

    if(domainCookies[domain]) {
      details.requestHeaders["Cookie"] = domainCookies[domain];
    }

    callback({
      requestHeaders: details.requestHeaders
    });
  })
}

function webRequestHandler() {
  beforeRequestHandler();
  beforeSendHeadersHandler();
  headersReceivedHandler();
}

let mainWindow;

let sendTransactionParents = {}
ipcMain.on('open-send-transaction-popup', (e, args) => {
  console.log("open-send-transaction-popup", args)
  const {popupId, to, value, data} = {...args}
  let ep =  `sendtransaction/${popupId}/${to}/${value}/${data}`
  console.log("ep", ep)
  let options = {
    width: 460,
    height: 640,
    parent: mainWindow,
    // modal: true,
    webPreferences: {
      nodeIntegration: true
    },
    backgroundcolor: '#FFF',
    icon: path.join(__dirname, '/icons/256x256.png')
  }
  let popup = new BrowserWindow(options)
  popup.loadURL(isDev ? `http://localhost:3000#${ep}` : `file://${path.join(__dirname, '../build/index.html#' + ep)}`);
  //send back answer
  sendTransactionParents[popupId] = e.sender
})
//send back answer
ipcMain.on('result-sendtransaction-popup', (e, args) => {
  const { popupId } = args
  console.log("result-sendtransaction-popup argsid", popupId)
  console.log("result-sendtransaction-popup parents", sendTransactionParents)
  sendTransactionParents[popupId].send('result-sendtransaction-popup', args)}
)

// IPFS methods
ipcMain.on('add-ipfs-file', (e, args) => {
  const { filePath, id } = args
  console.log("add-ipfs-file", filePath)
  const ipfsAdd = spawn(getIpfsPath(), [
    'add',
    '-Q',
    filePath
  ])
  ipfsAdd.stdout.on('data', (data) => {
    const dataString = `${data}`
      .replace(/(\r\n|\n|\r)/gm, ""); // remove new lilne characters
    console.log(`ipfsAddOut:`, dataString);
    const result = {
      hash: `${dataString}`,
      content: filePath
    }
    // send if no other data can come
    e.sender.send('result-add-ipfs-file', {successful: true, result, id})
  });
})

ipcMain.on('add-ipfs-folder', (e, args) => {
  const { path, id } = args
  const addedFiles = []
  const folderName = path.substring(path.lastIndexOf('/') + 1, path.length)
  console.log("folderName", folderName)
  const ipfsAdd = spawn(getIpfsPath(), [
    'add',
    '-r',
    path
  ])
  ipfsAdd.stdout.on('data', (data) => {
    const dataString = `${data}`
    console.log(`ipfsAddOut:`, dataString);
    const dataRows = dataString.split("\n")
    for(const dataRow of dataRows) {
      const dataArray = dataRow.split(' ')
      if(!dataArray[1]) {
        continue
      }
      const hash = dataArray[1]
      const content = dataArray[2]
      addedFiles.push({
        hash,
        content
      })
      // send if no other data can come
      if(content === folderName) {
        e.sender.send('result-add-ipfs-folder', {successful: true, result: addedFiles, id})
      }
    }
  });
})

ipcMain.on('publish-ipfs-hash', (e, args) => {
  const { id, key, hash } = args
  if(!keyCheck(key)) {
    createKey(key)
  }
  console.log("publish-ipfs-hash", hash)
  execFile(getIpfsPath(), [
    'name',
    'publish',
    '-Q', //only hash
    '--key',
    key,
    hash
  ], (error, stdout, stderr) => {
    if (error) {
      throw error;
    }
    const err = `${stderr}`
    if(err) {
      console.warn(err)
    }
    const publishedHash = `${stdout}`
    console.log("result-publish-ipfs-hash", publishedHash)

    e.sender.send('result-publish-ipfs-hash', {successful: true, result: publishedHash, id})
  })
})

ipcMain.on('add-ipfs-string', (e, args) => {
  const { filename, value, id } = args
  const tempPath = path.join(os.tmpdir(), filename)

  addIpfsString(tempPath, value).then((result) => {
    e.sender.send('result-add-ipfs-string', {successful: true, result, id})
  })
})

/// Return the key is found or not in the repo
function keyCheck(key) {
  // unfortunately it has to be sync method
  // because the NodeJS doesn't have proper event lock ending
  let keys = execFileSync(getIpfsPath(), [
    'key',
    'list',
  ])
  keys = keys.toString().split(/\r?\n/)
  keys.pop() //last item remove which is ''

  if(keys.findIndex(k => k === key) > -1) {
    return true
  }
  return false
}

function createKey(key) {
  // unfortunately it has to be sync method
  // because the NodeJS doesn't have proper event lock ending
  const keyGen = execFileSync(getIpfsPath(), [
    'key',
    'gen',
    key
  ])
}

function saveStringToFile(path, value) {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, value, function(err) {
      if(err) {
        reject(err)
      }
      console.log("String saved to", path);
      resolve()
    });
  })
}

function addIpfsString(path, value) {
  return new Promise((resolve) => {
    saveStringToFile(path, value).then(() => {
      const ipfsAdd = spawn(getIpfsPath(), [
        'add',
        path
      ])

      ipfsAdd.stdout.on('data', (data) => {
        const dataString = `${data}`
        console.log(`ipfsAddOut:`, dataString);
        const dataArray = dataString.split(' ')
        const result = {
          hash: dataArray[1],
          content: dataArray[2]
        }
        // send if no other data can come
        resolve(result)
      });
    })
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    webPreferences: {
      nodeIntegration: true,
    },
    backgroundcolor: '#FFF',
    icon: path.join(__dirname, '/icons/256x256.png')
  });
  mainWindow.loadURL(isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`);
  mainWindow.setMenuBarVisibility(false)
  // if (isDev) {
  //   // Open the DevTools.
  //   //BrowserWindow.addDevToolsExtension('<location to your react chrome extension>');
  //   mainWindow.webContents.openDevTools();
  // }
  mainWindow.on('closed', () => mainWindow = null);

  mainWindow.webContents.on('new-window', (event, url, frameName, disposition, options, additionalFeatures) => {
  if (frameName === 'external-content') {
    // open window as modal
    event.preventDefault()
    Object.assign(options, {
      parent: null,
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.resolve(__dirname, 'preload.js')
      }
    })
    event.newGuest = new BrowserWindow(options)
    event.newGuest.loadURL(url, {"extraHeaders" : "pragma: no-cache\n"})
  }
})
}

app.on('ready', () => {
  initDecentralizedApps();
  webRequestHandler();
  createWindow();
});

app.on('window-all-closed', () => {
  web3.kill("SIGINT");
  ipfs.kill("SIGINT");
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
