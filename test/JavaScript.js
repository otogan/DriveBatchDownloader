var sequentialSttngs = {from: 0, to: 100, wildcard: 0};
var rootFldrId = 'root';
var rootFldrNm = 'Drive root';
var folders = [{id: rootFldrId, name: rootFldrNm}];
var importedFolders = [];
var selectedFolder = 0;
var downloadList = [];
var downloading = false;
var downloadStatus = {
    ready: 'Ready',
    downloading: 'Downloading',
    success: 'Successful',
    fail: 'Failed'
}


$(function () {
    // input file url
    $('#input-file-url')
        .on("change paste keyup", inputUrlChanged)
        .focus();
    $('#input-url-help-text').click(function() {
        $('#input-file-url').focus();
    })

    // sequential settings
    $('#btn-show-sequential-settings').click(btnSequentialSettingsClicked);
    $('#sequential-info-btn')
        .hover(
            function () {
                $(this).find('i')
                    .removeClass('far')
                    .addClass('fas');
            },
            function () {
                $(this).find('i')
                    .removeClass('fas')
                    .addClass('far');
            });

    $('#number-from').on("change paste keyup", numberFromChanged);
    $('#number-to').on("change paste keyup", numberToChanged);
    $('#number-wildcard').on("change paste keyup", numberWildcardChanged);

    // folder list
    addFolderToList(rootFldrNm, 0).addClass('active');
    
    // buttons
    $('#btn-add').click(btnAddClicked); 
    $('#btn-start-stop').click(startStopBtnClicked);

    // test case
    $('#input-file-url')
        .val('http://www.example.com/image*.jpeg')
        .change();
    $('#number-to')
        .val(30)
        .change();
    $('#btn-add').click();
});

// input URL
function inputUrlChanged() {
    var value = $(this).val();
    if (value.match(/\*/)) {
        $('#sequential-settings-box').collapse('show');
        $('#sequential-state').text('Hide');
    } else {
        $('#sequential-settings-box').collapse('hide');
        $('#sequential-state').text('Show');
    }
    updateGeneratedLinks();
}

// sequential settings
function btnSequentialSettingsClicked() {
    var btn = $(this);
    var expanded = btn.attr('aria-expanded'); //="true"
    var targetDiv = $(btn.attr('data-target'));
    var collapsing = targetDiv.hasClass('collapsing');
    if (!collapsing) {
        if (expanded == 'true') {
            btn.find('span').text('Show');
        } else {
            btn.find('span').text('Hide');
        }
    }
}

// sequential settings - numbers cofiguration
function numberFromChanged() {
    var from = +this.value;
    var inputTo = $('#number-to');
    inputTo.attr('min', from);
    var to = +inputTo.val();
    if (from > to) {
        to = from;
        inputTo.val(to);
    }
    sequentialSttngs.from = from;
    sequentialSttngs.to = to;
    updateGeneratedLinks();
}
function numberToChanged() {
    var to = +this.value;
    var inputFrom = $('#number-from');
    inputFrom.attr('max', to);
    var from = +inputFrom.val();
    if (from > to) {
        from = to;
        inputFrom.val(from);
    }
    sequentialSttngs.from = from;
    sequentialSttngs.to = to;
    updateGeneratedLinks();
}
function numberWildcardChanged() {
    var wildcard = +this.value;
    sequentialSttngs.wildcard = wildcard;
    updateGeneratedLinks();
}

// sequential settings - generated links
function updateGeneratedLinks() {
    var fileUrl = $('#input-file-url').val();
    var numFrom = '' + sequentialSttngs.from;
    var numSec = '' + (sequentialSttngs.from + 1);
    var numTo = '' + sequentialSttngs.to;
    numTo = +numTo > +numFrom ? numTo : numSec;
    var numWildcard = sequentialSttngs.wildcard;
    while (numFrom.length < numWildcard) numFrom = "0" + numFrom;
    while (numSec.length < numWildcard) numSec = "0" + numSec;
    while (numTo.length < numWildcard) numTo = "0" + numTo;

    $('#link-1').text(fileUrl.replace(/\*/g, numFrom));
    $('#link-2').text(fileUrl.replace(/\*/g, numSec));
    $('#link-n').text(fileUrl.replace(/\*/g, numTo));
}

// show status
function showStatus(msg, error) {
    var msgDiv = $('#status-message');
    var timeout = 10000;
    msgDiv.html('');
    msgDiv.append(msg);
    msgDiv.removeClass('invisible');
    if (error) {
        msgDiv.addClass('text-danger');
        timeout = 15000;
    } else {
        msgDiv.removeClass('text-danger');
    }
    window.setTimeout(hideStatus, timeout);
}
function hideStatus() {
    $('#status-message').addClass('invisible');
}

