import { AbiItem } from 'web3-utils';

const defaultAbi: AbiItem[] =
[
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
      "inputs": [],
      "name": "debutContent",
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
      "inputs": [
        {
          "name": "_contentCreator",
          "type": "address"
        },
        {
          "name": "_channelId",
          "type": "uint256"
        },
        {
          "name": "_purityNet",
          "type": "address"
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
          "indexed": true,
          "name": "user",
          "type": "address"
        },
        {
          "indexed": false,
          "name": "requiredContentIndex",
          "type": "uint256"
        }
      ],
      "name": "RevealContentForUser",
      "type": "event"
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
    }
  ];

export default defaultAbi;
