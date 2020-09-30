function createTable() {
    $.get("https://src.cals.arizona.edu/api/v1/scrutinizer/measurements", {
        variable: "lead",
        location_type: "block_group",
        location_name: "40250015002"
    }).done((data) => {console.log(data);});

    // APIReader.getScrutinizerMeasurements()
    // APIReader.getScrutinizerMeasurements("lead", "40250015002", "block_group", "5", "0", "2010-12-30", "2011-01-02",
    //     function(data) {console.log(data); });
}

function createMap() {
    
}