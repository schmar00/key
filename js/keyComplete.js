var KeyComplete = {
    ignoreClick: false,
    elem: null,
    lNr: -1,
    pos: -1,

    codeLetters: ['g', 't', 'rl', 'l', 'ra', 'a'],
    codeBolds: ['rl', 'ra'],
    codeStarts: ['g', 't', 'rl'],
    codeLetterCounts: [1000, 1000, 1, 1000, 1, 1000,],
    codeEnds: ['TN', 'DN', 'IN'],

    attrLabel: {
        "g": "geologische Einheit (Name)",
        "t": "tektonische Einheit (Name)",
        "rl": "lithologischer Haupt-Bestandteil (representative lithology value)",
        "l": "lithologischer (Neben-)Bestandteil (present lithology)",
        "ra": "Alter (representative age)",
        "a": "älteres Alter, jüngeres Alter",
        "p": "Event-Process",
        "e": "Event-Environment",
        "DN": "defining norm",
        "TN": "typical norm",
        "IN": "instance"
    },

    init: function () {
        document.addEventListener("click", function (e) {
            if (!KeyComplete.ignoreClick)
                $(".dropdown_class").hide();
            KeyComplete.ignoreClick = false;
        });
    },

    _lastCheckPos: -1,
    checkClose: function (pos) {
        if (!KeyComplete.elem || KeyComplete._lastCheckPos != pos) {
            KeyComplete._lastCheckPos = pos;
            return false;
        }
        KeyComplete._lastCheckPos = pos;
        return KeyComplete.hide();
    },
    hide: function () {
        if (!KeyComplete.elem)
            return;
        let dropdown = $('#' + KeyComplete.elem.id + '_dropdown');
        if (dropdown.is(":visible")) {
            dropdown.hide();
            return true;
        }
        return false;
    },
    clean: function () {
        if (!KeyComplete.elem)
            return;
        let dropdown = $('#' + KeyComplete.elem.id + '_dropdown');
        let dropdownTable = $('.table-autocomplete');
        dropdown.hide();
        dropdownTable.empty();
    },
    getCodeFromPos: function (keyTxt, pos) {
        if (pos == 0) {
            let thesCode = '-';
            return [thesCode, pos, pos];
        }
        // move from '-' back
        if (keyTxt.charAt(pos) == '-')
            pos--;
        // move to number to last letter
        let c;
        while ((c = keyTxt.charAt(pos - 1)) >= '0' && c <= '9')
            pos--;
        // move to last letter
        while ((c = keyTxt.toLowerCase().charAt(pos)) >= 'a' && c <= 'z')
            pos++;
        let thesCode = pos > 1 ? keyTxt.substr(pos - 2, 2) : keyTxt.charAt(pos - 1);

        if (GUKey.letters.indexOf(thesCode) == -1 && pos > 1)
            thesCode = keyTxt.charAt(pos - 1);
        if (GUKey.letters.indexOf(thesCode) == -1 && thesCode != '-' && keyTxt == "")
            thesCode = '-';
        let prevIsNum = false;
        if (pos > 0 && keyTxt.charAt(pos - 1)) {
            c = keyTxt.charAt(pos - 1);
            prevIsNum = (c >= '0' && c <= 9);
        }
        let endPos = keyTxt.indexOf('-', keyTxt.charAt(pos) == '-' && prevIsNum ? pos + 1 : pos);
        return [thesCode, pos, endPos];
    },
    canInsertCode: function (keyTxt, thesCode, pos) {
        if (KeyComplete.pos == 0)
            return true;
        if (pos == keyTxt.length)
            return true;
        let a = keyTxt.replace(/[0-9]/g, '').split('-');
        if (a.indexOf(thesCode) < 0)
            return true;
        let i = KeyComplete.codeLetters.indexOf(thesCode);
        return i > -1 /*&& KeyComplete.codeLetterCounts[i] > 1*/;
    },

    show: function (elem, lNr, pos) {
        KeyComplete.ignoreClick = true;
        KeyComplete.elem = elem;
        KeyComplete.lNr = lNr;
        KeyComplete.pos = pos;
        var id = $('#' + elem.id);
        var dropdown = $('#' + elem.id + '_dropdown');
        var dropdownTable = $('#' + elem.id + '_table');
        var dropdownHeader = $('#' + elem.id + '_header');
        var dropdownFilter = $('#' + elem.id + '_filter');

        dropdownTable.empty();

        let keyTxt = elem.textContent;
        let thesCodeInfo = KeyComplete.getCodeFromPos(keyTxt, pos);
        let thesCode = thesCodeInfo[0];
        pos = thesCodeInfo[1];
        let isEnding = KeyComplete.codeEnds.indexOf(thesCode) >= 0;
        let shown = false;
        if (thesCode != null) {
            $(".dropdown_class").hide();

            if (thesCode == '-') {
                let testArr = [];
                let kArr = keyTxt.replace(/r/g, '').replace(/[0-9]/g, '').split('-');
                var next = [];
                var max = -1;
                $.each(kArr, function (index, value) {
                    if (KeyComplete.codeEnds.indexOf(value) >= 0)
                        return;
                    var i = KeyComplete.codeLetters.indexOf(value);
                    if (i == -1) return;
                    max = i;
                });
                if (max >= 0) {
                    if (pos == 0 && next.indexOf(KeyComplete.codeLetters[0] < 0))
                        next.splice(0, 0, KeyComplete.codeLetters[0]); //g

                    if (KeyComplete.codeLetterCounts[max] > 1) {
                        next.push(KeyComplete.codeLetters[max]);
                    }
                    if (KeyComplete.codeLetters.length > max + 1) {
                        next.push(KeyComplete.codeLetters[max + 1]);
                    } else {
                        $.each(KeyComplete.codeEnds, function (index, value) {
                            next.push(value);
                        });
                    }
                }
                else
                    next = next.concat(KeyComplete.codeStarts);
                dropdown.show();
                shown = true;
                dropdownFilter.hide();
                dropdownHeader.html("Attribut auswählen");
                $("#keyValue" + lNr + "_filter").focus();

                $.each(next, function (index, value) {
                    let entry = value;
                    let key = "";
                    if (KeyComplete.codeBolds.indexOf(entry) >= 0 || KeyComplete.codeEnds.indexOf(entry) >= 0)
                        key = "mandatory";
                    $(dropdownTable)
                        .append(`<tr class="dropdown-row">
                                    <td class="searchLink dropdown-item ${key}"
                                        onclick="KeyComplete.selLetterItem(event,'${entry}','${lNr}',${pos});">
                                            ${entry} - ${KeyComplete.attrLabel[entry]}
                                    </td>
                                    </tr>`);
                });

            } else {
                dropdown.show();
                shown = true;
                dropdownFilter.show();
                if (isEnding) {
                    dropdownHeader.html("Key ist vollständig.");
                    dropdownFilter.hide();
                } else {
                    if (KeyComplete.canInsertCode(keyTxt, thesCode, pos)) {
                        dropdownHeader.html("Suche und Auswahl des Wertes von Attribut <b>" + thesCode + "</b>");
                        if (thesCode.length == 2)
                            thesCode = thesCode.substr(1);
                    }
                    else {
                        dropdownHeader.html("Hier gibt es nichts einzufügen.");
                        dropdownFilter.hide();
                        return;
                    }
                }

                var searchText = $("#keyValue" + lNr + "_filter").val();
                if (searchText == "-" || searchText == "")
                    searchText = null;
                $("#keyValue" + lNr + "_filter").focus();

                let autoSuggest = searchText == null ?
                    GUKey.allConcepts
                        .filter(a => a.code.charAt(0) == thesCode).sort((a, b) => { return a.label < b.label ? -1 : a.label > b.label ? 1 : 0; }) :
                    new Fuse(GUKey.allConcepts
                        .filter(a => a.code.charAt(0) == thesCode), GUKey.options).search(searchText);

                $.each(autoSuggest.slice(0, 7), function (index, value) {
                    let entry = value.typ == 'altLabel' ? '<i>' + value.label + '</i>' : value.label;
                    $(dropdownTable)
                        .append(`<tr>
                                    <td class="searchLink dropdown-item" 
                                        onclick="KeyComplete.selItem(event,'${value.code.slice(1)}','${lNr}',${pos});">
                                            ${entry}
                                    </td>
                                    </tr>`);
                });
            }
        }

        if (shown) {
            setTimeout(function () {
                dropdown[0].scrollIntoView(false);
            }, 100);
        }
    },
    selItem: function (e, code, lNr, pos) {
        //console.log(code, lNr, pos);
        let keyTxt = $('#keyValue' + lNr).text();

        if (pos >= keyTxt.length) {
            // append
            code = code + '-';
            keyTxt = (keyTxt.substr(0, pos) + code + keyTxt.substr(pos, 1000)).replace('--', '-');
        } else {
            // insert
            let thesCodeInfo = KeyComplete.getCodeFromPos(keyTxt, pos);
            let thesCode = thesCodeInfo[0];
            pos = thesCodeInfo[1];
            let endPos = thesCodeInfo[2];
            // replace, not insert
            keyTxt = (keyTxt.substr(0, pos) + code + "-" + keyTxt.substr(endPos, 1000)).replace('--', '-');
        }

        $('#keyValue' + lNr).text(keyTxt);
        GUKey.update(lNr, keyTxt);
        e.preventDefault();
        KeyComplete.ignoreClick = true;
        KeyComplete.show(KeyComplete.elem, KeyComplete.lNr, keyTxt.length);
    },
    selLetterItem: function (e, code, lNr, pos) {
        //console.log(code, lNr, pos);
        let keyTxt = $('#keyValue' + lNr).text();
        let newPos = 0;
        if (pos < keyTxt.length) {
            keyTxt = (keyTxt.substr(0, pos) + code + "-" + keyTxt.substr(pos, 100)).replace('--', '-');
            newPos = pos + code.length;
        }
        else
            keyTxt = (keyTxt.substr(0, pos) + code + keyTxt.substr(pos, 100)).replace('--', '-');
        $('#keyValue' + lNr).text(keyTxt);
        GUKey.update(lNr, keyTxt);
        e.preventDefault();
        KeyComplete.ignoreClick = true;

        if (newPos) {
            KeyComplete.setCaretPosition($('#keyValue' + lNr)[0], newPos);
            KeyComplete.show(KeyComplete.elem, KeyComplete.lNr, newPos);
        }
        else
            KeyComplete.show(KeyComplete.elem, KeyComplete.lNr, keyTxt.length);
    },
    ignoreClose: function (e) {
        e.preventDefault();
        KeyComplete.ignoreClick = true;
    },
    search: function (e) {
        KeyComplete.ignoreClick = true;
        KeyComplete.show(KeyComplete.elem, KeyComplete.lNr, KeyComplete.pos);
    },
    setCaretPosition: function (contentEditableElement, position) {
        if (document.createRange)//Firefox, Chrome, Opera, Safari, IE 9+
        {
            range = document.createRange();
            range.selectNodeContents(contentEditableElement);
            //range.collapse(true);


            range.setStart(contentEditableElement.firstChild, position);
            range.setEnd(contentEditableElement.firstChild, position)

            selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }
}