$(document).ready(function() {
        initTable();
        // initMap();
});


function initMap() {
    var mymap = L.map('mymap').setView([51.505, -0.09], 13);
}

function initTable() {
    $("#submit").on('click', function() {
        $("#table").empty();
        $("#table").append("<thead><tr id='head'></tr></thead>");
        params = {};

        if ($("#variable option:selected").text().length > 0) {
            params['variable'] = $("#variable option:selected").text();
        } else {
            let col = $("<th></th>").text("Variable");
            col.addClass("th-sm");
            $("#head").append(col);
        }
        let col = $("<th></th>").text("Value");
        col.addClass("th-sm");
        $("#head").append(col);

        if ($("#start_date").val().length > 0) {
            params['start_date'] = $("#start_date").val();
        }
        if ($("#end_date").val().length > 0) {
            params['end_date'] = $("#end_date").val();
        }
        if ($("#min_val").val().length > 0) {
            params['min_val'] = $("#min_val").val();
        } 
        if ($("#max_val").val().length > 0) {
            params['max_val'] = $("#max_val").val();
        }
        if ($("#location_name").val().length > 0) {
            params['location_name'] = $("#location_name").val();
        } else {
            let col = $("<th></th>").text("Location Name");
            col.addClass("th-sm");
            $("#head").append(col);
        }
        if ($("#location_type").val().length > 0) {
            params['location_type'] = $("#location_type").val();
        } else {
            let col = $("<th></th>").text("Location Type");
            col.addClass("th-sm");
            $("#head").append(col);
        }
        
        col = $("<th></th>").text("Collected On");
        col.addClass("th-sm");
        $("#head").append(col);
        

        createTable(params);
    });
}


// Example Defaults:
// Location Name: 040019426001
function createTable(params) {
    $.get("https://src.cals.arizona.edu/api/v1/scrutinizer/measurements", params)
        .done((data) => {
            console.log(data);
            // var total = Math.min(50, data.length)
            var body = $("<tbody></tbody>");
            for (var i=0; i<data.length; i++) {
                var row = $("<tr></tr>");
                
                if (!('variable' in params)) {
                    row.append($("<td></td>").text(data[i]['variable_name']));
                }
                row.append($("<td></td>").text(data[i]['value']));
                if (!('location_name' in params)) 
                    row.append($("<td></td>").text(data[i]['location_name']));
                if (!('location_type' in params))
                    row.append($("<td></td>").text(data[i]['location_type']));
                row.append($("<td></td>").text(data[i]['collected_on']));
                body.append(row);
            }
            $("#table").append(body);
            $("#table").DataTable();
            $('.dataTables_length').addClass('bs-select');
        });

    // APIReader.getScrutinizerMeasurements()
    // APIReader.getScrutinizerMeasurements("lead", "40250015002", "block_group", "5", "0", "2010-12-30", "2011-01-02",
    //     function(data) {console.log(data); });
}

function createMap() {

}