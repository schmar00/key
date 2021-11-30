let USER_LANG = (navigator.language || navigator.language).substring(0, 2);

document.addEventListener("DOMContentLoaded", function (event) {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    const tP = { //Thesaurus Projects plus english/german
        g: ['GeologicUnit', {
            de: 'Geol. Einheit',
            en: 'Geol. Unit'
        }],
        t: ['tectonicunit', {
            de: 'Tekt. Einheit',
            en: 'Tect. Unit'
        }],
        l: ['lithology', {
            de: 'Lithologie',
            en: 'Lithology'
        }],
        a: ['GeologicTimeScale', {
            de: 'Alter',
            en: 'Age'
        }]
    };

    let gu_key = ''; //e.g. g120-g23-t20-l158-l44-a26-a35-a34-p50-e12-TN
    if (urlParams.has('lang')) {
        USER_LANG = urlParams.get('lang');
    }

    if (urlParams.has('key')) {
        gu_key = urlParams.get('key');
        validate(gu_key, tP);
    } else {
        alert('please use a valid GU-key after the URL e.g. "?key=gu120-TN"');
    }

});

async function validate(gu_key, tP) {

    let query = '?query=' + encodeURIComponent(`PREFIX skos:<http://www.w3.org/2004/02/skos/core#>
                                                select ?s ?L (coalesce(?c, "#FFFFFF") as ?color)
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

    let aC = new Map([...res[0].results.bindings,
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

    let genHTML = `<table class="table table-hover">`;

    for (let t in tP) { // validation of g, t, l, a etc. elements are still missing
        genHTML += createRow(gu_key.replace('pa', 'a').replace('ml', 'l'), tP[t][1][USER_LANG], t, aC);
    }
    let dP = gu_key.split('-').pop();
    genHTML += createRowHTML('Desc. Purpose',
        (dP == 'TN') ? 'lightblue' : ((dP == 'IN') ? 'lightgreen' : 'red'),
        (dP == 'TN') ? 'typical norm' : ((dP == 'IN') ? 'instance' : 'defining norm'));

    genHTML += `</table>`;
    document.getElementById('legItem').innerHTML = genHTML;
    document.getElementById('key').innerHTML = gu_key;
}

function createRow(gu_key2, tN, t, aC) {
    let tArr = gu_key2.split('-').filter(a => a.includes(t));
    let rowHTML = '';
    let lTxt = '';

    if (tArr.length > 0) {

        let lArr = tArr.map(a => aC.get(a).label);
        let firstLabel = lArr[0];

        switch (t) {
            case 'g':
                lTxt = lArr.join('; ');
                break;
            case 't':
                lTxt = lArr.join('; ');
                break;
            case 'l':
                lArr.shift();
                lTxt = (firstLabel + ' (' + lArr.join(', ') + ')').replace('()', '');
                break;
            case 'a':
                lArr.shift();
                lTxt = (firstLabel + ' (' + lArr.join(' - ') + ')').replace('()', '');
        }

        rowHTML = createRowHTML(tN, aC.get(tArr[0]).color, lTxt);

        return rowHTML;
    }
}

function createRowHTML(txt1, color, txt) {
    return `<tr>
            <td>
                ${txt1}
            </td>
            <td>
                <span style="color:${color}">
                    &block;
                </span>
            </td>
            <td>
                ${txt}
            </td>
            </tr>`;
}