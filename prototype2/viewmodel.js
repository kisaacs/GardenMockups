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
            list: this.model.getVariables()
        });
    }


    downloadBlockData(key) {
        let data = this.model.getBlockData(key);
        if (data.length === 0) {
            alert(key + " has no data to download.");
        }
        let csv = "Row,GeoId,StateFP,StateName,CountyFP,CountyName,TractCE,BlockgroupCE,Medium,Value\n";
        for (let i=0; i<data.length; i++) {
            let geoId = data[i]['location_name'];
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
        hiddenElement.download = key + ".csv";
        hiddenElement.click();
    }

    populateLegend(key, legend) {
        let legendWidth = 250;
        let legendHeight = 200;
        let colors = ['#FFEDA0', '#FED976', '#FEB24C', '#FD8D3C', '#FC4E2A', '#E31A1C', '#BD0026', '#800026'];
        let counts = {'#FFEDA0': 0, '#FED976': 0, '#FEB24C': 0, '#FD8D3C': 0, '#FC4E2A': 0, '#E31A1C': 0, '#BD0026': 0, '#800026': 0};
        let tractData = this.model.getTractData();
        console.log(tractData);
        let colorMapping = this.model.getColorMapping(key);
        let maxCount = 0;
    
        for (tractId in tractData) {
            let color = colorMapping(tractData[tractId][0] / tractData[tractId][1]);
            counts[color] += 1;
            if (maxCount < counts[color])
                maxCount = counts[color];
        }
    
        var convertHeight = (count) => (count/maxCount) * legendHeight;
        let width = (legendWidth - 20) / 8;
        for (var i=0; i<colors.length; i++) {
            let div = document.createElement("div");
            div.style.width = width;
            div.style.height = convertHeight(counts[colors[i]]);
            div.style.left = width * i;
            div.style.background = colors[i];
            div.className = "legendDiv";
            legend.appendChild(div);
        }
        let hr = document.createElement("hr");
        legend.appendChild(hr);
    }

    async populateMap(key, map, infoBox, variableName) {
        try {
            await this.model.fetchData(key, variableName).then((response) => {
                let colorMapping = this.model.getColorMapping(key);
                let tractData = this.model.getTractData(key);
                // console.log(tractData);
                let parseFeature = this._parseFeature(tractData, colorMapping);
                let style = this._style(parseFeature);
                infoBox.update = this._update(tractData, variableName);
                let highlightFeature = this._highlightFeature(infoBox);
                var geojson;
                let resetHighlight = function(e) {
                    geojson.resetStyle(e.target);
                    infoBox.update();
                }
                let zoomToFeature = this._zoomToFeature(map);
                let onEachFeature = this._onEachFeature(highlightFeature, resetHighlight, zoomToFeature);
                geojson = L.geoJson(censusBlockData, {style: style, onEachFeature: onEachFeature}).addTo(map);
                this.model.setGeoJson(key, geojson);
                return 1;
        });
            
        } catch(error) {
            console.log("Could not load " + variableName + " data from scrutinizer");
            return -1;
        }
    }

    _parseFeature(tractData, colorMapping) {
        return function(feature) {
            let string = "" + feature.properties['STATE'] + feature.properties['COUNTY'] + feature.properties['TRACT']; 
            if (string in tractData) {
                return colorMapping(tractData[string][0] / tractData[string][1]);
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

    _update(tractData, variableName) {
        return function (props) {
            if (props) {
                let key = props['STATE'] + props['COUNTY'] + props['TRACT'];
                this._div.innerHTML = '<h4>Data Value</h4>' +  (key in tractData ?
                    '<b>' + tractData[key][0].toFixed(2) + ' ' + this.model.getUnits(variableName)
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