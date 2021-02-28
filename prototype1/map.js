$(document).ready(function() {
        var variable = "chromium";
        var location_type = "block_group";
        var mapId = "mymap";
        getData(variable, location_type, mapId);
        variable = "arsenic";
        mapId = "mymap2";
        getData(variable, location_type, mapId);

        var partitions = [0, 0.5, 1, 2, 3, 4, 5];
        var colors = ['#FFEDA0', '#FED976', '#FEB24C', '#FD8D3C', '#FC4E2A', '#E31A1C', '#BD0026', '#800026'];
    
        var legend = $("#legend");
        legend.append("<div style='display: inline-block; height: 49.5px'><div style='background: "
            + colors[0] + "; width: 35px; height: 35px;'></div></div>");
    
        for (var i=1; i<colors.length; i++) {
            legend.append("<div style='display: inline-block'><div style='background: "
                + colors[i] +
                "; width: 35px; height: 35px;'></div><div>"
                + partitions[i-1] +
                "</div></div>");
        }
});

var maps = [];

function getData(variable, location_type, mapId) {
    var params = {
        "variable": variable,
        "location_type": location_type
    }

    
    $.get("https://src.cals.arizona.edu/api/v1/scrutinizer/measurements", params)
        .done((data) => {
            console.log(data[0]);
            if (mapId === "mymap") {
                $("#container").prepend("<h1>" + variable + "</h1>");
            } else {
                $("#container2").prepend("<h1>" + variable + "</h1>");
            }
            var min = Number.MAX_VALUE;
            var max = Number.MIN_VALUE;
            var map = {};
            for (var i=0; i<data.length; i++) {
                var block_id = "";
                if (data[i]['location_name'][0] != '0') {
                    block_id = "0";
                }
                block_id += data[i]['location_name'].slice(0, data[i]['location_name'].length-1);
                var value = parseFloat(data[i]['value']);
                map[block_id] = value;
                if (value < min) {
                    min = value;
                }
                if (max < value) {
                    max = value;
                }
            }

            // Create style function based on min and max
            var diff = max - min;
            function getColor(d) {
                return d > 5  ? '#800026' :
                       d > 4 ? '#BD0026' :
                       d > 3 ? '#E31A1C' :
                       d > 2  ? '#FC4E2A' :
                       d > 1   ? '#FD8D3C' :
                       d > .5  ? '#FEB24C' :
                       d > 0   ? '#FED976' :
                                  '#FFEDA0';
            }
            console.log(map);
            initMap(getColor, map, mapId);
            
        });
}

function initMap(getColor, data, mapId) {
    function parseFeature(feature) {
        // console.log(feature);
        var string = "" + feature.properties['STATE'] + feature.properties['COUNTY'] + feature.properties['TRACT'];
        if (string in data) {
            
            return getColor(data[string]);
        }
        return getColor(0);
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
    var mymap = L.map(mapId).setView([34.0489, -112.0937], 7);
    L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYmxhcmEiLCJhIjoiY2tnNzFrNmo2MDMweDJ5cW0zaXJwbWQ1ZyJ9.WydwzOibe0497pQbasuF-A', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox/streets-v11',
        tileSize: 512,
        zoomOffset: -1,
        accessToken: 'your.mapbox.access.token'
    }).addTo(mymap);

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
    info.addTo(mymap);

    // Adding some interactive components
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
        mymap.fitBounds(e.target.getBounds());
    }

    function onEachFeature(feature, layer) {
        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
            click: zoomToFeature
        });
    }

    geojson = L.geoJson(censusBlockData, {style: style, onEachFeature: onEachFeature}).addTo(mymap);

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

