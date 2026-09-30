sap.ui.define([], function () {
  "use strict";

  const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
  const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

  function read(oFile, fnGetText) {
    if (!IMAGE_TYPES.includes(oFile.type)) {
      return Promise.reject(new Error(fnGetText("invalidImageType")));
    }
    if (oFile.size > MAX_IMAGE_SIZE) {
      return Promise.reject(new Error(fnGetText("imageTooLarge")));
    }

    return new Promise((resolve, reject) => {
      const oReader = new FileReader();
      oReader.onload = () => resolve({
        image: String(oReader.result).split(",")[1],
        imageType: oFile.type,
        imageName: oFile.name
      });
      oReader.onerror = () => reject(new Error(fnGetText("imageReadFailed")));
      oReader.readAsDataURL(oFile);
    });
  }

  function formatUrl(sID, sImageType, sModifiedAt) {
    if (!sID || !sImageType) {
      return "";
    }
    return `/orders/GameProducts(ID=${sID})/image?v=${encodeURIComponent(
      sModifiedAt || ""
    )}`;
  }

  return {
    formatUrl: formatUrl,
    read: read
  };
});
