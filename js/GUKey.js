var GUKey = {

    init: function () {
        GUKey.getAllConcepts(GUKey.endPointBase, Object.keys(GUKey.thesCode), GUKey.USER_LANG);

        $("body").on("click", function () {
            let m = $("#tableMenu");
            if (m.css('display') == 'block') {
                m.hide();
            }
            $('td').css('box-shadow', 'none');
        });

        $("#tableMenu a").on("click", function () {
            $(this).parent().hide();
        });

        $("#searchInput").on('input', function (e) {
            GUKey.filterRowsBy($("#searchInput").val());
        });
    },

    //global vars
    USER_LANG: 'de', //(navigator.language || navigator.language).substring(0, 2);

    endPointBase: 'https://resource.geolba.ac.at/PoolParty/sparql/',

    //fuse GUKey.options
    options: {
        shouldSort: true,
        tokenize: true,
        keys: ['label']
    },

    thesCode: {
        GeologicUnit: 'g',
        lithology: 'l',
        GeologicTimeScale: 'a',
        tectonicunit: 't'
    },

    allConcepts: null,
    prefLabelsMap: null,

    errObj: {
        errCodes: [], //codes not in arr
        order: '', //wrong order of codes
        ra: '', //missing representative age
        rl: '', //missing representative lith
        typ: '' //missing GU type
    },

    //get all concepts of Thesaurus
    getAllConcepts: async function (endPointBase, thesList, lang) {
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

        GUKey.allConcepts = res
            .map(a => a.results.bindings)
            .flat(1)
            .map(b => Object({
                code: GUKey.createCodeFromUri(b.s.value),
                label: b.L.value,
                color: b.color.value,
                typ: b.typ.value
            }));

        GUKey.prefLabelsMap = new Map(GUKey.allConcepts
            .filter(obj => (obj.typ === 'prefLabel'))
            .map(a => [a.code, {
                label: a.label,
                color: a.color
            }]));

        GUKey.prefLabelsMap.set('TN', {
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
        //console.log(GUKey.allConcepts, GUKey.prefLabelsMap);
    },

    //createCodeFromUri
    createCodeFromUri: function (uri) {
        let a = uri.split('/');
        return GUKey.thesCode[a[3]] + a[4];
    },

    __lineNr: 0,
    /*
     * Line Number must increase even after row removal
     */
    getLineNr: function () {
        return GUKey.__lineNr++;
    },

    addNewRow: function (openAutocomplete, beforeRow, afterRow) { //insert HTML to add table row
        lNr = GUKey.getLineNr();

        let newRow = `<tr id="${lNr}">
                            <td class="menuEnabled">
                                <input type="checkbox" id="check${lNr}"/>
                            </td>
                            <td>
                                <div id="idValue${lNr}" class="textarea form-control value" role="textbox"
                                contenteditable></div>
                            </td>
                            <td>
                                <div id="keyValue${lNr}" class="textarea form-control value" role="textbox"
                                onmousedown="GUKey.mouseDown(event);"
                                onkeyup="GUKey.editKey(event,${lNr}, this, 'keyup');"
                                onmouseup="GUKey.editKey(event,${lNr}, this, 'mouseup');"
                                placeholder="Zum Öffnen/Schließen des Assistenten anklicken..."
                                contenteditable></div>
                                <div id="keyValue${lNr}_dropdown" class="dropdown_class">
                                    <div>
                                        <p id="keyValue${lNr}_header" class="keycomplete-header"></p>
                                        <button class="btn btn-outline keycomplete-close" tabindex="-1" type="button" onclick="KeyComplete.hide();">x</button>
                                    </div>
                                    <input id="keyValue${lNr}_filter" placeholder="Suche mit Tippen starten..." onclick="KeyComplete.ignoreClose(event);" oninput="KeyComplete.search(event);" class="form-control dropdown-filter"/>
                                    <table id="keyValue${lNr}_table" class="table table-striped table-autocomplete" border="0">
                                    </table>
                                </div>
                            </td>
                            <td id="colorValue${lNr}" class="menuEnabled"></td>
                            <td id="textValue${lNr}" class="menuEnabled"></td>
                            <td id="rLithValue${lNr}" class="menuEnabled"></td>
                            <td id="rAgeValue${lNr}" class="menuEnabled"></td>
                            <td id="descPurposeValue${lNr}" class="menuEnabled"></td>
                            <td id="statusValue${lNr}" class="menuEnabled"></td>
                            <td>
                                <div id="notesValue${lNr}" class="textarea form-control" role="textbox" contenteditable></div></td>
                        </tr>`;
        let nr = $(newRow);
        if (beforeRow) {
            nr.insertBefore(GUKey.contextRow);
        } else if (afterRow)
            nr.insertAfter(GUKey.contextRow);
        else
            nr.appendTo($("#myTable"));
        /*if (openAutocomplete) {
            $([document.documentElement, document.body]).animate({
                scrollTop: nr.offset().top + 180
            }, 100);
        }*/

        let cmf = function (e) {
            GUKey.contextRow = $(e.target /*td*/).parent();
            //$('td').css('box-shadow', 'none');
            var top = e.pageY - 10;
            var left = e.pageX - 120;
            $("#tableMenu").css({
                display: "block",
                top: top,
                left: left
            });
            KeyComplete.hide();
            return false; //blocks default Webbrowser right click menu

        };
        let tds = $("td.menuEnabled", nr);
        tds.on('contextmenu', cmf);

        if (openAutocomplete) {
            var line = lNr;
            setTimeout(function () {
                KeyComplete.show($("#keyValue" + line)[0], line, 0);
            }, 100);
        }
        return lNr;
    },
    deleteRow: function () {
        let selection = $("#myTable tr").filter(function (index) {
            return $('td input[type=checkbox]:checked', this).length > 0;
        });
        if (selection.length > 0)
            selection.remove();
        else
            $(GUKey.contextRow).remove();
    },
    selectRows: function () {
        let checked = $("#myTable tr td input[type=checkbox]:checked");
        if (checked.length > 0)
            $("#myTable tr td input[type=checkbox]").prop("checked", false);
        else
            $("#myTable tr td input[type=checkbox]").prop("checked", true);
    },
    mouseX: null,
    mouseDown: function (e) {
        GUKey.mouseX = e.clientX;
        GUKey.mouseY = e.clientY;
    },
    editKey: function (e, lNr, node, action) {
        if (action == 'mouseup') {
            // check mouse move
            var dx = GUKey.mouseX - e.clientX;
            var dy = GUKey.mouseY - e.clientY;

            if ((dx * dx + dy * dy) > 16) {
                KeyComplete.ignoreClick = true;
                return;
            }
        }
        let pos = GUKey.getCaretPosition(node);
        let keyTxt = node.textContent;
        let char = keyTxt.charAt(pos - 1);

        if (action == "mouseup") {
            if (!KeyComplete.checkClose(pos))
                KeyComplete.show(node, lNr, pos);
        }

        if (action == 'keyup') {
            GUKey.update(lNr, keyTxt);
        }

    },
    //
    selCode: function (code, lNr, pos) {
        //console.log(code, lNr, pos);
        let keyTxt = $('#keyValue' + lNr).text();

        if (keyTxt.charAt(pos + 1) !== '-') {
            code = code + '-';
        }

        keyTxt = (keyTxt.substr(0, pos) + code + keyTxt.substr(pos, 100)).replace('--', '-');
        $('#keyValue' + lNr).text(keyTxt);
        GUKey.update(lNr, keyTxt);
    },

    update: function (lNr, keyTxt) {
        GUKey.errObj.errCodes = [];

        GUKey.evalKey(keyTxt);
        $('#textValue' + lNr).html(GUKey.createLegText(keyTxt));
        $('#rLithValue' + lNr).html(GUKey.getRVal('rl', keyTxt));
        $('#rAgeValue' + lNr).html(GUKey.getRVal('ra', keyTxt));

        $('#descPurposeValue' + lNr).html(GUKey.getDescPurpose(keyTxt));

        $('#statusValue' + lNr).html(GUKey.createStatusSymbol());

        $('#colorValue' + lNr).html(GUKey.getColorIcon(GUKey.getLegColor(keyTxt), 3));

        //enable tooltips everywhere
        let tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
        let tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl)
        });
    },

    getDescPurpose: function (keyTxt) {
        let dp = ['TN', 'DN', 'IN'];
        let d = keyTxt.split('-').at(-1);

        if (dp.includes(d)) {
            return GUKey.getLabel(d);
        } else {
            return '';
        }
    },

    getRVal: function (a, keyTxt) { //e.g. "rl"
        let res = '';
        let color = '';
        if (keyTxt.includes(a)) {
            let b = keyTxt.split(a)[1].split('-')[0];
            try {
                if (!(isNaN(b) || b == '')) {
                    let c = GUKey.prefLabelsMap.get(a.substring(1) + b);
                    res = c.label;
                    color = c.color;
                }
            } catch (error) {
                GUKey.errObj.errCodes.push(a);
            }
        }
        return GUKey.getColorIcon(color, '1') + ' ' + `<div class="icon-text">${res}</div>`;
    },

    getColorIcon: function (color, fa) {
        let magicText = '';
        if (fa !== '1') {
            magicText = GUKey.hexToRGB(color);
        }


        if (color == undefined || color == '') {
            color = `<i class="far fa-square fa-${fa}x" style="color:grey;"></i>`;
        } else {
            color = `<i title="${GUKey.hexToRGB(color)}"
                    data-bs-toggle="tooltip" 
                    data-bs-html="true" 
                    data-bs-placement="bottom" 
                    class="fas fa-square fa-${fa}x" 
                    style="color:${color};">
                </i>
                <span class="magic-text">${magicText}</span>`;
        }
        return color;
    },

    hexToRGB: function (h) {
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
    },

    getLegColor: function (keyTxt) {
        let k = keyTxt.split('-');
        let colorCodes = ['g', 't', 'rl', 'ra'];

        let colArr = k.filter(a => a.includes('g') || a.includes('t') || a.includes('rl') || a.includes('ra'))
            .map(a => GUKey.getColor(a))
            .filter(a => a !== '');

        if (colArr.length > 0) {
            return colArr[0];
        } else {
            return '';
        }

    },

    //create legend texts from GUkey
    createLegText: function (keyTxt) {
        let k = keyTxt.split('-');
        let kArr = keyTxt.replace(/r/g, '').split('-').filter(a => a !== '');
        let legText = '';
        let geolText = kArr.filter(a => a.indexOf('g') > -1).map(a => GUKey.getLabel(a));
        let lithText = kArr.filter(a => a.indexOf('l') > -1).map(a => GUKey.getLabel(a));
        let ageText = kArr.filter(a => a.indexOf('a') > -1).map(a => GUKey.getLabel(a));
        let tektText = kArr.filter(a => a.indexOf('t') > -1).map(a => GUKey.getLabel(a));

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
            if (GUKey.getLabel(code) == 'x') {
                GUKey.errObj.errCodes.push(code);
            }
        }
        return legText;
    },

    getLabel: function (code) {
        let a = 'x';
        if (GUKey.prefLabelsMap.has(code)) {
            a = GUKey.prefLabelsMap.get(code).label;
        }
        return a;
    },

    getColor: function (code) {
        let a = '';
        if (GUKey.prefLabelsMap.has(code.replace('r', ''))) {
            a = GUKey.prefLabelsMap.get(code.replace('r', '')).color;
        }
        return a;
    },

    letters: ['g', 't', 'rl', 'l', 'ra', 'a', 'e', 'p', 'TN', 'DN', 'IN'],

    //evaluate GUkey syntax
    evalKey: function (keyTxt) {
        let testArr = [];
        let kArr = keyTxt.replace(/r/g, '').split('-').filter(a => a !== '');
        for (let i of kArr.map(a => a.replace(/[0-9]/g, ''))) {
            testArr.push(GUKey.letters.findIndex(a => a == i));
        }
        testArr = testArr.filter(a => a >= 0);
        if (String(testArr + '') == String(testArr.sort((a, b) => a - b) + '')) {
            GUKey.errObj.order = '';
        } else {
            GUKey.errObj.order = 'Reihenfolge ' + GUKey.letters.join(' ');
        }

        if (keyTxt.indexOf('rl') > -1) {
            GUKey.errObj.rl = '';
        } else {
            GUKey.errObj.rl = 'repräsentative Lithologie fehlt';
        }
        if (keyTxt.indexOf('ra') > -1) {
            GUKey.errObj.ra = '';
        } else {
            GUKey.errObj.ra = 'repräsentatives Alter fehlt';
        }
        if (keyTxt.endsWith("-"))
            GUKey.errObj.errCodes.push("Falsche Endung des Schlüssels '-'");
        if (keyTxt.indexOf("--") > 0)
            GUKey.errObj.errCodes.push("Falsche Syntax des Schlüssels '--'");
    },

    //create statusSymbol
    createStatusSymbol: function () {
        let msg = [GUKey.errObj.errCodes.join(', '), GUKey.errObj.order, GUKey.errObj.rl, GUKey.errObj.ra, GUKey.errObj.typ];
        console
        let smiley = `<i class="fas fa-frown fa-2x" style="color:red;" data-bs-toggle="tooltip" data-bs-html="true" data-bs-placement="left"
                        title="${'<ul><li>?  ' + msg.filter(a => a !== '').join('</li><li>- ') + '</li></ul>'}"></i>`;
        if (msg.join('') == '') {
            smiley = `<i class="fas fa-smile fa-2x" style="color:LimeGreen;"></i>`;
        }
        return smiley;
    },

    previewFile: function () {
        $('.loading').show();
        const [file] = document.querySelector('input[type=file]').files;
        const reader = new FileReader();

        reader.addEventListener("load", () => {
            GUKey.addCSV(reader.result.split('\n').map(a => a.split('\t')).filter(a => a.length > 2));
        }, false);

        if (file) {
            reader.readAsText(file);
        }
    },

    addCSV: function (csvArr) {
        csvArr.shift();
        let lineNr = 0;
        for (let a of csvArr) {
            lineNr = GUKey.addNewRow();
            $('#idValue' + lineNr).text(a[0].replace(/\'/g, ''));
            let k = a[1].replace(/\'/g, '');
            $('#keyValue' + lineNr).text(k);
            $('#notesValue' + lineNr).text(a.pop().replace(/\'/g, ''));
            /*a.shift();
            a.shift();
            $('#notesValue' + lineNr).text(a.join('; ').replace(/\'/g, ''));*/
            GUKey.update(lineNr, k);
        }
        $('.loading').hide();
    },

    exportCSV: function (text) {
        KeyComplete.clean();
        let hiddenElement = document.createElement('a');
        hiddenElement.href = "data:text/csv;charset=utf-8,%EF%BB%BF" + encodeURI(text);
        hiddenElement.target = '_blank';
        hiddenElement.download = 'codes.csv';
        hiddenElement.click();
    },

    getCaretPosition: function (editableDiv) {
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
    },
    filterRowsBy: function (val) {
        if (!val)
            $("#myTable tr").show();
        else {
            val = val.toLowerCase();
            let V = val.split(' ');
            let selection = $("#myTable tr").filter(function (index) {
                let t = $("td", this).text();
                let b = t != null;
                if (b) {
                    t = t.toLowerCase();
                    V.forEach((v) => {
                        if (v != null && v != "")
                            b &&= t.indexOf(v) >= 0;
                    });
                }
                return b;
            });
            $("#myTable tr").hide();
            selection.show();
        }
    },
    sortTable: function (e, status) {
        KeyComplete.clean();
        var table = $('#myTable');
        var rows = table.find('tr:gt(0)').toArray().sort(comparer($(e).index()))
        e.asc = !e.asc
        if (!e.asc) {
            rows = rows.reverse();
        }
        for (var i = 0; i < rows.length; i++) {
            table.append(rows[i]);
        }
        function comparer(index) {
            return function (a, b) {
                var valA = getCellValue(a, index), valB = getCellValue(b, index)
                return $.isNumeric(valA) && $.isNumeric(valB) ? valA - valB : valA.toString().localeCompare(valB)
            }
        }
        function getCellValue(row, index) {
            return status ? $(row).children('td').eq(index)[0].innerHTML : $(row).children('td').eq(index).text();
        }
    }
};