//global vars
let USER_LANG = 'de'; //(navigator.language || navigator.language).substring(0, 2);
const endPointBase = 'https://resource.geolba.ac.at/PoolParty/sparql/';

const options = { //fuse options
    shouldSort: true,
    tokenize: true,
    keys: ['label']
};

let thesCode = {
    GeologicUnit: 'g',
    lithology: 'l',
    GeologicTimeScale: 'a',
    tectonicunit: 't'
};

let allConcepts, prefLabelsMap;

let errObj = {
    errCodes: [], //codes not in arr
    order: '', //wrong order of codes
    ra: '', //missing representative age
    rl: '', //missing representative lith
    typ: '' //missing GU type
}

//onLoad website
document.addEventListener("DOMContentLoaded", function (event) {
    $('#searchGroup').hide();
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    if (urlParams.has('lang')) {
        USER_LANG = urlParams.get('lang');
    }

    $("#addRowBtn").click(function () {
        let l = addNewRow();
        let el = document.getElementById('keyValue' + l);
        let range = document.createRange();
        let sel = window.getSelection();
        range.setStart(el, 0);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        el.focus();
    });

    $("#exportBtn").click(function () {
        let csvText = '';
        $("tr").each(function (index) {
            let line = [];
            $(this).children().each(function (index) {
                line.push($(this).text().replace(' ⇅', '').replace(/\n/g, '').replace(/  /g, ''));
            });
            csvText += line.join('\t') + '\n';
        });
        exportCSV(csvText);
    });

    getAllConcepts(endPointBase, Object.keys(thesCode), USER_LANG);


});
//get all concepts of Thesaurus
async function getAllConcepts(endPointBase, thesList, lang) {
    let query = '?query=' +
        encodeURIComponent(`PREFIX skos:<http://www.w3.org/2004/02/skos/core#>
                        PREFIX gba:<http://resource.geolba.ac.at/PoolParty/schema/GBA/>
                        PREFIX xsd:<http://www.w3.org/2001/XMLSchema#>
                        PREFIX dpo:<http://dbpedia.org/ontology/>
                        select distinct ?s ?L (coalesce(?c, "") as ?color) (strafter(str(?x),"#") as ?typ)
                        where {
                        values ?x {skos:prefLabel skos:altLabel}
                        {?s ?p ?o; ?x ?L filter(lang(?L)="de") filter(!regex(str(?L), '^\\\\[.*'))}
                        MINUS {?s gba:GBA_Status "3"^^xsd:integer}
                        optional {?s dpo:colourHexCode ?c}
                        }`) + '&format=application/json';

    let res = await Promise.all(thesList.map(a =>
        fetch(endPointBase + a + query)
        .then(response => response.json())
    ));

    allConcepts = res
        .map(a => a.results.bindings)
        .flat(1)
        .map(b => Object({
            code: createCodeFromUri(b.s.value),
            label: b.L.value,
            color: b.color.value,
            typ: b.typ.value
        }));

    prefLabelsMap = new Map(allConcepts
        .filter(obj => (obj.typ === 'prefLabel'))
        .map(a => [a.code, {
            label: a.label,
            color: a.color
        }]));

    prefLabelsMap.set('TN', {
            label: 'Typical Norm',
            color: ''
        })
        .set('DN', {
            label: 'Description Norm',
            color: ''
        })
        .set('IN', {
            label: 'Instance',
            color: ''
        });
        $('.loading').hide();
    //console.log(allConcepts, prefLabelsMap);
}
//createCodeFromUri
function createCodeFromUri(uri) {
    let a = uri.split('/');
    return thesCode[a[3]] + a[4];
}

function addNewRow() { //insert HTML to add table row
    lNr = $('tr').length - 1;
    $("#myTable").append(`<tr id="${lNr}">
                            <td id="idValue${lNr}" class="textarea" role="textbox" contenteditable></td>
                            <td id="keyValue${lNr}" class="textarea" role="textbox" 
                                onkeyup="editKey(${lNr}, this, 'keyup');"
                                onmouseup="editKey(${lNr}, this, 'mouseup');"
                                contenteditable></td>
                            <td id="colorValue${lNr}"></td>
                            <td id="textValue${lNr}"></td>
                            <td id="rLithValue${lNr}"></td>
                            <td id="rAgeValue${lNr}"></td>
                            <td id="descPurposeValue${lNr}"></td>
                            <td id="statusValue${lNr}"></td>
                            <td id="notesValue${lNr}" class="textarea" role="textbox" contenteditable></td>
                        </tr>`);
    lNr++
    return (lNr - 1);
}

