import { AbiItem } from 'web3-utils';

const defaultAbi: AbiItem[] =
[
    {
      "constant": true,
      "inputs": [],
      "name": "categoryCount",
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
      "name": "minSubscriptionFee",
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
      "name": "withdrawFeePercent",
      "outputs": [
        {
          "name": "",
          "type": "uint8"
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
          "type": "bytes32"
        }
      ],
      "name": "channelNameToId",
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
      "inputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "categoryIdToStruct",
      "outputs": [
        {
          "name": "name",
          "type": "bytes32"
        },
        {
          "name": "channelCreationCount",
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
      "name": "channelCount",
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
      "inputs": [
        {
          "name": "",
          "type": "address"
        }
      ],
      "name": "userKeys",
      "outputs": [
        {
          "name": "pubKeyPrefix",
          "type": "bool"
        },
        {
          "name": "pubKey",
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
          "type": "bytes32"
        }
      ],
      "name": "categoryNameToId",
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
          "name": "_withdrawFeePercent",
          "type": "uint8"
        },
        {
          "name": "_minSubscriptionFee",
          "type": "uint256"
        }
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "payable": true,
      "stateMutability": "payable",
      "type": "fallback"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "name": "channelName",
          "type": "bytes32"
        },
        {
          "indexed": true,
          "name": "category",
          "type": "bytes32"
        }
      ],
      "name": "NewChannelCreated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "name": "user",
          "type": "address"
        }
      ],
      "name": "NewPremiumUser",
      "type": "event"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "_fromNodeId",
          "type": "uint256"
        },
        {
          "name": "_size",
          "type": "uint256"
        }
      ],
      "name": "getCategories",
      "outputs": [
        {
          "name": "categoryNames_",
          "type": "bytes32[]"
        },
        {
          "name": "categoryChannelCounts_",
          "type": "uint256[]"
        },
        {
          "name": "categoryIds_",
          "type": "uint256[]"
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
          "name": "_categoryName",
          "type": "bytes32"
        },
        {
          "name": "_fromContentChannelId",
          "type": "uint256"
        },
        {
          "name": "_size",
          "type": "uint256"
        }
      ],
      "name": "getChannelsFromCategories",
      "outputs": [
        {
          "name": "contentChannelAddresses_",
          "type": "address[]"
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
          "name": "_withdrawFeePercent",
          "type": "uint8"
        }
      ],
      "name": "setWithdrawFeePercent",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_minSubscriptionFee",
          "type": "uint8"
        }
      ],
      "name": "setSubscriptionFee",
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
      "constant": false,
      "inputs": [
        {
          "name": "_channelName",
          "type": "bytes32"
        },
        {
          "name": "_category",
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
        }
      ],
      "name": "createContentChannel",
      "outputs": [
        {
          "name": "contentChannel",
          "type": "address"
        }
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "_id",
          "type": "uint256"
        }
      ],
      "name": "getChannelDataFromId",
      "outputs": [
        {
          "name": "",
          "type": "uint256[]"
        },
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
          "name": "_id",
          "type": "uint256"
        }
      ],
      "name": "getChannelAddressFromId",
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
          "name": "_channelName",
          "type": "bytes32"
        }
      ],
      "name": "getChannelAddressFromName",
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
          "name": "_channelId",
          "type": "uint256"
        }
      ],
      "name": "getChannelCategoryIdsFromId",
      "outputs": [
        {
          "name": "categoryIds_",
          "type": "uint256[]"
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
          "name": "_channelId",
          "type": "uint256"
        }
      ],
      "name": "reorderCategoryChannelPosition",
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
      "constant": false,
      "inputs": [
        {
          "name": "_categoryName",
          "type": "bytes32"
        },
        {
          "name": "_channelName",
          "type": "bytes32"
        }
      ],
      "name": "removeFromCategory",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "_categoryName",
          "type": "bytes32"
        },
        {
          "name": "_channelName",
          "type": "bytes32"
        }
      ],
      "name": "addChannelToCategory",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "_categoryName",
          "type": "bytes32"
        }
      ],
      "name": "getCategoryLength",
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
      "inputs": [
        {
          "name": "_users",
          "type": "address[]"
        }
      ],
      "name": "getUsersKeys",
      "outputs": [
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
          "name": "_pubKeyPrefix",
          "type": "bool"
        },
        {
          "name": "_pubKey",
          "type": "bytes32"
        }
      ],
      "name": "register",
      "outputs": [
        {
          "name": "",
          "type": "bool"
        }
      ],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];

export default defaultAbi;
