var map1 = null;
var map2 = null;

$(document).ready(function() {
        map1 = createMap("map1");
        map2 = createMap("map2");
        selectHandler("variable1", "#legend1", map1);
        selectHandler("variable2", "#legend2", map2);
});

function selectHandler(id, legendId, map) {
    let idHandler = "#" + id;
    var features = null;
    $(idHandler).change(function() {
        if (features !== null) {
            map.removeLayer(features['geojson']);
            map.removeControl(features['info']);
            $(legendId).empty();
            features = null;
        }
        let value = $(idHandler + " option:selected").val();
        let location_type = "block_group";
        if (value !== 'none') {
        fetch("https://src.cals.arizona.edu/api/v1/scrutinizer/measurements?variable="
                + value + "&location_type="
                + location_type)
            .then((measurementsResponse) => measurementsResponse.json())
            .then(getMapData)
            .then(getMinMax)
            .then(createColorMapping)
            .then((createColorResponse)=>createLegend(createColorResponse, legendId))
            .then((createColorResponse)=>fillMap(createColorResponse, map))
            .then((fillMapResponse)=>{ features = fillMapResponse; })
            .catch((response) => console.log(response));
        } else {
            console.log('value is none');
        }
    });
}

function getMapData(measurementsResponse) {
    let getMapDataResponse = {};
    let data = measurementsResponse;
    let blockData = {};
    for (let i=0; i<data.length; i++) {
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
    console.log(counts);
    for (var i=0; i<colors.length; i++) {
        let div = $("<div></div>");
        div.css("width", width);
        div.css("height", convertHeight(counts[colors[i]]));
        div.css("left", width * i);
        div.css("background", colors[i]);
        div.addClass("legendDiv");
        $(legendId).append(div);
    }

    return createLegendRequest;
}

function fillMap(createColorResponse, map) {
    let data = createColorResponse['blockData'];
    console.log("max " + createColorResponse['max']);
    console.log("min " + createColorResponse['min']);
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
        this._div.innerHTML = '<h4>Data Value</h4>' +  (props ?
            '<b>' + data[props['STATE'] + props['COUNTY'] + props['TRACT']]
            : 'Hover over a tract');
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

var maps = [];

function initMap(getColor, data, mapId) {

    L.DomEvent.on(mymap, 'zoom', (event) => {
        console.log(event);
        for (var i=0; i<maps.length; i++) {
            maps[i].setView(event.target.getCenter(), event.target.getZoom());
        }

    });
    L.DomEvent.on(mymap, 'dragend', (event) => {
        console.log(event);
        for (var i=0; i<maps.length; i++) {
            maps[i].setView(event.target.getCenter(), event.target.getZoom());
        }
    });
    maps.push(mymap);
}

