const axios = require('axios');
const { DIGITRANSIT_HSL_API } = require('../config');


const getStationCoordinates = async (id) => {
  let lat = null, lon = null;

  try {
    const query = `{ bikeRentalStation(id: "${id}") { name networks lat lon } }`;
    const apiUrl = DIGITRANSIT_HSL_API;
    const options = {
      url: apiUrl,
      method: 'post',
      data: query,
      headers: {
        'Content-Type': 'application/graphql'
      }
    };
    const result = await axios(options);
    const bikeRentalStation = result.data.data.bikeRentalStation;
    lat = bikeRentalStation.lat;
    lon = bikeRentalStation.lon;
  } catch (error) {
    console.log(error.message)
  } finally {
    return { lat, lon };
  }
};

const getReverseGeocoding = (lat, lon) =>
  `https://api.digitransit.fi/geocoding/v1/reverse?point.lat=${lat}&point.lon=${lon}&size=1&layers=address`;

const getStationAddress = async ({ lat, lon }) => {
  try {
    const url = getReverseGeocoding(lat, lon);
    const result = await axios.get(url);
    const { name, postalcode, locality: city } = result.data.features[0].properties;
    return {
      street: name,
      postalcode,
      city
    };
  } catch (error) {

  }
};


module.exports = {
  getStationCoordinates,
  getStationAddress
}
