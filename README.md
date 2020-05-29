<div style="text-align: center">
  <h1 id="purityweb-logo">Purity</h1>
</div>

# Description
Purity is a set of decentralised technologies with the determination
to make the Decentralised Internet accessible for everybody. The project
intends to allow its users to share content at a lowest price, which is even
cheaper than publishing a webpage on any other 3rd party hosting service. It also
makes uncensored content sharing possible, because Purity is made with P2P technologies
and doesn't hold any control, neither does nobody else, over the data that these technologies handle.
The blockchain technologie made the functionality of the P2P monetary
compensational, which is also utilised in Purity. You can get coins for sharing content from your Subscribers or
upload completely public content and make your own system for coin compensation, through the injected Purity
libraries in your application. This is the main repository of the many that Purity consists of. It contains
the client side application that the end users can use.

# Used P2P technologies
As mentioned earlier, this application uses many types of P2P technologies.
The "server-side" functionality, i.e. Purity's overall services and its key data, is placed on the blockchain. The language which that part is based on is [Solidity](https://solidity.readthedocs.io/en/latest/).
The choice of the blockchain depends on what kind of P2P light client it has. It means the blockchain client
should run on mobile devices by connecting it to the P2P network and also
be capable of processing Solidity contracts, in regards of the best user experience.
The client which is the closest to these requirements currently is
[Ethereum](https://ethereum.org/).
Any other content which usually takes up a lot more bytespace for the services
are gathered and handled by P2P storage technologies and protocols. So far,
the [IPFS](https://github.com/ipfs/ipfs) is the only technology in the toolset
to establish this crucial part, but there is intention to use other tools too, e.g. [Ethereum Swarm](https://ethersphere.github.io/swarm-home/)
The Purity stands for applying ONLY decentralised solutions for any type of problems
which arise, hereby does not dependent on any other 3rd parties.

# Structure
The application builds the services around two actors:
- __Content Channels__: identities, which are registered via Purity Smart Contracts,
and users (Content Creators) who registered this identity can share their own Content.
- __Subscribers__: users, who supported at least one Content Channel with coins, and
thereby they manifested in the Purity ecosystem. __It can be distinguishable from
a regular user, who can use for free the application. Subscribers can reach Premium
Content of the subscribed Content Channel(s)__.
The Content Channels grouped by Categories, which help to categorise
channels by common topics, thereby make the search for specified topic
in Purity or surfing on it easier. These categories are also handled on Blockchain without
any server-side calling.
The uploaded Content can reach some Purity features, like perform specified blockchain
operations or send coins to a given address. It means you can upload an own JavaScript webpage,
which can automatically use some injected JS libraries under the 'window.purity' object.
__If there is any other need to make other gateways for your dApps let me know in the Issues section__.

# Adventure in the Application
When the user first runs the application, it connects to the blockchain network
and starts synchronising with the blockchain itself - in light mode. It is necessary
because this blockchain ensures that everybody speaks the common
language on this network and thereby everybody has the same data. On the blockchain,  the Purity
itself in the form of Smart Contracts also can be found.
During the synchronisation, which can take several minutes, it is possible to
make our first Ethereum address which is used to make operations on this blockchain
network: this will be an identity which represents a user. It is obligatory to use
a strong password for the account creation because it will hold the spendable coins.
When the synchronisation has been successful, we can close the welcoming modal window
and start to use the real functionalities.
There are three main sections in the menu, which the 'Structure' section also talks about:
- __Categories__: ordered list of Categories, which holds Content Channels, for which it works as a label. The Category that contains the most of the Content Channels
is on the top of the list. Thereby everybody is encouraged to keep the Content Channel
the most feasible and fitting the Category.
- __My Channels__: The user with the made Ethereum address can create Content Channels
with specific description, subscription price, etc. With the help of this section it is
possible to act on the network as a Content Creator and upload any type of content.
- __Subscriptions__: in Purity it is possible to subscribe to Content Channels, after subscription is complete the
subscribed channel appears in this list. It will notify you if your interested Channel
uploads some new Content and you can quickly check that out.
There is a SearchBar at the top wherewith you are able to type any channel name or
category for the faster lookup.

Under the SearchBar there is your current synchronised Coins in Ether if you have any.
If you think this number is not correct, click on the refresh button in the middle.
On Testnet you can receive free coins. To retrieve these you should click on the
hand that holds icon with the coins, next to the refresh button.
To send coins, click on the rightmost icon, the hand which releases coins, and a
popup window will appear, where you can send coins - this is also the same place
where you can perform any blockchain interactions.
The Transaction history icon in the same row can open page in your browser with your
public history on the blockchain network.
The Main section of the application is placed under the all described icons above.
In here you can see the categories, channels with its descriptions and shared
data links.

# Install and Build
You can install the Purity to your Linux or Windows system with pre-built
installers, that you can download from the Releases page.
(Soon it will be available on Mac too, but unfortunately I can't test it)

For development purposes, you should have minimum NodeJS 10 on your computer.
Clone this whole repository then install its dependencies from the repository's root folder.
> npm i  

In order to run the application with Node, you should download the P2P applications
that the Purity uses and place those the 'p2pApps' folder as the following:
```text
|
├── p2pApps/
|   ├── geth/ # contains the geth client (web3) for every OS
|   |   ├── darwin/ # OSX version of geth
|   |   ├── linux/ # Linux version of geth
|   |   ├── win32/ # Windows version of geth
|   ├── ipfs/ # contains the ipfs client for every OS
|   |   ├── darwin/ # OSX version of ipfs
|   |   (...) # same as at geth
├── src/
├── public/
├── package.json
(...)
```

Download the required built files from the list and put the executable files to
the corresponding folders, which described above
- [geth download (tested on 1.9.11)](https://geth.ethereum.org/downloads/)
- [ipfs download (tested on 5.1)](https://docs.ipfs.io/install/)

After you put the P2P executables to their places, you can debug the code with
> npm run electron-dev

Possible to build for specified systems
> npm run electron-pack # for linux

> npm run electron-windows-pack  # for windows

# Contribution and Future Licensing
This project doesn't have any specific license yet, until one contributor doesn't
join the development of this repository. Until then, Viktor Levente Tóth has exclusive
copyright above these materials.

__Feel free to make pull requests!__
