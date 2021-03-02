var map1 = null;
var map2 = null;
var infoBox1 = null;
var infoBox2 = null;
var viewModel = null;

document.addEventListener("DOMContentLoaded", function() {
        viewModel = new ViewModel();
        map1 = viewModel.createMap("map1");
        map2 = viewModel.createMap("map2");
        infoBox1 = viewModel.createInfoBox(map1);
        infoBox2 = viewModel.createInfoBox(map2);
        viewModel.createSearchBar(document.getElementById("searchBar1"));
        viewModel.createSearchBar(document.getElementById("searchBar2"));

        // View UI Listeners
        document.getElementById("searchBar1").addEventListener('awesomplete-selectcomplete', (event) => {
            viewModel.populateMap("map1", map1, infoBox1, event.text.value);
            viewModel.populateLegend("map1", document.getElementById("legend1"));
        });
        document.getElementById("searchBar2").addEventListener('awesomplete-selectcomplete', (event)=>{
            viewModel.populateMap("map2", map2, infoBox2, event.text.value);
            viewModel.populateLegend("map2", document.getElementById("legend2"));
        });
        document.getElementById("variable1").addEventListener('change', (event) => {
            console.log(event);
            let sel = document.getElementById('variable1');
            let variableName = ' (' + sel.options[sel.selectedIndex].text + ')';
            viewModel.populateMap("map1", map1, infoBox1, variableName).then((status) => 
                viewModel.populateLegend("map1", document.getElementById("legend1")));
        });
        document.getElementById("variable2").addEventListener('change', (event) => {
            let sel = document.getElementById('variable2');
            let variableName = ' (' + sel.options[sel.selectedIndex].text + ')';
            viewModel.populateMap("map2", map2, infoBox2, variableName);
            viewModel.populateLegend("map2", document.getElementById("legend2"));
        });
        document.getElementById("download1").addEventListener('click', () => {
            viewModel.downloadBlockData("map1");
        });
        document.getElementById("download2").addEventListener('click', () => {
            viewModel.downloadBlockData("map2");
        });
});
