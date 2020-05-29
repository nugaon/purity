import { ContentType } from "../IApp";

const recognizeContentType = function(files: Array<any>): ContentType {
  let contentType: ContentType = ContentType.UNDEFINED;
  for (const file of files) {
    if(file.name === "index.html") {
      contentType = ContentType.WEBPAGE;
      break;
    }
  }
  return contentType;
};

export default recognizeContentType;
