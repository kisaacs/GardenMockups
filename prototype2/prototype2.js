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
