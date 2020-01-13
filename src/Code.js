/**
 * Serves HTML of the application for HTTP GET requests.
 * If folderId is provided as a URL parameter, the web app will list
 * the contents of that folder (if permissions allow). Otherwise
 * the web app will list the contents of the root folder.
 *
 * @param {Object} e event parameter that can contain information
 *     about any URL parameters provided.
 */
function doGet(e) {
    var template = HtmlService.createTemplateFromFile('Index');
    
    // Build and return HTML in IFRAME sandbox mode.
    return template.evaluate()
      .setTitle('File Downloader')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Gets the subfolders of the parent folder with the given ID
 * Takes the DrvieApp root folder when the given id is 'root'
 */
function getFolders(parentId) {
  var parent = parentId == 'root' ? DriveApp.getRootFolder() : DriveApp.getFolderById(parentId);
  var data = {
    id: parentId,
    folders: {}
  };
  var iterator = parent.getFolders();
  while (iterator.hasNext()) {
    var folder = iterator.next();
    data.folders[folder.getId()] = folder.getName();
  }
  return data;
}

/**
 * Saves the file with the given URL into the target folder with the given ID
 */
function saveFile(url, folderId, sequence) {
  var folder = folderId == 'root' ? DriveApp.getRootFolder() : DriveApp.getFolderById(folderId);
  var checked = sequence.checked;
  var from = +sequence.from;
  var to = +sequence.to;
  var wildcard = +sequence.wildcard;
  
  var fileNames = [];
  
  if(checked) checked = url.search(/\*/) > -1;
  
  do {
    var newUrl = url;
    if (checked) {
      var i = from + '';
      while (i.length < wildcard) i = '0' + i;
      newUrl = newUrl.replace(/\*/g, i);
      from++;
    }
    
    try {
      var blob = UrlFetchApp.fetch(newUrl).getBlob();
      folder.createFile(blob);
      fileNames.push([true, blob.getName()]);
    }
    catch(error) {
      fileNames.push([false, error.toString()]);
    }
    
  } while (checked && from <= to);
  
  return {
    folderName: folder.getName(),
    fileNames: fileNames
  };
}