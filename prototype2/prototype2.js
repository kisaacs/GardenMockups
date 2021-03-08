var map1 = null;
var map2 = null;
var dataMap = {};
var variableDesc = ['test1', 'test2'];
var variableMap = {}
var variableSourceMap = {}
var features = {};

document.addEventListener("DOMContentLoaded", function() {
        loadVariables();
        
        map1 = createMap("map1");
        map2 = createMap("map2");

        var searchBar1 = new Awesomplete(document.getElementById("searchBar1"), {
            list: variableDesc
        });
        var searchBar2 = new Awesomplete(document.getElementById("searchBar2"), {
            list: variableDesc
        });
        document.getElementById("searchBar1").addEventListener('awesomplete-selectcomplete', (event) => {
            searchHandler(event.text.value, "map1", map1, "#legend1");
        });
        document.getElementById("searchBar2").addEventListener('awesomplete-selectcomplete', (event)=>{
            searchHandler(event.text.value, "map2", map2, "#legend2");
        });
        selectHandler("variable1", "#legend1", "map1", map1);
        selectHandler("variable2", "#legend2", "map2", map2);
        downloadHandler("download1", 'map1', "variable1");
        downloadHandler("download2", 'map2', "variable2");

        document.getElementById("queryButton1").addEventListener("click", (event) => {
            document.getElementById("queryPanel").style.display = "block";
        });

        document.getElementsByClassName("close")[0].addEventListener("click", (event) => {
            // Clear the current state of the modal
            document.getElementById("queryPanel").style.display = "none";
        });

        window.addEventListener("click", (event) => {
            if (event.target == document.getElementById("queryPanel")) {
                document.getElementById("queryPanel").style.display = "none";
            }
        });

        // Implementing the chain of selectables for the query panel
        document.getElementById("lofi-groups").addEventListener('change', (event)=>{
            let lofiGroup = document.getElementById("lofi-groups");
            let key = lofiGroup.selectedOptions[0].value;
            console.log(key);
        });
});

function loadVariables() {
    fetch("https://src.cals.arizona.edu/api/v1/scrutinizer/variables")
        .then((variablesResponse) => variablesResponse.json())
        .then((variables)=>{
            for (let i=0; i<variables.length; i++) {
                let desc = variables[i]['desc'] + ' (' + variables[i]['name'] + ')';
                variableDesc.push(desc);
                variableMap[desc] = variables[i];
                if (!(variables[i]['source'] in variableSourceMap)) {
                    variableSourceMap[variables[i]['source']] = [];
                }
                variableSourceMap[variables[i]['source']].push(desc);
            }
        });
}

function searchHandler(variableName, mapId, map, legendId) {
    if (mapId in features) {
        console.log("Removing Layer Search...");
        map.removeLayer(features[mapId]['geojson']);
        map.removeControl(features[mapId]['info']);
        $(legendId).empty();
        delete features[mapId];
        delete dataMap[mapId];
    }
    let value=variableMap[variableName]['name'];
    let units=variableMap[variableName]['unit'];
    let location_type = 'block_group';
    fetchMapData(value, location_type, mapId, legendId, map, units=units);
}

function selectHandler(id, legendId, mapId, map) {
    let idHandler = "#" + id;
    $(idHandler).change(function() {
        if (mapId in features) {
            console.log("Removing Layer Select");
            map.removeLayer(features[mapId]['geojson']);
            map.removeControl(features[mapId]['info']);
            $(legendId).empty();
            delete features[mapId];
            delete dataMap[mapId];
        }
        let value = $(idHandler + " option:selected").val();
        let units = variableMap[" (" + value + ")"]['unit'];
        let location_type = "block_group";
        fetchMapData(value, location_type, mapId, legendId, map, units);
    });
}

async function fetchMeasurements(value) {
    let response = await fetch("https://src.cals.arizona.edu/api/v1/scrutinizer/measurements?variable="
         + value + "&location_type=block_group");
    response = await response.json();
    if (response.length == 0) {
        response = await fetch("https://src.cals.arizona.edu/api/v1/scrutinizer/measurements?variable="
        + value + "&location_type=census_block");
        response = await response.json();
    }
    return response;
}

