let LANG_en = {
	'NODATA': 'No Data Present.',
	'SEARCH': 'Search',
	'NAME_TABLE_LABEL': 'Name',
	'DESC_TABLE_LABEL': 'Desc',
	'LOCATIONTYPE_TABLE_LABEL': 'Location Type',
	'LOCATION_TABLE_LABEL': 'Location',
	'VALUE_TABLE_LABEL': 'Value',
	'DOWNLOAD_DATA': 'DOWNLOAD DATA',
	'DATA_VALUE': 'Data Value',
	'HOVER_TRACT': 'Hover over a tract',
	'HIDE': 'Hide',
	'SHOW': 'Show',
	'LINK': 'Link',
	'UNLINK': 'Unlink',
	'TITLE': 'Arizona Map',// The last three are used in index.html
	'VARIABLE_SEARCH': 'Variable Search: ',
	'Download_Data': 'Download Data'
};
class Model {
    constructor() {
		this.LANG = LANG_en;//Should be some mechanism to set this
        this.variableMap = {};
        this.variableDesc = [];
        this.originalDataLists = {};
        this.blockDataLists = {};
        this.tractDataMaps = {};
        this.geojsonInstances = {};
		this.mapCount = 2; // Number of active maps
		this.isLinked = false; // Whether the map views are currently linked
		// Whether you are setting the map's zoom via code
		this.isSetByCode = false; // This should toggle to determine if an event is triggered by the map or by the code
    }

    /**
     * Getter functions for the various data types in each map
     */
    getVariables() {
        return this.variableDesc;
    }

    getDataComponents() {
        return this.dataComponents;
    }

    getUnits(variableName) {
        return this.variableMap[variableName]['unit'];
    }

    getOriginalData(key) {
        if (key in this.originalDataLists)
            return this.originalDataLists[key];
        return [];
    }

    getBlockData(key) {
        if (key in this.blockDataLists)
            return this.blockDataLists[key];
        return [];
    }

    getTractData(key) {
        if (key in this.tractDataMaps)
            return this.tractDataMaps[key];
        console.log("Tract data key " + key + " not found");
        return {};
    }

    getColorMapping(colors, key) {
        let minmax = this._getMinMax(key);
        let min = minmax[0];
        let max = minmax[1];
        let diff = max - min;
        return function (d) {
            return (d < max) ? colors[Math.floor((d - min) * 8.0 / diff)] : colors[colors.length - 1];
        }
    }

    getGeoJson(key) {
        if (key in this.geojsonInstances) {
            return this.geojsonInstances[key];
        }
        return null;
    } 

    setGeoJson(key, geojson) {
        this.geojsonInstances[key] = geojson;
    }

    removeData(key) {
        delete this.originalDataLists[key];
        delete this.blockDataLists[key];
        delete this.tractDataMaps[key];
        delete this.geojsonInstances[key];
    }

    /**
     * Return an array of colors that represent different level in the map/legend based on
     * the darkest and lightest color
     * @param {*} minColor
     * @param {*} maxColor
     */
    interpolate(minColor, maxColor) {
        var colorInterpolator = d3.interpolateRgb(minColor, maxColor);
        var steps = 8;
        var colors = d3.range(0, (1 + 1 / steps), 1 / (steps - 1)).map(function (d) {
            return colorInterpolator(d)
        });
        return colors;
    }

    /**
     * Fetches the scrutinizer variable metadata and stores it in the variableDesc and variableMap
     * variables.
     * variableDesc is a list in this format for each variable: description (name)
     * variableMap has each value of variableDesc as a key mapped to the metadata pulled from the
     * scrutinizer
     */
    async fetchVariables() {
        const response = await fetch("https://src.cals.arizona.edu/api/v1/scrutinizer/variables");
        const variables = await response.json();
        for (let i=0; i<variables.length; i++) {
            let desc = variables[i]['desc'] + ' (' + variables[i]['name'] + ')';
            this.variableDesc.push(desc);
            this.variableMap[desc] = variables[i];
        }
    }

    /**
     * Fetches the scrutinizer data for the specified variable. The data is stored in the
     *  originalDataLists, tractDataMaps, and blockDataLists variables under the specified
     *  key.
     * @param {} key The key that will be used to store the fetched data
     * @param {*} variableName The name of the variable that will be fetched 
     */
    async fetchData(key, variableName) {
        let variable = this.variableMap[variableName]['name'];
        const response = await fetch("https://src.cals.arizona.edu/api/v1/scrutinizer/measurements?variable=" + variable);
        const data = await response.json();
        this.originalDataLists[key] = data;
        await this._createBlockData(key, data);
        await this._createTractDataMap(key, data);     
    }

    /**
     * Fills the blockDataLists variable under the specified key with the specified data. Each object in
     * the data list should have at least the 'location_type' and 'location_name' specifiers.
     * @param {*} key 
     * @param {*} data 
     */
    async _createBlockData(key, data) {
        let blockData = [];
        for (let i=0; i<data.length; i++) {
            if (data[i]['location_type'] === 'block_group' || data[i]['location_type'] === 'census_block') {
                if (data[i]['location_name'][0] !== '0') {
                    data[i]['location_name'] = '0' + data[i]['location_name'];
                }
                blockData.push(data[i]);
            } else if (data[i]['location_type'] === 'centroid' || data[i]['location_type'] === 'point') {
                // Below is code for converting the point and centroid latitude and longitutde data into 
                // block data. As it stands, fetching to do all of these conversion is too time intensive

                // let newData = JSON.parse(JSON.stringify(data[i]));
                // newData['location_type'] = 'block_group';
                // let coord = data[i]['location_name'].split(",");
                // await fetch("https://geo.fcc.gov/api/census/area?lat=" + coord[0] + "&lon=" + coord[1])
                //     .then((response) => response.json())
                //     .then((response) => {
                //         let value = response['results'][0]['block_fips'];
                //         value = value.slice(0, 12);
                //         newData['location_name'] = value;
                //         blockData.push(newData);
                //     });
            }
        }
        this.blockDataLists[key] = blockData;
    }

    /**
     * Fills the tractDataMaps variable under the specified key with the specified data. Each object
     * in the data list should have at least the 'location_name' and 'location_type' specifiers
     * @param {} key 
     */
    async _createTractDataMap(key, data) {
        if (!(key in this.blockDataLists)) {
            console.log("Error in getBlockDataMap, " + key + " is not present.");
            return -1;
        }
        let tractData = {};
        for (let i=0; i<data.length; i++) {
            if (data[i]['location_type'] === 'block_group' || data[i]['location_type'] === 'census_block') {
                let tractId = data[i]['location_name'].slice(0, 11); // Organized as tracts, not block groups
                let value = parseFloat(data[i]['value']);
                if (!(tractId in tractData)) {
                    tractData[tractId] = [0, 0];
                }
                tractData[tractId][0] += value; // Current sum of values in the tract
                tractData[tractId][1] += 1;     // Current num of values in the tract
            }
    
        }
        this.tractDataMaps[key] = tractData;
    }

    /**
     * Gets the minimum and maximum data values from the tractMap under the specified key.
     * @param {*} key 
     */
    _getMinMax(key) {
        if (!(key in this.tractDataMaps)) {
            return [-1, -1];
        }
        let min = Number.MAX_VALUE;
        let max = Number.MIN_SAFE_INTEGER;
        let tractMap = this.tractDataMaps[key];
        for (var tractId in tractMap) {
            let avg = tractMap[tractId][0] / tractMap[tractId][1];
            if (avg < min) {
                min = avg;
            }
            if (max < avg) {
                max = avg;
            }
        }
        return [min, max];
    }
}