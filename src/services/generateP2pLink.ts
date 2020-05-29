import { FileProtocol, ContentType } from "../IApp";
import { PremiumContentService } from "../services/PremiumContentService";
import { StorageService } from "../services/StorageService";
import store from "store";

export async function generateP2pLink(
  protocol: FileProtocol,
  contentType: ContentType,
  fileAddress: string
): Promise<string> {
  const url = getP2pByProtocol(protocol, fileAddress)

  // exceptions if only the protocol cannot handle the content by itself
  if(ContentType.PREMIUM === +contentType && (
    FileProtocol.IPFS === +protocol ||
    FileProtocol.IPNS === +protocol
  )) {
    const ipfsGateway = StorageService.getIpfsGateway();
    const clientAddress = StorageService.getClientAddress();

    const realFileAddress = await PremiumContentService.revealRealContentAddress(url, clientAddress);
    return ipfsGateway + "/ipfs/" + realFileAddress; //always stored on IPFS
  }
  // end exceptions

  return url;
}

function getP2pByProtocol(protocol: FileProtocol, fileAddress: string): string {
  if(FileProtocol.IPFS == protocol) {
    const ipfsGateway = StorageService.getIpfsGateway();
    return ipfsGateway + "/ipfs/" + fileAddress;
  } else if(FileProtocol.IPNS == protocol) {
    const ipfsGateway = StorageService.getIpfsGateway();
    return ipfsGateway + "/ipns/" + fileAddress;
  }
  return ""
}
