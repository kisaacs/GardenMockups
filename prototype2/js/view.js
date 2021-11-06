var map1 = null;
var map2 = null;
var table1 = null;
var table2 = null;
var infoBox1 = null;
var infoBox2 = null;
var viewModel = null;


/*
* Constructs a new query string from the current state of the page
* Maps in the default state and english language options are ignored
* This should potentially be in the model, but it needs to reference
*   the map objects which only exist in the view
*/
let constructQueryString = function(){
	var queryString = "?";
	let started = false;
	if(viewModel.model.LANG.LangId!='en'){
		started=true;
		queryString += "lang="+viewModel.model.LANG.LangId;
	}
	if(viewModel.model.hasChanged[0]){
		if(started){
			queryString+="&";
		}
		started=true;
		queryString+="lat1="+map1.getCenter()["lat"]+
					 "&lng1="+map1.getCenter()["lng"]+
					 "&zoom1="+map1.getZoom();
	}
	if(viewModel.model.hasChanged[1]){
		if(started){
			queryString+="&";
		}
		started=true;
		queryString+="lat2="+map2.getCenter()["lat"]+
					 "&lng2="+map2.getCenter()["lng"]+
					 "&zoom2="+map2.getZoom();
	}
	if(viewModel.selectedData["map1"]!=""){
		if(started){
			queryString+="&";
		}
		started=true;
		queryString+="map1="+viewModel.selectedData["map1"];
	}
	if(viewModel.selectedData["map2"]!=""){
		if(started){
			queryString+="&";
		}
		started=true;
		queryString+="map2="+viewModel.selectedData["map2"];
	}
	if(!started){
		return "";
	}
	return queryString;
}

