var map1 = null;
var map2 = null;
var infoBox1 = null;
var infoBox2 = null;
var ViewModel = null;

document.addEventListener("DOMContentLoaded", function() {
        ViewModel = new ViewModel();
        map1 = ViewModel.createMap("map1");
        map2 = ViewModel.createMap("map2");
        infoBox1 = ViewModel.createInfoBox(map1);
        infoBox2 = ViewModel.createInfoBox(map2);
        ViewModel.createSearchBar(document.getElementById("searchBar1"));
        ViewModel.createSearchBar(document.getElementById("searchBar2"));

        // View UI Listeners
        document.getElementById("searchBar1").addEventListener('awesomplete-selectcomplete', (event) => {
            ViewModel.populateMap("map1", map1, infoBox1, event.text.value);
            ViewModel.populateLegend("map1", document.getElementById("legend1"));
        });
        document.getElementById("searchBar2").addEventListener('awesomplete-selectcomplete', (event)=>{
            ViewModel.populateMap("map2", map2, infoBox2, event.text.value);
            ViewModel.populateLegend("map2", document.getElementById("legend2"));
        });
        document.getElementById("variable1").addEventListener('change', (event) => {
            console.log(event);
            let sel = document.getElementById('variable1');
            let variableName = sel.options[sel.selectedIndex].text;
            ViewModel.populateMap("map1", map1, infoBox1, variableName);
            ViewModel.populateLegend("map1", document.getElementById("legend1"));
        });
        document.getElementById("variable2").addEventListener('change', (event) => {
            let sel = document.getElementById('variable2');
            let variableName = sel.options[sel.selectedIndex].text;
            ViewModel.populateMap("map2", map2, infoBox2, variableName);
            ViewModel.populateLegend("map2", document.getElementById("legend2"));
        });
        document.getElementById("download1").addEventListener('click', () => {
            ViewModel.downloadBlockData("map1");
        });
        document.getElementById("download2").addEventListener('click', () => {
            ViewModel.downloadBlockData("map2");
        });
});

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
