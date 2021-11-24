// e.g. gu120-gu23-tu20-ml158-pl44-pa26-ya35-oa34-ep50-ee12-GU-dn

let USER_LANG = 'en';
const BASE = location.protocol + '//' + location.host + location.pathname;
const ENDPOINT = 'https://resource.geolba.ac.at/PoolParty/sparql/';

document.addEventListener("DOMContentLoaded", function (event) {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    let gu_key = '';
    if (urlParams.has('key')) {
        gu_key = urlParams.get('key');
        console.log(gu_key);
    }
    validate(gu_key);
});

async function validate(gu_key) {
    let a = new Map();
    let b = new Map();
    a.set('g', 'GeologicUnit');
    a.set('t', 'tectonicunit');
    a.set('l', 'lithology');
    a.set('a', 'GeologicTimeScale');

    let query = '?query=' + encodeURIComponent(`PREFIX skos:<http://www.w3.org/2004/02/skos/core#>
                                                select ?s ?L
                                                where {
                                                ?s skos:prefLabel ?L filter(lang(?L)="de")
                                                }`) + '&format=application/json';

    let res = await Promise.all([
        fetch(ENDPOINT + a.get('g') + query).then(response => response.json()),
        fetch(ENDPOINT + a.get('t') + query).then(response => response.json()),
        fetch(ENDPOINT + a.get('l') + query).then(response => response.json()),
        fetch(ENDPOINT + a.get('a') + query).then(response => response.json()),
    ]);

    for (let i of res) {
        for (let j of i.results.bindings) {
            b.set(j.s.value, j.L.value);
        }
    }
    //console.log(a.get('http://resource.geolba.ac.at/GeologicUnit/519'));
    //console.log(b);
    // e.g. gu120-gu23-tu20-ml158-pl44-pa26-ya35-oa34-ep50-ee12-GU-dn

    let html = '';
    for (let i of gu_key.split('-')) {
        switch (i.substr(0, 2)) {
            case 'gu':
                html += b.get('http://resource.geolba.ac.at/GeologicUnit/' + i.substr(2, 6)) + ', ';
                break;
            case 'tu':
                html += ' (' + b.get('http://resource.geolba.ac.at/tectonicunit/' + i.substr(2, 6)) + ')';
                break;
            case 'ml':
                html += '<br>' + b.get('http://resource.geolba.ac.at/lithology/' + i.substr(2, 6));
                break;
            case 'pl':
                html += ' / ' + b.get('http://resource.geolba.ac.at/lithology/' + i.substr(2, 6));
                break;
            case 'pa':
                html += '<br>' + b.get('http://resource.geolba.ac.at/GeologicTimeScale/' + i.substr(2, 6));
                break;
            case 'ya':
                html += ' (' + b.get('http://resource.geolba.ac.at/GeologicTimeScale/' + i.substr(2, 6)) + ' - ';
                break;
            case 'oa':
                html += b.get('http://resource.geolba.ac.at/GeologicTimeScale/' + i.substr(2, 6)) + ')';
                break;
            case 'ep':
                html += '<br>' + i;
                break;
            case 'ee':
                html += ', ' + i;
                break;
            case 'dn':
                html += ', ' + i;
        }

    }
    document.body.innerHTML = html;
}