function editKey(lNr, node, action) {
    $('#searchGroup').hide();
    let pos = getCaretPosition(node);
    let keyTxt = node.textContent;
    let char = keyTxt.charAt(pos - 1);

    if (Object.values(thesCode).includes(char)) {
        $('#searchInput').attr('placeholder', 'alle Begriffe');
        $('#searchGroup').show();
        textSearch2code(char, lNr, pos);
    }

    if (action == 'keyup') {
        update(lNr, keyTxt);
    }

}
//
function selCode(code, lNr, pos) {
    //console.log(code, lNr, pos);
    let keyTxt = $('#keyValue' + lNr).text();

    if (keyTxt.charAt(pos + 1) !== '-') {
        code = code + '-';
    }

    keyTxt = (keyTxt.substr(0, pos) + code + keyTxt.substr(pos, 100)).replace('--', '-');
    $('#keyValue' + lNr).text(keyTxt);
    update(lNr, keyTxt);
    $('#searchGroup').hide();
    //updateRow(lNr, document.getElementById('keyValue' + lNr).innerHTML);
}

function update(lNr, keyTxt) {

    errObj.errCodes = [];

    evalKey(keyTxt);
    $('#textValue' + lNr).html(createLegText(keyTxt));
    $('#rLithValue' + lNr).html(getRVal('rl', keyTxt));
    $('#rAgeValue' + lNr).html(getRVal('ra', keyTxt));

    $('#descPurposeValue' + lNr).html(getDescPurpose(keyTxt));

    $('#statusValue' + lNr).html(createStatusSymbol());

    $('#colorValue' + lNr).html(getColorIcon(getLegColor(keyTxt), 3));
    toolTips();
    //console.log(errObj);
}

function getDescPurpose(keyTxt) {
    let dp = ['TN', 'DN', 'IN'];
    let d = keyTxt.split('-').at(-1);

    if (dp.includes(d)) {
        return getLabel(d);
    } else {
        return '';
    }
}

function getRVal(a, keyTxt) { //e.g. "rl"
    let res = '';
    let color = '';
    if (keyTxt.includes(a)) {
        let b = keyTxt.split(a)[1].split('-')[0];
        try {
            if (!(isNaN(b) || b == '')) {
                let c = prefLabelsMap.get(a.substring(1) + b);
                res = c.label;
                color = c.color;
            }
        } catch (error) {
            errObj.errCodes.push(a);
        }
    }
    return getColorIcon(color, '1') + ' ' + res;
}

function getColorIcon(color, fa) {
    let magicText = '';
    if (fa !== '1') {
        magicText = hexToRGB(color);
    }


    if (color == undefined || color == '') {
        color = `<i class="far fa-square fa-${fa}x" style="color:grey;"></i>`;
    } else {
        color = `<i title="${hexToRGB(color)}" 
                    data-bs-toggle="tooltip" 
                    data-bs-html="true" 
                    data-bs-placement="bottom" 
                    class="fas fa-square fa-${fa}x" 
                    style="color:${color};">
                </i>
                <span class="magic-text">${magicText}</span>`;
    }
    return color;
}

function hexToRGB(h) {
    let r = 0,
        g = 0,
        b = 0;

    // 3 digits
    if (h.length == 4) {
        r = "0x" + h[1] + h[1];
        g = "0x" + h[2] + h[2];
        b = "0x" + h[3] + h[3];

        // 6 digits
    } else if (h.length == 7) {
        r = "0x" + h[1] + h[2];
        g = "0x" + h[3] + h[4];
        b = "0x" + h[5] + h[6];
    }

    return "rgb(" + +r + "," + +g + "," + +b + ")";
}

const letters = ['g', 't', 'rl', 'l', 'ra', 'a', 'e', 'p', 'TN', 'DN', 'IN'];

function getLegColor(keyTxt) {
    let k = keyTxt.split('-');
    let colorCodes = ['g', 't', 'rl', 'ra'];

    let colArr = k.filter(a => a.includes('g') || a.includes('t') || a.includes('rl') || a.includes('ra'))
        .map(a => getColor(a))
        .filter(a => a !== '');

    if (colArr.length > 0) {
        return colArr[0];
    } else {
        return '';
    }

}

//create legend texts from GUkey
function createLegText(keyTxt) {
    let k = keyTxt.split('-');
    let kArr = keyTxt.replace(/r/g, '').split('-').filter(a => a !== '');
    let legText = '';
    let geolText = kArr.filter(a => a.indexOf('g') > -1).map(a => getLabel(a));
    let lithText = kArr.filter(a => a.indexOf('l') > -1).map(a => getLabel(a));
    let ageText = kArr.filter(a => a.indexOf('a') > -1).map(a => getLabel(a));
    let tektText = kArr.filter(a => a.indexOf('t') > -1).map(a => getLabel(a));

    if (geolText.length > 0) {
        legText += '<strong>' + geolText.join(', ') + '</strong> ';
    }
    if (geolText.length > 0 && lithText.length > 0) {
        legText += '(';
    }
    if (lithText.length > 0) {
        legText += lithText.join(', ') + '; ';
    }

    if (ageText.length > 0) {
        if (ageText.length > 2) {
            legText += ageText[1] + ' - ' + ageText[2];
        } else {
            legText += ageText.join(' - ');
        }
    }

    if (geolText.length > 0 && lithText.length > 0) {
        legText += ')';
    }
    if (tektText.length > 0) {
        legText += '; ' + tektText.join(', ');
    }

    for (let code of kArr) { //check codes
        if (getLabel(code) == 'x') {
            errObj.errCodes.push(code);
        }
    }
    return legText;
}