document.addEventListener("DOMContentLoaded", function() {
	viewModel = new ViewModel();
	map1 = viewModel.createMap("map1");
	map2 = viewModel.createMap("map2");
	infoBox1 = viewModel.createInfoBox(map1);
	infoBox2 = viewModel.createInfoBox(map2);
	viewModel.createSearchBar(document.getElementById("searchBar1"));
	viewModel.createSearchBar(document.getElementById("searchBar2"));
	table1 = viewModel.createTable("table1", "table1Div");
	table2 = viewModel.createTable("table2", "table2Div");
	
	// View UI Listeners
	document.getElementById("searchBar1").addEventListener('keyup', function (event) {
		if (event.keyCode === 13) {
			event.preventDefault();
			document.getElementById("search1").click();
		}
	});
	document.getElementById("search1").addEventListener('click', (event) => {
		var var1 = document.getElementById("searchBar1").value;
		if (var1 != "") {
			viewModel.changeToLoad(document.getElementById("search1"));
			viewModel.populateMap("map1", map1, infoBox1, var1).then((status) =>
				viewModel.changeBack(document.getElementById("search1"))|
				viewModel.populateLegend("map1", document.getElementById("legend1"))).then((status) =>
					viewModel.populateTable("map1", table1));
		} 
	});
	document.getElementById("searchBar2").addEventListener('keyup', function (event) {
		if (event.keyCode === 13) {
			event.preventDefault();
			document.getElementById("search2").click();
		}
	});
   document.getElementById("search2").addEventListener('click', (event) => {
		var var2 = document.getElementById("searchBar2").value;
	   if (var2 != "") {
		   viewModel.changeToLoad(document.getElementById("search2"));
		   viewModel.populateMap("map2", map2, infoBox2, var2).then((status) =>
			   viewModel.changeBack(document.getElementById("search2")) |
			   viewModel.populateLegend("map2", document.getElementById("legend2"))).then((status) =>
				   viewModel.populateTable("map2", table2));
	   }
	});
	
	for(const el of document.getElementsByClassName("DownloadButton")){
		el.addEventListener('click', (event) => {
			if(event.target.parentNode.parentNode.id=="left"){
				viewModel.downloadData(1);
			} else {
				viewModel.downloadData(2);
			}
		});
	}
	document.getElementById("downloadTable1").addEventListener('click', () => {
		viewModel.downloadTableData("map1");
	});
	document.getElementById("downloadTable2").addEventListener('click', () => {
		viewModel.downloadTableData("map2");
	});
	
	for( const el of document.getElementsByClassName("ShareButton")){
		el.addEventListener('click', (event) => {
			navigator.clipboard.writeText(window.location.href.split('?')[0]+constructQueryString());
		});
	}
	
	for( const el of document.getElementsByClassName("TableButton")){
		el.addEventListener('click', (event) => {
			if(event.target.parentNode.parentNode.id=="left"){
				viewModel.toggleView(1,1);
			} else {
				viewModel.toggleView(2,1);
			}
			map1.invalidateSize();
			map2.invalidateSize();
		});
	}
	
	for( const el of document.getElementsByClassName("LocButton")){
		el.addEventListener('click', (event) => {
			if(event.target.parentNode.parentNode.id=="left"){
				viewModel.toggleView(1,0);
			} else {
				viewModel.toggleView(2,0);
			}
			map1.invalidateSize();
			map2.invalidateSize();
		});
	}
	
	for( const el of document.getElementsByClassName("GraphButton")){
		el.addEventListener('click', (event) => {
			if(event.target.parentNode.parentNode.id=="left"){
				viewModel.toggleView(1,2);
			} else {
				viewModel.toggleView(2,2);
			}
			map1.invalidateSize();
			map2.invalidateSize();
		});
	}
	
	for( const el of document.getElementsByClassName("selectButton")){
		el.addEventListener('click', (event) => {
			if(event.target.parentNode.parentNode.id=="left"){
				viewModel.openQueryPanel(1);
			} else {
				viewModel.openQueryPanel(2);
			}
			map1.invalidateSize();
			map2.invalidateSize();
		});
	}
	
	for( const el of document.getElementsByClassName("XButton")){
		el.addEventListener('click', (event) => {
			if(event.target.parentNode.parentNode.id=="left"){
				viewModel.closeQueryPanel(1);
			} else {
				viewModel.closeQueryPanel(2);
			}
			map1.invalidateSize();
			map2.invalidateSize();
		});
	}

	document.getElementById("rightMapArrow").addEventListener('click', (event) => {
		console.log("clicked right map arrow");
		viewModel.toggleMap(2);
		map1.invalidateSize();
		map2.invalidateSize();
	});
	
	document.getElementById("leftMapArrow").addEventListener('click', (event) => {
		console.log("clicked left map arrow");
		viewModel.toggleMap(1);
		map1.invalidateSize();
		map2.invalidateSize();
	});
	
	
	document.getElementById("linkMapButton").addEventListener('click', (event) => {
		viewModel.toggleSync();
		viewModel.toggleValue(event.target, viewModel.model.LANG.LINK, viewModel.model.LANG.UNLINK);
	});
	
	map1.addEventListener('moveend', () => {
		viewModel.model.hasChanged[0] = true;
		if(viewModel.model.isLinked){
			viewModel.model.hasChanged[1] = true;
		}
		viewModel.syncMaps(map2,map1);
	});
	
	map2.addEventListener('moveend', () => {
		viewModel.model.hasChanged[1] = true;
		if(viewModel.model.isLinked){
			viewModel.model.hasChanged[0] = true;
		}
		viewModel.syncMaps(map1,map2);
	});
	
	window.addEventListener('resize', () => {
		viewModel.resize();
	});
	
	let langSelector = document.getElementById("langSelect");

	for(var opt of Object.values(viewModel.model.LANGS)) {
		var el = document.createElement("option");
		el.textContent = opt.LangName;
		el.setAttribute('data-LangId',opt.LangId);
		langSelector.appendChild(el);
	}
	if("lang" in viewModel.queryFlags){
		for(var i=0;i<langSelector.options.length;i++){
			if(langSelector.options[i].getAttribute('data-LangId')==viewModel.queryFlags["lang"]){
				langSelector.selectedIndex=i;
				break;
			}
		}
	}
	langSelector.addEventListener('change',(e) => {
		viewModel.model.LANG = viewModel.model.LANGS[e.target.options[e.target.selectedIndex].getAttribute('data-LangId')];
		window.location.href=window.location.href.split('?')[0]+constructQueryString();
	});
	
	{// Edit plain text in index.html fields
		for(s of document.getElementsByClassName("variable_search")){
			s.innerHTML = viewModel.model.LANG.VARIABLE_SEARCH;
		}
		document.getElementById("search1").innerHTML = viewModel.model.LANG.SEARCH;
		document.getElementById("search2").innerHTML = viewModel.model.LANG.SEARCH;
		document.getElementById("download1").innerHTML = viewModel.model.LANG.Download_Data;
		document.getElementById("download2").innerHTML = viewModel.model.LANG.Download_Data;
		document.title = viewModel.model.LANG.TITLE;
	}
	
	// I need to access the tables, but I'm not sure if I can directly edit any of that code, so this is going here temporarily
	{
		// Make table wrappers sizeable
		let tableWrappers = document.getElementsByClassName("dataTables_wrapper");
		for(var i=0;i<tableWrappers.length;i++){
			tableWrappers[i].classList.add("sizeable");
		}
	}

	viewModel.resize();
	map1.invalidateSize();
	map2.invalidateSize();
	viewModel.model.hasChanged=[false,false];
	if("lat1" in viewModel.queryFlags && "lng1" in viewModel.queryFlags && "zoom1" in viewModel.queryFlags){
		viewModel.model.hasChanged[0] = true;
		map1.setView({lat: viewModel.queryFlags["lat1"], lng: viewModel.queryFlags["lng1"]},viewModel.queryFlags["zoom1"]);
	}
	if("lat2" in viewModel.queryFlags && "lng2" in viewModel.queryFlags && "zoom2" in viewModel.queryFlags){
		viewModel.model.hasChanged[1] = true;
		map2.setView({lat: viewModel.queryFlags["lat2"], lng: viewModel.queryFlags["lng2"]},viewModel.queryFlags["zoom2"]);
	}
	// initial background DB query
	viewModel.fetchVariable("map1", " (cadmium)");
	document.getElementById('tempElement').addEventListener('fetched',(event) => { // This fires once variables are fetched in viewModel constructor
		console.log("Data successfully fetched");
		if("map1" in viewModel.queryFlags){// need to wait until fetch variables is done
			document.getElementById("searchBar1").value = viewModel.queryFlags["map1"];
			viewModel.changeToLoad(document.getElementById("search1"));
			viewModel.populateMap("map1", map1, infoBox1, viewModel.queryFlags["map1"]).then((status) =>
				viewModel.changeBack(document.getElementById("search1"))|
				viewModel.populateLegend("map1", document.getElementById("legend1"))).then((status) =>
				viewModel.populateTable("map1", table1));
		}
		if("map2" in viewModel.queryFlags){
			document.getElementById("searchBar2").value = viewModel.queryFlags["map2"];
			viewModel.changeToLoad(document.getElementById("search2"));
			viewModel.populateMap("map2", map2, infoBox2, viewModel.queryFlags["map2"]).then((status) =>
				viewModel.changeBack(document.getElementById("search2"))|
				viewModel.populateLegend("map2", document.getElementById("legend2"))).then((status) =>
				viewModel.populateTable("map2", table2));
		}
	});
});