// folder list
function addFolderToList(name, id, list) {
    var list = list ? list : $('#list-folder-names');

    var listItem = $('<li class="btn list-group-item list-group-item-action p-0"></li>');
    listItem
        .attr('id', 'li-' + id)
        .attr('value', id)
        .click(folderClicked);

    var btnItem = $('<button type="button"><i class="far fa-plus-square"></i></button>');
    btnItem
        .addClass('btn btn-default btn-sm p-1')
        .attr('id', 'btn-' + id)
        .val(id)
        .click(expandBtnClicked)
        .hover(
            function () {
                $(this).find('i')
                    .removeClass('far')
                    .addClass('fas');
            },
            function () {
                $(this).find('i')
                    .removeClass('fas')
                    .addClass('far');
            });

    listItem.append(btnItem, name + '&nbsp;');

    list.append(listItem);

    return listItem;
}

function folderClicked() {
    var thisLi = $(this);
    $('#list-folder-names').find('li').removeClass('active');
    thisLi.addClass('active');
    selectedFolder = thisLi.attr('value');
    console.info('folder selected');
}

function expandBtnClicked() {
    var btn = $(this); // li>span .expand
    var id = +btn.attr('value');
    if (importedFolders.indexOf(id) > -1) {
        var expanded = btn.attr('aria-expanded'); //="true"
        var targetUList = $(btn.attr('data-target'));
        var collapsing = targetUList.hasClass('collapsing');
        if (!collapsing) {
            if (expanded == 'true') {
                btn.find('i')
                    .removeClass('fa-minus-square')
                    .addClass('fa-plus-square');
            } else {
                btn.find('i')
                    .removeClass('fa-plus-square')
                    .addClass('fa-minus-square');
            }
        }
        return;
    } else {
        addSpinner(btn.parent());
        importedFolders.push(id);
    }

    var folderId = folders[id].id;

    google.script.run
        .withSuccessHandler(function (data, element) { // data{ id, folders }, element: btn
            console.info('folder names loaded');
            removeSpinner(element.parent()); // li
            updateFolderNames(data, element);
        })
        .withFailureHandler(function (msg, element) { // msg: string, element: btn
            console.error('Folder list failed to load', msg);
            element.addClass('invisible');
            var liItem = element.parent();
            removeSpinner(liItem);
            liItem.addClass('bg-warning');
            showStatus('Folder list failed to load. ' + msg, true);
        })
        .withUserObject(btn)
        .getFolders(folderId);
}

// folder list - spinners
function addSpinner(element) {
    element.append('<span id="spinner" class="spinner-border spinner-border-sm"></span>');
}
function removeSpinner(element) {
    element.find('#spinner').remove();
}

function updateFolderNames(data, btn) {
    var newFolders = data.folders;
    var folderId = data.id;
    var id = folders.findIndex(function (element) {
        return this == element.id;
    }, folderId);
    var listItem = btn.parent(); // li

    var newFolderArr = [];

    for (var item in newFolders) {
        newFolderArr.push({
            id: item,
            name: newFolders[item]
        });
    }

    if (newFolderArr.length == 0) {
        btn.addClass('invisible');
        return;
    }

    newFolderArr.sort(function (a, b) {
        var nameA = a.name.toUpperCase(); // ignore upper and lowercase
        var nameB = b.name.toUpperCase(); // ignore upper and lowercase
        if (nameA < nameB) {
            return -1;
        }
        if (nameA > nameB) {
            return 1;
        }

        // names must be equal
        return 0;
    });

    var newList = $('<ul></ul>')
        .attr('id', 'ul-' + id)
        .addClass('list-group pl-3 collapse');

    btn // collaplse controller
        .attr('data-toggle', 'collapse')
        .attr('data-target', '#ul-' + id)
        .attr('aria-expanded', 'false')
        .attr('aria-controls', 'ul-' + id);

    for (var i in newFolderArr) {
        var newId = folders.length;
        folders.push(newFolderArr[i]);
        addFolderToList(newFolderArr[i].name, newId, newList);
    }

    listItem.after(newList);
    newList.collapse('show');
}

