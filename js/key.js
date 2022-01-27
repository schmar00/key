let USER_LANG = 'de'; //(navigator.language || navigator.language).substring(0, 2);
let aC; // Map of all thesaurus concepts

const tP = { //Thesaurus Projects plus english/german
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

class Feat {
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

document.addEventListener("DOMContentLoaded", function (event) {

    $("#addRowBtn").click(function () {
        addRow();
    });

    $("#exportBtn").click(function () {
        let csvText = '';
        $("tr").each(function (index) {
            let line = [];
            $(this).children().each(function (index) {
                line.push($(this).text().replace(' ⇅', '').replace(/\n/g,'').replace(/  /g,''));
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

function addRow() {
    lineNr = $('tr').length - 1;
    
    $("#myTable").append(`<tr id="${lineNr}">
                            <td id="idValue${lineNr}" class="textarea" role="textbox" contenteditable></td>
                            <td id="keyValue${lineNr}" class="textarea" role="textbox" oninput="update(${lineNr}, this.innerHTML)" contenteditable>g</td>
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

function exportCSV(text) {

    let hiddenElement = document.createElement('a');
    hiddenElement.href = 'data:attachment/text,' + encodeURI(text);
    hiddenElement.target = '_blank';
    hiddenElement.download = 'codes.csv';
    hiddenElement.click();

}

function update(lNr, e) {
    //console.log(key2text(e.innerHTML)); //color, text, ml, pa, descPurpose, status
    $('#' + 'colorValue' + lNr).html(key2text(e).color);
    $('#' + 'textValue' + lNr).html(key2text(e).text);
    $('#' + 'rLithValue' + lNr).html(key2text(e).rLith);
    $('#' + 'rAgeValue' + lNr).html(key2text(e).rAge);
    $('#' + 'descPurposeValue' + lNr).html(key2text(e).descPurpose);
    $('#' + 'statusValue' + lNr).html(key2text(e).status);
    toolTips();

}

async function allConcepts() {

    let query = '?query=' + encodeURIComponent(`PREFIX skos:<http://www.w3.org/2004/02/skos/core#>
                                                select ?s ?L (coalesce(?c, "") as ?color)
                                                where {
                                                ?s skos:prefLabel ?L filter(lang(?L)="${USER_LANG}")
                                                optional {?s <http://dbpedia.org/ontology/colourHexCode> ?c}
                                                }`) + '&format=application/json';

    const ep = 'https://resource.geolba.ac.at/PoolParty/sparql/';

    let res = await Promise.all([
        fetch(ep + tP.g[0] + query).then(response => response.json()),
        fetch(ep + tP.t[0] + query).then(response => response.json()),
        fetch(ep + tP.l[0] + query).then(response => response.json()),
        fetch(ep + tP.a[0] + query).then(response => response.json()),
    ]);

    aC = new Map([...res[0].results.bindings, //list of all concepts
            ...res[1].results.bindings,
            ...res[2].results.bindings,
            ...res[3].results.bindings
        ]
        .map(a => [(Object.keys(tP)
            .find(k => tP[k][0] === (a.s.value.split('/')[3])) + a.s.value.split('/')[4]), {
            uri: a.s.value,
            label: a.L.value,
            color: a.color.value
        }]));
    //console.log(aC);
}

function key2text(k) {
    if (k.includes('<')) { //clean for copy and paste texts
        k = k.split('>')[1].split('<')[0];
    }

    let msg = new Map(errorMsg);
    let kArr = k.replace(/r/g, '').split('-');
    for (let a of kArr) {
        try {
            let x = aC.get(a).label;
        } catch (e) {
            msg.set('code', 'ungültige(r) Code(s) - ' + a);
        }

    }
    //console.log(k);
    let color = '';
    let legText = '';


    for (let t in tP) { //iterate all thesaurus projects
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
            let l = aC.get('l' + rLithArr[1].split('-')[0]);
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
            let b = aC.get('a' + rAgeArr[1].split('-')[0]);
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
    legText = legText.replace(' (; );','').replace('; );',')');
    if (legText.includes('<strong></strong> (')) {
        legText = legText.replace('<strong></strong> (', '').replace(')', '');
    }
    if (legText.includes('[')) {
        msg.set('bracket', 'Konzepte in eckigen Klammern sollten nicht für die Harmonisierung verwendet werden');
    }


    return new Feat(color, legText, rLithValue, rAgeValue, 'DN', statusSymbol(msg)); //color, text, ml, pa, descPurpose, status
}

function statusSymbol(msg) {
    let smiley = `<i class="fas fa-frown fa-2x" style="color:red;" data-bs-toggle="tooltip" data-bs-html="true" data-bs-placement="left"
                        title="${'<ul><li>- ' + Array.from(msg.values()).join('</li><li>- ') + '</li></ul>'}"></i>`;
    if (msg.size == 0) {
        smiley = `<i class="fas fa-smile fa-2x" style="color:LimeGreen;"></i>`;
    }
    return smiley;
}