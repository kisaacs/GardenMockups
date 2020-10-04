$(document).ready(function() {
    

    $("#submit").on('click', function() {
        params = {};

        if ($("#variable option:selected").text().length > 0) {
            params['variable'] = $("#variable option:selected").text();
        } else {
            let col = $("<th></th>").text("Variable");
            col.addClass("th-sm");
            $("#head").append(col);
        }
        if ($("#start_date").text().length > 0) {
            params['start_date'] = $("#start_date").text();
        } else {
            let col = $("<th></th>").text("Start Date");
            col.addClass("th-sm");
            $("#head").append(col);
        }
        if ($("#end_date").text().length > 0) {
            params['end_date'] = $("#end_date").text();
        } else {
            let col = $("<th></th>").text("End Date");
            col.addClass("th-sm");
            $("#head").append(col);
        }
        if ($("#min_val").text().length > 0) {
            params['min_val'] = $("#min_val").text();
        } 
        if ($("#max_val").text().length > 0) {
            params['max_val'] = $("#max_val").text();
        }
        $("#table").DataTable();
        createTable(params);
    });
});

function createTable(params) {
    $.get("https://src.cals.arizona.edu/api/v1/scrutinizer/measurements", params)
        .done((data) => {
            console.log(data);
        });

    // APIReader.getScrutinizerMeasurements()
    // APIReader.getScrutinizerMeasurements("lead", "40250015002", "block_group", "5", "0", "2010-12-30", "2011-01-02",
    //     function(data) {console.log(data); });
}

function createMap() {

}