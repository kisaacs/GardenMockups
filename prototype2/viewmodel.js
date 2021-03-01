class ViewModel {
    constructor() {
        this.model = new Model();
        try {
            this.model.fetchVariables();
        } catch (error) {
            console.log("Error Requesting variables from scrutinizer");
            console.log(error);
            alert("Variables Were Not Loaded from Scrutinizer");
        }
    }

    createMap(mapId) {
        let mymap = L.map(mapId).setView([34.0489, -112.0937], 7);
    
        L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            maxZoom: 18,
            id: 'mapbox/streets-v11',
            tileSize: 512,
            zoomOffset: -1,
            accessToken: 'pk.eyJ1IjoiYmxhcmEiLCJhIjoiY2tnNzFrNmo2MDMweDJ5cW0zaXJwbWQ1ZyJ9.WydwzOibe0497pQbasuF-A'
        }).addTo(mymap);
        return mymap;
    }

    createInfoBox(map) {
        // Adding the Data Box
        var info = L.control();
        // info.addTo(map);
        info.onAdd = function (map) {
            this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
            this.update();
            return this._div;
        };
        info.update = function(props) { this._div.innerHTML = '<h4>No Data Present.</h4>'; }
        info.addTo(map);
        return info;
    }

    createSearchBar(searchBar) {
        new Awesomplete(searchBar, {
            list: model.getVariables()
        });
    }

    downloadBlockData(key) {

    }

    populateLegend(key, legend) {

    }

    populateMap(key, map, infoBox, variableName) {
        try {
            this.model.fetchData(key, variableName);
        } catch(error) {
            console.log("Could not load " + variableName + " data from scrutinizer");
            return -1;
        }
        let colorMapping = model.getColorMapping(key);
        let blockData = model.getBlockData(key);
        let parseFeature = this._parseFeature(blockData, colorMapping);
        let style = this._style(parseFeature);
        infoBox.update = this._update(blockData);
        let highlightFeature = this._highlightFeature(infoBox);
        var geojson;
        let resetHighlight = function(e) {
            geojson.resetStyle(e.target);
            info.update();
        }
        let zoomToFeature = this._zoomToFeature(map);
        let onEachFeature = this._onEachFeature(highlightFeature, resetHighlight, zoomToFeature);
        geojson = L.geoJson(censusBlockData, {style: style, onEachFeature: onEachFeature}).addTo(map);
        model.setGeoJson(key, geojson);
        return 1;
    }

    _parseFeature(blockData, colorMapping) {
        return function(feature) {
            let string = "" + feature.properties['STATE'] + feature.properties['COUNTY'] + feature.properties['TRACT']; 
            if (string in blockData) {   
                let value = (blockData[string][0] / blockData[string][1]);
                return colorMapping(blockData[string][0] / blockData[string][1]);
            }
            return 0;
        }
    }

    _style(parseFeature) {
        return function(feature) {
            return {
                fillColor: parseFeature(feature),
                weight: 1,
                opacity: 1,
                color: 'white',
                dashArray: '3',
                fillOpacity: 0.7
            };
        }
    }

    _update(blockData) {
        return function (props) {
            if (props) {
                let key = props['STATE'] + props['COUNTY'] + props['TRACT'];
                this._div.innerHTML = '<h4>Data Value</h4>' +  (key in blockData ?
                    '<b>' + blockData[key][0].toFixed(2) + ' ' + model.getUnits(variableName)
                    : 'Hover over a tract');
            }
        };
    }
    
    _highlightFeature(infoBox) {
        return function(e) {
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
            infoBox.update(layer.feature.properties);
        }
    }

    _zoomToFeature(map) {
        return function (e) {
            map.fitBounds(e.target.getBounds());
        }
    }

    _onEachFeature(highlightFeature, resetHighlight, zoomToFeature) {
        return function (feature, layer) {
            layer.on({
                mouseover: highlightFeature,
                mouseout: resetHighlight,
                click: zoomToFeature
            });
        }
    }
}