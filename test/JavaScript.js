var rootFldrId = 'root';
var importedFolders = [];
var selectedFolder = rootFldrId;

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

    $('#number-from').change(numberFromChanged);
    $('#number-to').change(numberToChanged);
    $('#number-wildcard').change(updateGeneratedLinks);

    // folder list
    addFolderToList('Drive root', rootFldrId).addClass('active');
    
    // buttons

});

// input URL
function inputUrlChanged() {
    var value = $(this).val();
    if (value.match(/\*/)) {
        $('#sequential-settings-box').collapse('show');
        $('#sequential-state').text('Hide');
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

// sequential settings numbers cofiguration
function numberFromChanged() {
    var from = +this.value;
    $('#number-to').attr('min', ++from);
    updateGeneratedLinks();
}
function numberToChanged() {
    var to = +this.value;
    $('#number-from').attr('max', --to);
    updateGeneratedLinks();
}

// sequential settings generated links
function updateGeneratedLinks() {
    var fileUrl = $('#input-file-url').val();
    var numFrom = $('#number-from').val();
    var numSec = '' + (+numFrom + 1);
    var numTo = $('#number-to').val();
    numTo = +numTo > +numFrom ? numTo : numSec;
    var numWildcard = $('#number-wildcard').val();
    while (numFrom.length < +numWildcard) numFrom = "0" + numFrom;
    while (numSec.length < +numWildcard) numSec = "0" + numSec;
    while (numTo.length < +numWildcard) numTo = "0" + numTo;

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
    var id = btn.attr('value');
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
        .getFolders(id);
}

function addSpinner(element) {
    element.append('<span id="spinner" class="spinner-border spinner-border-sm"></span>');
}

function removeSpinner(element) {
    element.find('#spinner').remove();
}

function updateFolderNames(data, btn) {
    var folders = data.folders;
    var id = data.id;
    var listItem = btn.parent(); // li
    var parentList = listItem.parent();

    var folderNames = [];
    for (var item in folders) {
        folderNames.push(item);
    }
    if (folderNames.length == 0) {
        btn.addClass('invisible');
        return;
    }
    folderNames.sort(); //folder names

    var newList = $('<ul></ul>')
        .attr('id', 'ul-' + id)
        .addClass('list-group pl-3 collapse');

    btn
        .attr('data-toggle', 'collapse')
        .attr('data-target', '#ul-' + id)
        .attr('aria-expanded', 'false')
        .attr('aria-controls', 'ul-' + id);

    for (var i in folderNames) {
        var name = folderNames[i];
        addFolderToList(name, folders[name], newList);
    }

    listItem.after(newList);
    newList.collapse('show');
}

// save button
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