// action buttons
function btnAddClicked() {
    var fileUrl = $('#input-file-url').val();
    if (fileUrl == '') {
        fileInput.focus();
        return;
    }

    var targetFolder = folders[selectedFolder];

    var asterisk = fileUrl.search(/\*/) > -1;
    var from = sequentialSttngs.from;
    var to = sequentialSttngs.to;
    var wildcard = sequentialSttngs.wildcard;

    do {
        var newUrl = fileUrl;
        if (asterisk) {
            var n = '' + from;
            while (n.length < wildcard) n = '0' + n;
            newUrl = newUrl.replace(/\*/g, n);
            from++;
        }

        // add data to the downloadList
        var id = downloadList.length;
        downloadList.push({
            status: 'ready',
            url: newUrl,
            fileName: newUrl,
            folderId: targetFolder.id,
            folderName: targetFolder.name
        });

        addItemToDownloadList(id);

    } while (asterisk && from <= to);

    // add downloading check
}

function addItemToDownloadList(id) {
    var downloadData = downloadList[id];
    var cStatIcon = $('<i></i>')
        .addClass(getStatClass(downloadData.status))
        .attr('value', downloadStatus[downloadData.status]);
    var cStat = $('<th></th>')
        .attr('scope', 'row')
        .addClass('col1 text-center')
        .append(cStatIcon);
    var cFile = $('<td></td>')
        .addClass('col2 cFile')
        .append(downloadData.fileName);
    var cFolder = $('<td></td>')
        .addClass('col3 cFolder')
        .append(downloadData.folderName);
    var cActionEraseBtnIcon = $('<i></i>')
        .addClass('far fa-trash-alt');
    var cActionEraseBtn = $('<button></button>')
        .attr('type', 'button')
        .addClass('btn btn-default btn-sm cActionEraseBtn')
        .append(cActionEraseBtnIcon)
        .click(cActionEraseBtnClicked)
        .hover(
            function () {
                $(this).addClass('text-danger')
                    .find('i')
                    .removeClass('far')
                    .addClass('fas');
            },
            function () {
                $(this).removeClass('text-danger')
                    .find('i')
                    .removeClass('fas')
                    .addClass('far');
            });
    var cAction = $('<td></td>')
        .addClass('col4 text-center cAction')
        .append(cActionEraseBtn);
    var newRow = $('<tr></tr>')
        .attr('id', 'tr-' + id)
        .append(cStat, cFile, cFolder, cAction);
    $('#table-download-list > tbody')
        .append(newRow);
}

function getStatClass(stat) {
    var stats = {
        ready: 'far fa-clock',
        downloading: 'spinner-grow spinner-grow-sm',
        success: 'fas fa-cloud',
        fail: 'fas fa-exclamation-circle'
    }
    return stat in stats ? stats[stat] : 'fas fa-times';
}

function cActionEraseBtnClicked() {

}

// start button
function startStopBtnClicked() {
    var btn = $(this);
    var text = btn.find('span');
    var btnIcon = btn.find('i');
    console.log(downloading)
    if (downloading) {
        text.text('Start ')
        btnIcon
            .removeClass('fa-stop')
            .addClass('fa-play');
        btn
            .removeClass('btn-danger')
            .addClass('btn-success');
    } else {
        text.text('Stop ')
        btnIcon
            .removeClass('fa-play')
            .addClass('fa-stop');
        btn
            .removeClass('btn-success')
            .addClass('btn-danger');
    }
    downloading = !downloading;
}

// deprecated
function btnSaveClicked() {
    var fileUrl = $('#input-file-url').val();
    if (fileUrl == '') {
        fileInput.focus();
        return;
    }

    var sequence = {
        checked: $('#check-sequential').prop('checked'),
        from: $('#number-from').val(),
        to: $('#number-to').val(),
        wildcard: $('#number-wildcard').val()
    }

    this.disabled = true;

    var selected = $("input[type='radio'][name='folder']:checked");
    var id = selected.val();

    google.script.run
        .withSuccessHandler(function (data, element) {
            element.disabled = false;
            var error = false;
            var msg = $('<div>Target folder: ' + data.folderName + '<br></div>');
            for (var i in data.fileNames) {
                var spn = $('<span></span>');
                if (data.fileNames[i][0]) {
                    msg.append('[saved]&nbsp;');
                } else {
                    msg.append('[failed]&nbsp;');
                    spn.addClass('error');
                }
                spn.text(data.fileNames[i][1]);
                msg.append(spn, '<br>');
            }
            showStatus(msg, false);
            $('#input-file-url').focus();
        })
        .withFailureHandler(function (msg, element) {
            element.disabled = false;
            console.error('File failed to save', msg);
            showStatus('File failed to save, ' + msg, true);
        })
        .withUserObject(this)
        .saveFile(fileUrl, id, sequence);
}
