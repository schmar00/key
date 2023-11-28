//onLoad website
document.addEventListener("DOMContentLoaded", function (event) {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    if (urlParams.has('lang')) {
        GUKey.USER_LANG = urlParams.get('lang');
    }

    $("#addRowBtn").click(function () {
        let l = GUKey.addNewRow(1);
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
        let row = 0;
        let delim = "\t";
        switch ($("#csvDelimiter").val()) {
            case "comma": delim = ",";
                break;
            case "semi": delim = ";";
                break;
        }
        $("tr").each(function (index) {
            let line = [];
            $(this).children().each(function (index) {
                if (index > 0) {
                    let s = (index > 2 || row == 0 ? $(this).text() : $(this).find(".value").text());
                    if (!s) s = "";
                    s = s.replace(' ⇅', '').replace(/\n/g, '').replace(/  /g, '');
                    line.push(s);
                }
            });
            csvText += line.join(delim) + '\n';
            row++;
        });
        GUKey.exportCSV(csvText);
    });

    GUKey.init();
    KeyComplete.init();
});