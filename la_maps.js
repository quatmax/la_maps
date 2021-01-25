
class Event {
    constructor(lineData) {
        this.latitude = parseFloat(lineData[0]);
        this.longitude = parseFloat(lineData[1]);
        this.name = lineData[2];
        this.label = lineData[3];
        this.start = Date.now();
        this.end = Date.now();
        this.setupStart = Date.now();
        this.setupEnd = Date.now();
        this.demandKBS = "";
        this.demandSBS = "";
        this.monumentProtection = "";
        this.billingKBS = "";
        this.billingSBS = "";
    }
};
class Events {
    constructor() {
        this.events = [];
    }
    static load(onFinished) {
        var es = new Events();
        visitSheetData("https://docs.google.com/spreadsheets/d/" + id + "/gviz/tq?tqx=out:csv", function (lineData) {
            es.events.push(new Event(lineData));
        }, function () { onFinished(es); });
    }
    sortBy(sorter) {
        var sortBy = [];
        this.events.forEach(function (value) {
            sortBy.push(value);
        });
        sortBy.sort(function (a, b) { return sorter(a, b); });
        return sortBy;
    }

    sortByStart() {
        return this.sortBy(function (a, b) {
            if (a.start() > b.start()) {
                return -1;
            }
            if (a.start() < b.start()) {
                return 1;
            }
            return 0;
        });
    }
};

function getURLSheetID() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const key = 'sheet';
    sheet = undefined;
    if (urlParams.has(key)) {
        sheet = urlParams.get(key);
    }
    return sheet;
}

// Return array of string values, or NULL if CSV string not well formed.
function CSVtoArray(text) {
    var re_valid = /^\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*(?:,\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*)*$/;
    var re_value = /(?!\s*$)\s*(?:'([^'\\]*(?:\\[\S\s][^'\\]*)*)'|"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*))\s*(?:,|$)/g;

    // Return NULL if input string is not well formed CSV string.
    if (!re_valid.test(text)) return null;

    var a = []; // Initialize array to receive values.
    text.replace(re_value, // "Walk" the string using replace with callback.
        function (m0, m1, m2, m3) {

            // Remove backslash from \' in single quoted values.
            if (m1 !== undefined) a.push(m1.replace(/\\'/g, "'"));

            // Remove backslash from \" in double quoted values.
            else if (m2 !== undefined) a.push(m2.replace(/\\"/g, '"'));
            else if (m3 !== undefined) a.push(m3);
            return ''; // Return empty string.
        });

    // Handle special case of empty last value.
    if (/,\s*$/.test(text)) a.push('');
    return a;
}

function visitSheetFile(filename, visitor) {
    var dataFile = new XMLHttpRequest();
    dataFile.open("GET", filename, true);
    dataFile.onreadystatechange = function () {
        if (dataFile.readyState === 4) {
            if (dataFile.status === 200 || dataFile.status == 0) {
                visitor(dataFile.responseText.split(/\r\n|\n/));
            }
        }
    };
    dataFile.send();
}

function visitSheetData(file, visitLine, onFinished) {
    visitSheetFile(file, function (allTextLines) {
        for (var index = 1; index < allTextLines.length; index++) {
            var line = allTextLines[index].replaceAll("'", "");
            if (line.trim().length == 0) {
                continue;
            }
            visitLine(CSVtoArray(line));
        }
        if (onFinished != undefined) {
            onFinished();
        }
    });
}

let map;
let marker;
function la_maps() {
    map = new google.maps.Map(document.getElementById("theMap"), {
        center: { lat: 48.0389, lng: 14.4197 },
        zoom: 15,
    });
    id = getURLSheetID();
    if (id == undefined) {
        return;
    }
    Events.load(function (events) {
        var select = document.getElementById('selectEvents');
        select.innerHTML = '';
        events.events.forEach(function (value, index) {
            var opt = document.createElement('option');
            opt.innerHTML = (index + 1) + '. ' + value.name + ' ' + value.label;
            opt.id = (index + 1).toString();
            select.appendChild(opt);
        });
        select.onchange = function () {
            e = events.events[ select.selectedIndex ];
            map.setCenter({ lat: e.latitude, lng: e.longitude });
            map.setZoom(23);
            if (marker != undefined) {
                marker.setMap(null);
            }
            marker = new google.maps.Marker({ position: { lat: e.latitude, lng: e.longitude }, label: e.name, map: map });
        };
    });
}
