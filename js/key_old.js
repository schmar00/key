let USER_LANG = 'de'; //(navigator.language || navigator.language).substring(0, 2);
let aC; // Map of all thesaurus Concepts (prefLabel plus altLabels)

const ep = 'https://resource.geolba.ac.at/PoolParty/sparql/';

const options = { //fuse options
    shouldSort: true,
    tokenize: true,
    keys: ['L.value']
};

let tP = { //Thesaurus Projects plus english/german
    g: ['GeologicUnit', {
        de: 'Geol. Einheit',
        en: 'Geol. Unit'
    }],
    l: ['lithology', {
        de: 'Lithologie',
        en: 'Lithology'
    }],
    a: ['GeologicTimeScale', {
        de: 'Alter',
        en: 'Age'
    }],
    t: ['tectonicunit', {
        de: 'Tekt. Einheit',
        en: 'Tect. Unit'
    }]
};

class Feat { //resulting table row
    constructor(color, text, rLith, rAge, descPurpose, status) { // Constructor
        this.color = color;
        this.text = text;
        this.rLith = rLith;
        this.rAge = rAge;
        this.descPurpose = descPurpose;
        this.status = status;
    }
}

function previewFile() {
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
        lineNr = addRow();
        $('#idValue' + lineNr).text(a[0].replace(/\'/g, ''));
        let k = a[1].replace(/\'/g, '');
        $('#keyValue' + lineNr).text(k);
        a.shift();
        a.shift();
        $('#notesValue' + lineNr).text(a.join('; ').replace(/\'/g, ''));
        update(lineNr, k);
    }
}

function exportCSV(text) {

    let hiddenElement = document.createElement('a');
    hiddenElement.href = 'data:attachment/text,' + encodeURI(text);
    hiddenElement.target = '_blank';
    hiddenElement.download = 'codes.csv';
    hiddenElement.click();
}

document.addEventListener("DOMContentLoaded", function (event) {

    $('#searchGroup').hide();
    $("#addRowBtn").click(function () {
        let l = addRow();
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

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    if (urlParams.has('lang')) {
        USER_LANG = urlParams.get('lang');
    }
    allConcepts();

});

let lineNr = 0;

function addRow() { //insert HTML to add table row
    lineNr = $('tr').length - 1;

    $("#myTable").append(`<tr id="${lineNr}">
                            <td id="idValue${lineNr}" class="textarea" role="textbox" contenteditable></td>
                            <td id="keyValue${lineNr}" class="textarea" role="textbox" oninput="update(${lineNr}, this.innerHTML)" contenteditable></td>
                            <td id="colorValue${lineNr}"></td>
                            <td id="textValue${lineNr}"></td>
                            <td id="rLithValue${lineNr}"></td>
                            <td id="rAgeValue${lineNr}"></td>
                            <td id="descPurposeValue${lineNr}"></td>
                            <td id="statusValue${lineNr}"></td>
                            <td id="notesValue${lineNr}" class="textarea" role="textbox" contenteditable></td>
                        </tr>`);
    lineNr++
    return (lineNr - 1);
}

function update(lNr, e) {
    e = e.split('<')[0]; //<br>??
    $('#' + 'colorValue' + lNr).html(key2text(e).color);
    $('#' + 'textValue' + lNr).html(key2text(e).text);
    $('#' + 'rLithValue' + lNr).html(key2text(e).rLith);
    $('#' + 'rAgeValue' + lNr).html(key2text(e).rAge);
    $('#' + 'descPurposeValue' + lNr).html(key2text(e).descPurpose);
    $('#' + 'statusValue' + lNr).html(key2text(e).status);
    toolTips();

    let a = e.slice(-1);
    $('#searchGroup').hide();
    for (let [key, value] of Object.entries(tP)) {
        if (key == a) {
            actSearch(value[2], lNr);
            $('#searchInput').attr('placeholder', 'alle ' + value[1].de + ' Begriffe');
            $('#searchGroup').show();
        }
    }
}

async function allConcepts() { //get all concepts of all thesauri

    let query = '?query=' + encodeURIComponent(`PREFIX skos:<http://www.w3.org/2004/02/skos/core#>
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

    let res = await Promise.all([
        fetch(ep + tP.g[0] + query).then(response => response.json()),
        fetch(ep + tP.t[0] + query).then(response => response.json()),
        fetch(ep + tP.l[0] + query).then(response => response.json()),
        fetch(ep + tP.a[0] + query).then(response => response.json()),
    ]);

    tP.g.push(res[0].results.bindings);
    tP.t.push(res[1].results.bindings);
    tP.l.push(res[2].results.bindings);
    tP.a.push(res[3].results.bindings);

    aC = new Map([...res[0].results.bindings, //list of all concepts
            ...res[1].results.bindings,
            ...res[2].results.bindings,
            ...res[3].results.bindings
        ]
        .map(a => [(Object.keys(tP)
            .find(k => tP[k][0] === (a.s.value.split('/')[3])) + a.s.value.split('/')[4]), {
            uri: a.s.value,
            label: a.L.value,
            color: a.color.value,
            typ: a.typ.value
        }]));
        //console.log(tP, aC);
        
/*     bC = new Map(
        [...aC]
        .filter(([k, v]) => v.typ === 'prefLabel')
    ); */

}

function key2text(k) { //create texts from key and evaluate values

    if (k.includes('<')) { //remove line breaks <br>
        k = k.split('>')[1].split('<')[0];
    }

    let msg = new Map(errorMsg);
    let kArr = k.replace(/r/g, '').split('-');
    let dP = '';

    for (let a of kArr) { //code validation
        try { //try to get thesaurus codes
            let x = aC.get(a).label;
        } catch (e) { //if not check for description purpose
            switch (a) {
                case 'DN':
                    dP = 'definingNorm';
                    break;
                case 'TN':
                    dP = 'typicalNorm';
                    break;
                case 'IN':
                    dP = 'instance';
                    break;
                default:
                    msg.set('code', 'ungültige(r) Code(s) - ' + a);
            }
        }
    }
    //console.log(k);
    let color = '';
    let legText = '';

    //console.log(tP);

    for (let t in tP) { //iterate all thesaurus projects
        //console.log(tP);
        let tArr = kArr.filter(a => a.includes(t));
        let lTxt = '';

        //if (tArr.length > 0) {
        let lArr = [];
        try {
            lArr = tArr.map(a => aC.get(a).label);
        } catch (e) {}

        let cArr = [''];
        try {
            cArr = tArr.map(a => aC.get(a).color);
        } catch (e) {}

        switch (t) {
            case 'g':
                lTxt = '<strong>' + lArr.join(', ') + '</strong>';
                color = cArr[0];
                break;
            case 'l':
                lTxt = ' (' + lArr.join(', ') + '; ';
                color = (color == '') ? cArr[0] : color;
                break;
            case 'a':
                if (lArr.length > 2) {
                    lArr.shift();
                }
                lTxt = lArr.join(' - ') + ')';
                color = (color == '') ? cArr[0] : color;
                break;
            case 't':
                lTxt = '; ' + lArr.join(', ');
                break;
        }
        legText += lTxt;
    }

    if (color == undefined || color == '') {
        color = `<i class="far fa-square fa-2x" style="color:grey;"></i>`;
    } else {
        color = `<i class="fas fa-square fa-2x" style="color:${color};"></i>`;
    }

    let rLithValue = '';
    let rLithArr = k.split('rl');
    if (rLithArr.length == 2) {
        msg.delete('rl');
        try {
            let l = bC.get('l' + rLithArr[1].split('-')[0]);
            if (l.color == '') {
                rLithValue = `<i class="far fa-circle" style="color:grey;"></i>&nbsp;${l.label}`;
            } else {
                rLithValue = `<i class="fas fa-circle" style="color:${l.color};"></i>&nbsp;${l.label}`;
            }
        } catch (e) {
            msg.set('rl_code', 'repräsentative Lithologie ungültig');
        }
    }

    let rAgeValue = '';
    let rAgeArr = k.split('ra');
    if (rAgeArr.length == 2) {
        msg.delete('ra');
        try {
            let b = bC.get('a' + rAgeArr[1].split('-')[0]);
            if (b.color == '') {
                rAgeValue = `<i class="far fa-circle" style="color:grey;"></i>&nbsp;${b.label}`;
            } else {
                rAgeValue = `<i class="fas fa-circle" style="color:${b.color};"></i>&nbsp;${b.label}`;
            }
        } catch (e) {
            msg.set('ra_code', 'repräsentatives Alter ungültig');
        }
    }
    //need for adaption yet
    legText = legText.replace(' (; );', '').replace('; );', ')');
    if (legText.includes('<strong></strong> (')) {
        legText = legText.replace('<strong></strong> (', '').replace(')', '');
    }
    if (!checkOrder(k)) {
        msg.set('order', 'Reihung der Attribute falsch (g,t,rl,l,ra,a)');
    }

    if (dP == '') {
        msg.set('descriptionPurpose', 'Description Purpose fehlt');
    }

    return new Feat(color, legText, rLithValue, rAgeValue, dP, statusSymbol(msg)); //color, text, ml, pa, descPurpose, status
}

function statusSymbol(msg) { //create smiley from message
    let smiley = `<i class="fas fa-frown fa-2x" style="color:red;" data-bs-toggle="tooltip" data-bs-html="true" data-bs-placement="left"
                        title="${'<ul><li>- ' + Array.from(msg.values()).join('</li><li>- ') + '</li></ul>'}"></i>`;
    if (msg.size == 0) {
        smiley = `<i class="fas fa-smile fa-2x" style="color:LimeGreen;"></i>`;
    }
    return smiley;
}

function checkOrder(g) { //check sorting order of key
    let order = ['g', 't', 'rl', 'l', 'ra', 'a', 'DN', 'TN', 'IN'];
    let chkOrd = true;
    let gArr = g.replace(/[0-9]/g, '').split('-');
    let k = 0;
    for (let i of gArr) {
        let newIndex = order.findIndex((e) => e == i);
        if (newIndex < k) {
            chkOrd = false;
        }
        k = newIndex;
    }
    return chkOrd;
}

//Autocomplete text input for one category

function actSearch(t, lNr) {
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
            let autoSuggest = new Fuse(t, options).search($('#searchInput').val());
            $.each(autoSuggest.slice(0, 10), function (index, value) {
                let entry = value.typ.value == 'altLabel' ? '<i>' + value.L.value + '</i>' : value.L.value;
                $('#dropdown').append(`<tr>
                                            <td 
                                            class="searchLink dropdown-item" 
                                            onclick="addCode('${value.s.value}','${lNr}');$('#searchGroup').hide();">
                                                ${entry}
                                            </td>
                                        </tr>`);
            });
        }
    });
}

function addCode(uri, lNr) {
    let a = $('#keyValue' + lNr);
    a.text(a.text() + uri.split('/').slice(-1));
    update(lNr, a.text());
}