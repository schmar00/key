let USER_LANG = 'de';
const BASE = location.protocol + '//' + location.host + location.pathname;

document.addEventListener("DOMContentLoaded", function (event) {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    let gu_key = '';
    if (urlParams.has('key')) {
        gu_key = urlParams.get('key');
        validate(gu_key);
    } else {
        alert('please use a valid GU-key after the URL e.g. "?key=gu120-dn"');
    }

});

async function validate(gu_key) {

    let aCL = new Map(); //list of all concepts
    let colors = new Map(); //list of all colors

    let query = '?query=' + encodeURIComponent(`PREFIX skos:<http://www.w3.org/2004/02/skos/core#>
                                                select ?s ?L (coalesce(?c, "#FFFFFF") as ?color)
                                                where {
                                                ?s skos:prefLabel ?L filter(lang(?L)="${USER_LANG}")
                                                optional {?s <http://dbpedia.org/ontology/colourHexCode> ?c}
                                                }`) + '&format=application/json';

    const ep = 'https://resource.geolba.ac.at/PoolParty/sparql/';

    let res = await Promise.all([
        fetch(ep + 'GeologicUnit' + query).then(response => response.json()),
        fetch(ep + 'tectonicunit' + query).then(response => response.json()),
        fetch(ep + 'lithology' + query).then(response => response.json()),
        fetch(ep + 'GeologicTimeScale' + query).then(response => response.json()),
    ]);

    for (let i of res) {
        for (let j of i.results.bindings) {
            colors.set(j.s.value, j.color.value);
        }
    }

    for (let i of res) {
        for (let j of i.results.bindings) {
            aCL.set(j.s.value, j.L.value);
        }
    }

    let cKey = new Map();
    const cPath = 'http://resource.geolba.ac.at/';
    cKey.set('gu', cPath + 'GeologicUnit/');
    cKey.set('tu', cPath + 'tectonicunit/');
    cKey.set('ml', cPath + 'lithology/');
    cKey.set('pl', cPath + 'lithology/');
    cKey.set('pa', cPath + 'GeologicTimeScale/');
    cKey.set('ya', cPath + 'GeologicTimeScale/');
    cKey.set('oa', cPath + 'GeologicTimeScale/');

    cKey.set('ep', cPath + 'lithology/'); //project missing
    cKey.set('ee', cPath + 'lithology/'); //project missing

    aCL.set(cPath + 'descPurp/1', 'definingNorm');
    aCL.set(cPath + 'descPurp/2', 'typicalNorm');
    aCL.set(cPath + 'descPurp/3', 'instance');
    cKey.set('dp', cPath + 'descPurp/'); //aCL entry added
    let code_arr = gu_key.split('-'); //all codes

    let txtArr = code_arr.map(a => a.substring(0,2) + `-` + aCL.get(cKey.get(a.substring(0,2)) + a.substring(2)));
    console.log(txtArr);
    //<span style="color:${colors.get(cKey.get(a.substring(0,2)) + a.substring(2))}">&block;</span>
    // e.g. gu120-gu23-tu20-ml158-pl44-pa26-ya35-oa34-ep50-ee12-dp1
    let genHTML = `<table class="table table-hover">`;

    let g_arr = txtArr.filter(a => a.includes('gu-')); //all gu codes
    let t_arr = txtArr.filter(a => a.includes('tu-')); //all tu codes
    let l_arr = txtArr.filter(a => a.includes('l-')); //all l codes
    let pa_arr = txtArr.join('$').split('$dp')[0].split('$pa');
    pa_arr.shift();
    
    if (g_arr.length > 0) {
        genHTML += `<tr>
                        <td>Geol. Einheit</td>
                        <td><span style="color:${colors.get(cKey.get('gu') + gu_key.split('gu')[1].split('-')[0])}">&block;</span></td>
                        <td>
                         ${g_arr.map(a => a.substring(3)).join(', ')}
                        </td>
                    </tr>`;
    }
    if (t_arr.length > 0) {
        genHTML += `<tr>
                        <td>Tekt. Einheit</td>
                        <td><span style="color:${colors.get(cKey.get('tu') + gu_key.split('tu')[1].split('-')[0])}">&block;</span></td>
                        <td>
                         ${t_arr.map(a => a.substring(3)).join(', ')}
                        </td>
                    </tr>`;
    }
    if (l_arr.length > 0) {
        genHTML += `<tr>
                        <td>Lithologie</td>
                        <td><span style="color:${colors.get(cKey.get('ml') + gu_key.split('ml')[1].split('-')[0])}">&block;</span></td>
                        <td>
                         ${l_arr.map(a => a.substring(3)).join(', ')}
                        </td>
                    </tr>`;
    }
    if (pa_arr.length > 0) {
        genHTML += `<tr>
                        <td>Geol. Event</td>
                        <td><span style="color:${colors.get(cKey.get('pa') + gu_key.split('pa')[1].split('-')[0])}">&block;</span></td>
                        <td>
                            ${pa_arr.map(a => a.substring(1)
                                .replace('$ya-',' (')
                                .replace('$oa-',' - ')
                                .replace('$ep-','; ')
                                .replace('$ee-','; ') + ')')
                                .join(`</td></tr>
                                <tr>
                                 <td>jüngerer Event</td>
                                 <td><span style="color:white">&block;</span></td>
                                <td>`)}</td>
                    </tr>`;
    }
    genHTML += `<tr>
                    <td>Desc. Purpose</td>
                    <td><span style="color:red">&block;</span></td>
                    <td>${txtArr.pop().split('-')[1]}</td>
                </tr>`;
    genHTML += `</table>`;

    document.body.innerHTML = genHTML;
}