function fetchMapData(value, location_type, mapId, legendId, map, units='') {
    console.log(units);
    if (value !== 'none') {
        fetchMeasurements(value)
            .then((measurementsResponse)=>{ dataMap[mapId] = measurementsResponse; return measurementsResponse; })
            .then(getMapData)
            .then(getMinMax)
            .then(createColorMapping)
            .then((createColorResponse)=>createLegend(createColorResponse, legendId))
            .then((createColorResponse)=>fillMap(createColorResponse, map, units))
            .then((fillMapResponse)=>{ features[mapId] = fillMapResponse; })
            .catch((response) => console.log(response));
        } else {
            console.log('value is none');
        }
}

function downloadHandler(downloadId, mapId, selectId) {
    $("#" + downloadId).on("click", function() {
        if (mapId in dataMap) {
            console.log("downloading data...");
            let csv = "Row,GeoId,StateFP,StateName,CountyFP,CountyName,TractCE,BlockgroupCE,Medium,Value\n";
            let data = dataMap[mapId];
            for (let i=0; i<data.length; i++) {
                let geoId = "";
                if (data[i]['location_name'][0] != '0') {
                    geoId = "0";
                }
                geoId += data[i]['location_name'];
                csv += (i+1) + ',';
                csv += '="' + geoId + '",';
                csv += '="' + geoId.slice(0,2) + '",';
                csv += '="' + fipsToState[geoId.slice(0,2)] + '",';
                csv += '="' + geoId.slice(2,5) + '",';
                csv += '="' + fipsToCounty[geoId.slice(2,5)] + '",';
                csv += '="' + geoId.slice(5,11) + '",';
                csv += '="' + geoId[11] + '",';
                csv += '="' + data[i]['medium'] + '",';
                csv += data[i]['value'] + "\n";
            }
            var hiddenElement = document.createElement('a');
            hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
            hiddenElement.target = '_blank';
            hiddenElement.download = "data.csv";
            hiddenElement.click();
        } else {
            alert("This map has no data.");
        }
    });
}

function getMapData(measurementsResponse) {
    let getMapDataResponse = {};
    let data = measurementsResponse;
    let blockData = {};
    for (let i=0; i<data.length; i++) {
        if (data[i]['location_type'] !== 'block_group') {
            continue;
        }
        let blockId = "";
        if (data[i]['location_name'][0] != '0') {
            blockId = "0";
        }
        blockId += data[i]['location_name'].slice(0, data[i]['location_name'].length - 1);
        let value = parseFloat(data[i]['value']);
        if (!(blockId in blockData)) {
            blockData[blockId] = [0, 0];
        }
        blockData[blockId][0] += value; // Current sum of values in the tract
        blockData[blockId][1] += 1;     // Current num of values in the tract

    }
    getMapDataResponse['blockData']  = blockData;
    return getMapDataResponse;
}

function getMinMax(getMapDataResponse) {
    let getMinMaxResponse = getMapDataResponse;
    let min = Number.MAX_VALUE;
    let max = Number.MIN_SAFE_INTEGER;
    for (blockId in getMapDataResponse['blockData']) {
        let avg = getMinMaxResponse['blockData'][blockId][0] / getMinMaxResponse['blockData'][blockId][1];
        if (avg < min) {
            min = avg;
        }
        if (max < avg) {
            max = avg;
        }
    }
    getMinMaxResponse['min'] = min;
    getMinMaxResponse['max'] = max;
    return getMinMaxResponse;
}

function createColorMapping(getMinMaxResponse) {
    let createColorResponse = getMinMaxResponse;
    let min = createColorResponse['min'];
    let max = createColorResponse['max'];
    let diff = max - min;
    function getColor(d) {
        return d > (min + diff * 7.0 / 8.0)  ? '#800026' :
               d > (min + diff * 6.0 / 8.0)  ? '#BD0026' :
               d > (min + diff * 5.0 / 8.0)  ? '#E31A1C' :
               d > (min + diff * 4.0 / 8.0)  ? '#FC4E2A' :
               d > (min + diff * 3.0 / 8.0)  ? '#FD8D3C' :
               d > (min + diff * 2.0 / 8.0)  ? '#FEB24C' :
               d > (min + diff * 1.0 / 8.0)  ? '#FED976' :
                                             '#FFEDA0';
    }
    createColorResponse['getColor'] = getColor;
    return createColorResponse;
}