function getLabel(code) {
    let a = 'x';
    if (prefLabelsMap.has(code)) {
        a = prefLabelsMap.get(code).label;
    }
    return a;
}

function getColor(code) {
    let a = '';
    if (prefLabelsMap.has(code.replace('r', ''))) {
        a = prefLabelsMap.get(code.replace('r', '')).color;
    }
    return a;
}

//evaluate GUkey syntax
function evalKey(keyTxt) {
    let testArr = [];
    let kArr = keyTxt.replace(/r/g, '').split('-').filter(a => a !== '');
    for (let i of kArr.map(a => a.replace(/[0-9]/g, ''))) {
        testArr.push(letters.findIndex(a => a == i));
    }
    testArr = testArr.filter(a => a >= 0);
    if (String(testArr + '') == String(testArr.sort((a, b) => a - b) + '')) {
        errObj.order = '';
    } else {
        errObj.order = 'Reihenfolge ' + letters.join(' ');
    }

    if (keyTxt.indexOf('rl') > -1) {
        errObj.rl = '';
    } else {
        errObj.rl = 'repräsentative Lithologie fehlt';
    }
    if (keyTxt.indexOf('ra') > -1) {
        errObj.ra = '';
    } else {
        errObj.ra = 'repräsentatives Alter fehlt';
    }
}

//provide text search and get code
function textSearch2code(thesCode, lNr, pos) {
    $('#searchInput').focusout(function () {
        $('#dropdown').delay(300).hide(0, function () {
            $('#dropdown').empty();
            $('#searchInput').val('');
        });
    });

    $('#searchInput').on('input', function () {
        $('#dropdown').empty();
        if ($('#searchInput').val().length > 0) {
            $('#dropdown').show();
            let autoSuggest = new Fuse(allConcepts
                    .filter(a => a.code.charAt(0) == thesCode), options)
                .search($('#searchInput')
                    .val());
            $.each(autoSuggest.slice(0, 10), function (index, value) {
                let entry = value.typ == 'altLabel' ? '<i>' + value.label + '</i>' : value.label;
                $('#dropdown')
                    .append(`<tr>
                            <td class="searchLink dropdown-item" 
                                onclick="selCode('${value.code.slice(1)}','${lNr}',${pos});">
                                    ${entry}
                            </td>
                            </tr>`);
            });
        }
    });
}
//create statusSymbol
function createStatusSymbol() {
    let msg = [errObj.errCodes.join(', '), errObj.order, errObj.rl, errObj.ra, errObj.typ];
    console
    let smiley = `<i class="fas fa-frown fa-2x" style="color:red;" data-bs-toggle="tooltip" data-bs-html="true" data-bs-placement="left"
                        title="${'<ul><li>?  ' + msg.filter(a=>a!=='').join('</li><li>- ') + '</li></ul>'}"></i>`;
    if (msg.join('') == '') {
        smiley = `<i class="fas fa-smile fa-2x" style="color:LimeGreen;"></i>`;
    }
    return smiley;
}

function previewFile() {
    $('.loading').show();
    const [file] = document.querySelector('input[type=file]').files;
    const reader = new FileReader();

    reader.addEventListener("load", () => {
        addCSV(reader.result.split('\n').map(a => a.split('\t')).filter(a => a.length > 2));
    }, false);

    if (file) {
        reader.readAsText(file);
    }
}

function addCSV(csvArr) {
    csvArr.shift();
    let lineNr = 0;
    for (let a of csvArr) {
        lineNr = addNewRow();
        $('#idValue' + lineNr).text(a[0].replace(/\'/g, ''));
        let k = a[1].replace(/\'/g, '');
        $('#keyValue' + lineNr).text(k);
        a.shift();
        a.shift();
        $('#notesValue' + lineNr).text(a.join('; ').replace(/\'/g, ''));
        update(lineNr, k);
    }
    $('.loading').hide();
}

function exportCSV(text) {

    let hiddenElement = document.createElement('a');
    hiddenElement.href = 'data:attachment/text,' + encodeURI(text);
    hiddenElement.target = '_blank';
    hiddenElement.download = 'codes.csv';
    hiddenElement.click();
}

function getCaretPosition(editableDiv) {
    var caretPos = 0,
        sel, range;
    if (window.getSelection) {
        sel = window.getSelection();
        if (sel.rangeCount) {
            range = sel.getRangeAt(0);
            if (range.commonAncestorContainer.parentNode == editableDiv) {
                caretPos = range.endOffset;
            }
        }
    } else if (document.selection && document.selection.createRange) {
        range = document.selection.createRange();
        if (range.parentElement() == editableDiv) {
            var tempEl = document.createElement("span");
            editableDiv.insertBefore(tempEl, editableDiv.firstChild);
            var tempRange = range.duplicate();
            tempRange.moveToElementText(tempEl);
            tempRange.setEndPoint("EndToEnd", range);
            caretPos = tempRange.text.length;
        }
    }
    return caretPos;
}