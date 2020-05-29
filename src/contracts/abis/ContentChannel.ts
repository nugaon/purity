import { AbiItem } from 'web3-utils';

const defaultAbi: AbiItem[] =
[
    {
      "constant": true,
      "inputs": [],
      "name": "channelName",
      "outputs": [
        {
          "name": "",
          "type": "bytes32"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "contentLabels",
      "outputs": [
        {
          "name": "",
          "type": "bytes32"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "subscribers",
      "outputs": [
        {
          "name": "",
          "type": "address"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "description",
      "outputs": [
        {
          "name": "",
          "type": "string"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "subscriberContents",
      "outputs": [
        {
          "name": "protocol",
          "type": "uint8"
        },
        {
          "name": "contentType",
          "type": "uint8"
        },
        {
          "name": "fileAddress",
          "type": "string"
        },
        {
          "name": "summary",
          "type": "string"
        },
        {
          "name": "uploadTime",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "price",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "contentCreator",
      "outputs": [
        {
          "name": "",
          "type": "address"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "",
          "type": "address"
        }
      ],
      "name": "premiumDeadlines",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "permitExternalSubs",
      "outputs": [
        {
          "name": "",
          "type": "bool"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "channelId",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "period",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "name": "_channelName",
          "type": "bytes32"
        },
        {
          "name": "_subPrice",
          "type": "uint256"
        },
        {
          "name": "_subTime",
          "type": "uint256"
        },
        {
          "name": "_permitExternalSubs",
          "type": "bool"
        },
        {
          "name": "_description",
          "type": "string"
        },
        {
          "name": "_owner",
          "type": "address"
        },
        {
          "name": "_channelId",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "name": "contentLabel",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "name": "subscriberContentIndex",
          "type": "uint256"
        },
        {
          "indexed": false,
          "name": "comment",
          "type": "string"
        }
      ],
      "name": "NewContentUploaded",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "name": "_subscriber",
          "type": "address"
        }
      ],
      "name": "SubscriptionHappened",
      "type": "event"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_description",
          "type": "string"
        }
      ],
      "name": "setDescription",
      "outputs": [
        {
          "name": "",
          "type": "bool"
        }
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "getChannelData",
      "outputs": [
        {
          "name": "contentCreator_",
          "type": "address"
        },
        {
          "name": "channelName_",
          "type": "bytes32"
        },
        {
          "name": "description_",
          "type": "string"
        },
        {
          "name": "channelId_",
          "type": "uint256"
        },
        {
          "name": "balance_",
          "type": "uint256"
        },
        {
          "name": "price_",
          "type": "uint256"
        },
        {
          "name": "subscriptionCount_",
          "type": "uint256"
        },
        {
          "name": "userSubTime_",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_protocol",
          "type": "uint8"
        },
        {
          "name": "_fileAddress",
          "type": "string"
        },
        {
          "name": "_contentType",
          "type": "uint8"
        },
        {
          "name": "_contentSummary",
          "type": "string"
        },
        {
          "name": "_contentLabel",
          "type": "bytes32"
        }
      ],
      "name": "uploadSubscriberContent",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "label",
          "type": "bytes32"
        }
      ],
      "name": "getLabelledContentIndexes",
      "outputs": [
        {
          "name": "",
          "type": "uint256[]"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "getSubscriberContentsLength",
      "outputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "getContentLabels",
      "outputs": [
        {
          "name": "",
          "type": "bytes32[]"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [],
      "name": "subscribe",
      "outputs": [
        {
          "name": "",
          "type": "bool"
        }
      ],
      "payable": true,
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_pubKeyPrefix",
          "type": "bool"
        },
        {
          "name": "_pubKey",
          "type": "bytes32"
        }
      ],
      "name": "subscribe",
      "outputs": [
        {
          "name": "",
          "type": "bool"
        }
      ],
      "payable": true,
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_user",
          "type": "address"
        }
      ],
      "name": "invite",
      "outputs": [
        {
          "name": "",
          "type": "bool"
        }
      ],
      "payable": true,
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "setSubscriptionPrice",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_permitExternalSubs",
          "type": "bool"
        }
      ],
      "name": "setPermitExternalSubs",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [],
      "name": "withdrawBalance",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "subscriberAddress",
          "type": "address"
        }
      ],
      "name": "checkSubInvalid",
      "outputs": [
        {
          "name": "",
          "type": "bool"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "getRemovableSubscribers",
      "outputs": [
        {
          "name": "",
          "type": "bool[]"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "getSubscriptionCount",
      "outputs": [
        {
          "name": "length",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "getSubscribersWithKeys",
      "outputs": [
        {
          "name": "subscribers_",
          "type": "address[]"
        },
        {
          "name": "pubKeyPrefixes_",
          "type": "bool[]"
        },
        {
          "name": "pubKeys_",
          "type": "bytes32[]"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "subscriberIndexes",
          "type": "uint256[]"
        }
      ],
      "name": "removeSubscribers",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];

export default defaultAbi;