/**
 * creates the legend for the 
 * 
 * createLegendRequest: An object containing at least the following
 *  - 'getColor': the getColor function which converts a given data value to a color
 *  - 'min': the minimum value of the data
 *  - 'max': the maximum value of the data
 *  - 'blockData': the sums and counts of the blocks
 * 
 * legendId: The id of the legend div
 */
function createLegend(createLegendRequest, legendId) {
    let legendWidth = 250;
    let legendHeight = 200;

    let colors = ['#FFEDA0', '#FED976', '#FEB24C', '#FD8D3C', '#FC4E2A', '#E31A1C', '#BD0026', '#800026'];
    let counts = {'#FFEDA0': 0, '#FED976': 0, '#FEB24C': 0, '#FD8D3C': 0, '#FC4E2A': 0, '#E31A1C': 0, '#BD0026': 0, '#800026': 0};
    let blockData = createLegendRequest['blockData'];
    let maxCount = 0;

    for (blockId in blockData) {
        let color = createLegendRequest['getColor'](blockData[blockId][0] / blockData[blockId][1]);
        counts[color] += 1;
        if (maxCount < counts[color]) {
            maxCount = counts[color];
        }
    }

    var convertHeight = (count) => (count/maxCount) * legendHeight;
    let width = (legendWidth - 20) / 8;
    // console.log(counts);
    for (var i=0; i<colors.length; i++) {
        let div = $("<div></div>");
        div.css("width", width);
        div.css("height", convertHeight(counts[colors[i]]));
        div.css("left", width * i);
        div.css("background", colors[i]);
        div.addClass("legendDiv");
        $(legendId).append(div);
    }
    let hr = $("<hr>");
    $(legendId).append(hr);

    return createLegendRequest;
}

function fillMap(createColorResponse, map, units) {
    let data = createColorResponse['blockData'];
    function parseFeature(feature) {
        // console.log(feature);
        var string = "" + feature.properties['STATE'] + feature.properties['COUNTY'] + feature.properties['TRACT'];
        if (string in createColorResponse['blockData']) {   
            let value = (createColorResponse['blockData'][string][0] / createColorResponse['blockData'][string][1]);
            return createColorResponse['getColor'](createColorResponse['blockData'][string][0] / createColorResponse['blockData'][string][1]);
        }
        return 0;
    }

    function style(feature) {
        return {
            fillColor: parseFeature(feature),
            weight: 1,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: 0.7
        };
    }

    // Adding the Data Box
    var info = L.control();

    info.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
        this.update();
        return this._div;
    };
    // method that we will use to update the control based on feature properties passed
    info.update = function (props) {
        if (props) {
            let key = props['STATE'] + props['COUNTY'] + props['TRACT'];
            this._div.innerHTML = '<h4>Data Value</h4>' +  (key in data ?
                '<b>' + data[key][0].toFixed(2) + ' ' + units
                : 'Hover over a tract');
        }
    };
    info.addTo(map);

    var geojson;
    function highlightFeature(e) {
        var layer = e.target;
    
        layer.setStyle({
            weight: 2,
            color: '#666',
            dashArray: '',
            fillOpacity: 0.7
        });
    
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
        }
        info.update(layer.feature.properties);
    }

    function resetHighlight(e) {
        geojson.resetStyle(e.target);
        info.update();
    }

    function zoomToFeature(e) {
        map.fitBounds(e.target.getBounds());
    }

    function onEachFeature(feature, layer) {
        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
            click: zoomToFeature
        });
    }

    geojson = L.geoJson(censusBlockData, {style: style, onEachFeature: onEachFeature}).addTo(map);

    return {'geojson': geojson, 'info': info} ;
}
