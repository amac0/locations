// ABOUTME: Curated city lists with coordinates for the travel checklist feature.
// ABOUTME: Contains world and US/Canada lists with proximity-based visit matching.

/**
 * Haversine distance in km between two lat/lng points.
 */
export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
    * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Check which cities from a list the user has visited.
 * Uses both CSV city name matching and coordinate proximity from Timeline data.
 * @param {Array} cityList - array of city objects with name, lat, lng, radiusKm
 * @param {Array} visitRows - raw visit rows from CSV (have city field)
 * @param {Array} coords - lat/lng coordinates from Timeline.json
 * @param {Map} countryData - country visit map (unused but kept for API compat)
 * @returns {Set<string>} set of visited city names
 */
export function matchCityVisits(cityList, visitRows, coords, countryData) {
  const visitedCities = new Set();

  /* Build set of city names from CSV visit rows (case-insensitive) */
  const cityNamesFromRows = new Set();
  for (const row of visitRows) {
    if (row.city) cityNamesFromRows.add(row.city.toLowerCase());
  }

  for (const city of cityList) {
    const cityLower = city.name.toLowerCase();

    /* Match 1: direct city name match from CSV */
    if (cityNamesFromRows.has(cityLower)) {
      visitedCities.add(city.name);
      continue;
    }

    /* Match 1b: substring match (e.g., "New York" in "New York City") */
    for (const rowCity of cityNamesFromRows) {
      if (rowCity.includes(cityLower) || cityLower.includes(rowCity)) {
        visitedCities.add(city.name);
        break;
      }
    }
    if (visitedCities.has(city.name)) continue;

    /* Match 2: coordinate proximity from Timeline data */
    if (city.lat != null && city.lng != null && city.radiusKm) {
      for (const coord of coords) {
        const dist = haversineKm(coord.lat, coord.lng, city.lat, city.lng);
        if (dist <= city.radiusKm) {
          visitedCities.add(city.name);
          break;
        }
      }
    }
  }

  return visitedCities;
}

export const CITY_LISTS = {
  'top50': {
    name: "World's 50 Largest Cities",
    source: 'UN World Urbanization Prospects 2025',
    cities: [
      {name: 'Jakarta', country: 'Indonesia', lat: -6.2088, lng: 106.8456, radiusKm: 20},
      {name: 'Dhaka', country: 'Bangladesh', lat: 23.7104, lng: 90.4074, radiusKm: 20},
      {name: 'Tokyo', country: 'Japan', lat: 35.6895, lng: 139.6917, radiusKm: 20},
      {name: 'New Delhi', country: 'India', lat: 28.6139, lng: 77.209, radiusKm: 20},
      {name: 'Shanghai', country: 'China', lat: 31.2222, lng: 121.4581, radiusKm: 20},
      {name: 'Guangzhou', country: 'China', lat: 23.1291, lng: 113.2644, radiusKm: 20},
      {name: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357, radiusKm: 20},
      {name: 'Manila', country: 'Philippines', lat: 14.5995, lng: 120.9842, radiusKm: 15},
      {name: 'Kolkata', country: 'India', lat: 22.5726, lng: 88.3639, radiusKm: 15},
      {name: 'Seoul', country: 'South Korea', lat: 37.5665, lng: 126.978, radiusKm: 15},
      {name: 'Karachi', country: 'Pakistan', lat: 24.8608, lng: 67.0104, radiusKm: 15},
      {name: 'Mumbai', country: 'India', lat: 19.076, lng: 72.8777, radiusKm: 15},
      {name: 'São Paulo', country: 'Brazil', lat: -23.5505, lng: -46.6333, radiusKm: 20},
      {name: 'Bangkok', country: 'Thailand', lat: 13.7563, lng: 100.5018, radiusKm: 15},
      {name: 'Mexico City', country: 'Mexico', lat: 19.4326, lng: -99.1332, radiusKm: 20},
      {name: 'Beijing', country: 'China', lat: 39.9042, lng: 116.4074, radiusKm: 20},
      {name: 'Lahore', country: 'Pakistan', lat: 31.5497, lng: 74.3436, radiusKm: 15},
      {name: 'Istanbul', country: 'Turkey', lat: 41.0082, lng: 28.9784, radiusKm: 15},
      {name: 'Moscow', country: 'Russia', lat: 55.7558, lng: 37.6176, radiusKm: 15},
      {name: 'Ho Chi Minh City', country: 'Vietnam', lat: 10.7769, lng: 106.7009, radiusKm: 15},
      {name: 'Buenos Aires', country: 'Argentina', lat: -34.6037, lng: -58.3816, radiusKm: 20},
      {name: 'New York City', country: 'United States of America', lat: 40.7128, lng: -74.006, radiusKm: 20},
      {name: 'Shenzhen', country: 'China', lat: 22.5431, lng: 114.0579, radiusKm: 12},
      {name: 'Bengaluru', country: 'India', lat: 12.9716, lng: 77.5946, radiusKm: 12},
      {name: 'Osaka', country: 'Japan', lat: 34.6937, lng: 135.5023, radiusKm: 15},
      {name: 'Lagos', country: 'Nigeria', lat: 6.5244, lng: 3.3792, radiusKm: 15},
      {name: 'Los Angeles', country: 'United States of America', lat: 34.0522, lng: -118.2437, radiusKm: 20},
      {name: 'Luanda', country: 'Angola', lat: -8.8383, lng: 13.2344, radiusKm: 12},
      {name: 'Chennai', country: 'India', lat: 13.0827, lng: 80.2707, radiusKm: 12},
      {name: 'Kinshasa', country: 'Dem. Rep. Congo', lat: -4.3217, lng: 15.3222, radiusKm: 15},
      {name: 'Bogotá', country: 'Colombia', lat: 4.711, lng: -74.0721, radiusKm: 15},
      {name: 'Lima', country: 'Peru', lat: -12.0464, lng: -77.0428, radiusKm: 15},
      {name: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278, radiusKm: 20},
      {name: 'Patna', country: 'India', lat: 25.5941, lng: 85.1376, radiusKm: 10},
      {name: 'Rio de Janeiro', country: 'Brazil', lat: -22.9068, lng: -43.1729, radiusKm: 15},
      {name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522, radiusKm: 15},
      {name: 'Hyderabad', country: 'India', lat: 17.385, lng: 78.4867, radiusKm: 12},
      {name: 'Tehran', country: 'Iran', lat: 35.6892, lng: 51.389, radiusKm: 15},
      {name: 'Taipei', country: 'Taiwan', lat: 25.033, lng: 121.5654, radiusKm: 12},
      {name: 'Bandung', country: 'Indonesia', lat: -6.9175, lng: 107.6191, radiusKm: 10},
      {name: 'Kuala Lumpur', country: 'Malaysia', lat: 3.139, lng: 101.6869, radiusKm: 12},
      {name: 'Dar es Salaam', country: 'Tanzania', lat: -6.7924, lng: 39.2083, radiusKm: 12},
      {name: 'Suzhou', country: 'China', lat: 31.2989, lng: 120.5853, radiusKm: 12},
      {name: 'Ahmedabad', country: 'India', lat: 23.0225, lng: 72.5714, radiusKm: 12},
      {name: 'Hangzhou', country: 'China', lat: 30.2741, lng: 120.1551, radiusKm: 12},
      {name: 'Wuhan', country: 'China', lat: 30.5928, lng: 114.3055, radiusKm: 15},
      {name: 'Tianjin', country: 'China', lat: 39.3434, lng: 117.3616, radiusKm: 15},
      {name: 'Alexandria', country: 'Egypt', lat: 31.2001, lng: 29.9187, radiusKm: 12},
      {name: 'Nagoya', country: 'Japan', lat: 35.1815, lng: 136.9066, radiusKm: 12},
      {name: 'Johannesburg', country: 'South Africa', lat: -26.2041, lng: 28.0473, radiusKm: 15},
    ],
  },

  'unesco': {
    name: 'UNESCO World Heritage Cities',
    source: 'UNESCO World Heritage Centre — Historic City Centres',
    cities: [
      {name: 'Quito', country: 'Ecuador', year: 1978, lat: -0.1807, lng: -78.4678, radiusKm: 10},
      {name: 'Kraków', country: 'Poland', year: 1978, lat: 50.0647, lng: 19.945, radiusKm: 10},
      {name: 'Antigua Guatemala', country: 'Guatemala', year: 1979, lat: 14.5586, lng: -90.7295, radiusKm: 8},
      {name: 'Split', country: 'Croatia', year: 1979, lat: 43.5081, lng: 16.4402, radiusKm: 8},
      {name: 'Dubrovnik', country: 'Croatia', year: 1979, lat: 42.6507, lng: 18.0944, radiusKm: 8},
      {name: 'Damascus', country: 'Syria', year: 1979, lat: 33.5102, lng: 36.2913, radiusKm: 10},
      {name: 'Cairo', country: 'Egypt', year: 1979, lat: 30.0444, lng: 31.2357, radiusKm: 15},
      {name: 'Tunis', country: 'Tunisia', year: 1979, lat: 36.819, lng: 10.1658, radiusKm: 10},
      {name: 'Kotor', country: 'Montenegro', year: 1979, lat: 42.4247, lng: 18.7712, radiusKm: 8},
      {name: 'Ohrid', country: 'North Macedonia', year: 1979, lat: 41.1231, lng: 20.8016, radiusKm: 8},
      {name: 'Rome', country: 'Italy', year: 1980, lat: 41.9028, lng: 12.4964, radiusKm: 15},
      {name: 'Ouro Preto', country: 'Brazil', year: 1980, lat: -20.3855, lng: -43.5035, radiusKm: 8},
      {name: 'Warsaw', country: 'Poland', year: 1980, lat: 52.2297, lng: 21.0122, radiusKm: 15},
      {name: 'Valletta', country: 'Malta', year: 1980, lat: 35.8997, lng: 14.5147, radiusKm: 8},
      {name: 'Fez', country: 'Morocco', year: 1981, lat: 34.0181, lng: -5.0078, radiusKm: 10},
      {name: 'Jerusalem', country: 'Israel', year: 1981, lat: 31.7683, lng: 35.2137, radiusKm: 10},
      {name: 'Olinda', country: 'Brazil', year: 1982, lat: -8.0089, lng: -34.8553, radiusKm: 8},
      {name: 'Havana', country: 'Cuba', year: 1982, lat: 23.1136, lng: -82.3666, radiusKm: 10},
      {name: 'Berne', country: 'Switzerland', year: 1983, lat: 46.948, lng: 7.4474, radiusKm: 8},
      {name: 'Cuzco', country: 'Peru', year: 1983, lat: -13.532, lng: -71.9675, radiusKm: 8},
      {name: 'Córdoba', country: 'Spain', year: 1984, lat: 37.8882, lng: -4.7794, radiusKm: 10},
      {name: 'Cartagena', country: 'Colombia', year: 1984, lat: 10.391, lng: -75.5144, radiusKm: 8},
      {name: 'Istanbul', country: 'Turkey', year: 1985, lat: 41.0082, lng: 28.9784, radiusKm: 15},
      {name: 'Salvador de Bahia', country: 'Brazil', year: 1985, lat: -12.9714, lng: -38.5124, radiusKm: 10},
      {name: 'Quebec City', country: 'Canada', year: 1985, lat: 46.8139, lng: -71.208, radiusKm: 10},
      {name: 'Marrakesh', country: 'Morocco', year: 1985, lat: 31.6295, lng: -7.9811, radiusKm: 10},
      {name: 'Segovia', country: 'Spain', year: 1985, lat: 40.9429, lng: -4.1088, radiusKm: 8},
      {name: 'Santiago de Compostela', country: 'Spain', year: 1985, lat: 42.8782, lng: -8.5448, radiusKm: 8},
      {name: 'Ávila', country: 'Spain', year: 1985, lat: 40.6565, lng: -4.6818, radiusKm: 8},
      {name: 'Évora', country: 'Portugal', year: 1986, lat: 38.5711, lng: -7.9092, radiusKm: 8},
      {name: 'Toledo', country: 'Spain', year: 1986, lat: 39.8628, lng: -4.0273, radiusKm: 8},
      {name: 'Lübeck', country: 'Germany', year: 1987, lat: 53.8655, lng: 10.6866, radiusKm: 8},
      {name: 'Mexico City', country: 'Mexico', year: 1987, lat: 19.4326, lng: -99.1332, radiusKm: 20},
      {name: 'Oaxaca', country: 'Mexico', year: 1987, lat: 17.0732, lng: -96.7266, radiusKm: 8},
      {name: 'Puebla', country: 'Mexico', year: 1987, lat: 19.0414, lng: -98.2063, radiusKm: 10},
      {name: 'Venice', country: 'Italy', year: 1987, lat: 45.4408, lng: 12.3155, radiusKm: 10},
      {name: 'Potosí', country: 'Bolivia', year: 1987, lat: -19.5836, lng: -65.7531, radiusKm: 8},
      {name: 'Lima', country: 'Peru', year: 1988, lat: -12.0464, lng: -77.0428, radiusKm: 15},
      {name: 'Guanajuato', country: 'Mexico', year: 1988, lat: 21.019, lng: -101.2574, radiusKm: 8},
      {name: 'Strasbourg', country: 'France', year: 1988, lat: 48.5734, lng: 7.7521, radiusKm: 10},
      {name: 'Rhodes', country: 'Greece', year: 1988, lat: 36.4349, lng: 28.2176, radiusKm: 8},
      {name: 'Salamanca', country: 'Spain', year: 1988, lat: 40.9701, lng: -5.6635, radiusKm: 8},
      {name: 'Santo Domingo', country: 'Dominican Republic', year: 1990, lat: 18.4861, lng: -69.9312, radiusKm: 10},
      {name: 'Saint Petersburg', country: 'Russia', year: 1990, lat: 59.9343, lng: 30.3351, radiusKm: 15},
      {name: 'San Gimignano', country: 'Italy', year: 1990, lat: 43.4677, lng: 11.0432, radiusKm: 8},
      {name: 'Morelia', country: 'Mexico', year: 1991, lat: 19.7059, lng: -101.1949, radiusKm: 8},
      {name: 'Sucre', country: 'Bolivia', year: 1991, lat: -19.0196, lng: -65.2619, radiusKm: 8},
      {name: 'Český Krumlov', country: 'Czechia', year: 1992, lat: 48.8127, lng: 14.3175, radiusKm: 8},
      {name: 'Prague', country: 'Czechia', year: 1992, lat: 50.0755, lng: 14.4378, radiusKm: 15},
      {name: 'Telč', country: 'Czechia', year: 1992, lat: 49.1845, lng: 15.4527, radiusKm: 8},
      {name: 'Goslar', country: 'Germany', year: 1992, lat: 51.9059, lng: 10.4289, radiusKm: 8},
      {name: 'Algiers', country: 'Algeria', year: 1992, lat: 36.7538, lng: 3.0588, radiusKm: 10},
      {name: 'Bukhara', country: 'Uzbekistan', year: 1993, lat: 39.7747, lng: 64.4286, radiusKm: 8},
      {name: 'Zacatecas', country: 'Mexico', year: 1993, lat: 22.7709, lng: -102.5832, radiusKm: 8},
      {name: 'Bamberg', country: 'Germany', year: 1993, lat: 49.8988, lng: 10.9028, radiusKm: 8},
      {name: 'Vilnius', country: 'Lithuania', year: 1994, lat: 54.6872, lng: 25.2797, radiusKm: 10},
      {name: 'Safranbolu', country: 'Turkey', year: 1994, lat: 41.2539, lng: 32.6939, radiusKm: 8},
      {name: 'Luxembourg City', country: 'Luxembourg', year: 1994, lat: 49.6117, lng: 6.1319, radiusKm: 8},
      {name: 'Quedlinburg', country: 'Germany', year: 1994, lat: 51.7893, lng: 11.15, radiusKm: 8},
      {name: 'Avignon', country: 'France', year: 1995, lat: 43.9493, lng: 4.8055, radiusKm: 8},
      {name: 'Naples', country: 'Italy', year: 1995, lat: 40.8518, lng: 14.2681, radiusKm: 10},
      {name: 'Siena', country: 'Italy', year: 1995, lat: 43.3188, lng: 11.3308, radiusKm: 8},
      {name: 'Colonia del Sacramento', country: 'Uruguay', year: 1995, lat: -34.4626, lng: -57.8402, radiusKm: 8},
      {name: 'Kutná Hora', country: 'Czechia', year: 1995, lat: 49.9481, lng: 15.2684, radiusKm: 8},
      {name: 'Visby', country: 'Sweden', year: 1995, lat: 57.6389, lng: 18.2948, radiusKm: 8},
      {name: 'Luang Prabang', country: 'Laos', year: 1995, lat: 19.884, lng: 102.1347, radiusKm: 8},
      {name: 'Lunenburg', country: 'Canada', year: 1995, lat: 44.3728, lng: -64.318, radiusKm: 8},
      {name: 'Edinburgh', country: 'United Kingdom', year: 1995, lat: 55.9533, lng: -3.1883, radiusKm: 10},
      {name: 'Porto', country: 'Portugal', year: 1996, lat: 41.1579, lng: -8.6291, radiusKm: 10},
      {name: 'Pienza', country: 'Italy', year: 1996, lat: 43.0769, lng: 11.6789, radiusKm: 8},
      {name: 'Salzburg', country: 'Austria', year: 1996, lat: 47.8095, lng: 13.055, radiusKm: 8},
      {name: 'Meknes', country: 'Morocco', year: 1996, lat: 33.8935, lng: -5.5473, radiusKm: 8},
      {name: 'Querétaro', country: 'Mexico', year: 1996, lat: 20.5888, lng: -100.3899, radiusKm: 10},
      {name: 'Cuenca', country: 'Spain', year: 1996, lat: 40.0704, lng: -2.1374, radiusKm: 8},
      {name: 'Tallinn', country: 'Estonia', year: 1997, lat: 59.437, lng: 24.7536, radiusKm: 10},
      {name: 'Riga', country: 'Latvia', year: 1997, lat: 56.946, lng: 24.1059, radiusKm: 10},
      {name: 'São Luís', country: 'Brazil', year: 1997, lat: -2.5297, lng: -44.2825, radiusKm: 8},
      {name: 'Trogir', country: 'Croatia', year: 1997, lat: 43.5169, lng: 16.2511, radiusKm: 8},
      {name: 'Carcassonne', country: 'France', year: 1997, lat: 43.2130, lng: 2.3491, radiusKm: 8},
      {name: 'Lijiang', country: 'China', year: 1997, lat: 26.8721, lng: 100.2299, radiusKm: 8},
      {name: 'Ping Yao', country: 'China', year: 1997, lat: 37.1892, lng: 112.1753, radiusKm: 8},
      {name: 'Willemstad', country: 'Netherlands', year: 1997, lat: 12.1084, lng: -68.9350, radiusKm: 8},
      {name: 'Urbino', country: 'Italy', year: 1998, lat: 43.7262, lng: 12.6366, radiusKm: 8},
      {name: 'Lviv', country: 'Ukraine', year: 1998, lat: 49.8397, lng: 24.0297, radiusKm: 10},
      {name: 'Alcalá de Henares', country: 'Spain', year: 1998, lat: 40.4818, lng: -3.3636, radiusKm: 8},
      {name: 'Lyon', country: 'France', year: 1998, lat: 45.764, lng: 4.8357, radiusKm: 10},
      {name: 'Cuenca', country: 'Ecuador', year: 1999, lat: -2.9001, lng: -79.0059, radiusKm: 8},
      {name: 'Graz', country: 'Austria', year: 1999, lat: 47.0707, lng: 15.4395, radiusKm: 8},
      {name: 'Sighișoara', country: 'Romania', year: 1999, lat: 46.2197, lng: 24.7914, radiusKm: 8},
      {name: 'Diamantina', country: 'Brazil', year: 1999, lat: -18.2492, lng: -43.6035, radiusKm: 8},
      {name: 'Vigan', country: 'Philippines', year: 1999, lat: 17.5747, lng: 120.3869, radiusKm: 8},
      {name: 'Campeche', country: 'Mexico', year: 1999, lat: 19.8301, lng: -90.5349, radiusKm: 8},
      {name: 'Hoi An', country: 'Vietnam', year: 1999, lat: 15.8801, lng: 108.338, radiusKm: 8},
      {name: 'Bruges', country: 'Belgium', year: 2000, lat: 51.2093, lng: 3.2247, radiusKm: 8},
      {name: 'Arequipa', country: 'Peru', year: 2000, lat: -16.409, lng: -71.5375, radiusKm: 10},
      {name: 'Verona', country: 'Italy', year: 2000, lat: 45.4384, lng: 10.9916, radiusKm: 8},
      {name: 'Zanzibar City', country: 'Tanzania', year: 2000, lat: -6.1659, lng: 39.1989, radiusKm: 8},
      {name: 'Baku', country: 'Azerbaijan', year: 2000, lat: 40.4093, lng: 49.8671, radiusKm: 10},
      {name: 'Lamu', country: 'Kenya', year: 2001, lat: -2.2717, lng: 40.9022, radiusKm: 8},
      {name: 'Guimarães', country: 'Portugal', year: 2001, lat: 41.4425, lng: -8.2918, radiusKm: 8},
      {name: 'Vienna', country: 'Austria', year: 2001, lat: 48.2082, lng: 16.3738, radiusKm: 15},
      {name: 'Essaouira', country: 'Morocco', year: 2001, lat: 31.5085, lng: -9.7595, radiusKm: 8},
      {name: 'Acre', country: 'Israel', year: 2001, lat: 32.9272, lng: 35.0818, radiusKm: 8},
      {name: 'Stralsund', country: 'Germany', year: 2002, lat: 54.3093, lng: 13.0818, radiusKm: 8},
      {name: 'Paramaribo', country: 'Suriname', year: 2002, lat: 5.852, lng: -55.2038, radiusKm: 8},
      {name: 'Tel Aviv', country: 'Israel', year: 2003, lat: 32.0853, lng: 34.7818, radiusKm: 10},
      {name: 'Valparaíso', country: 'Chile', year: 2003, lat: -33.0472, lng: -71.6127, radiusKm: 8},
      {name: 'Berat', country: 'Albania', year: 2005, lat: 40.7058, lng: 19.9522, radiusKm: 8},
      {name: 'Cienfuegos', country: 'Cuba', year: 2005, lat: 22.1456, lng: -80.4364, radiusKm: 8},
      {name: 'Yaroslavl', country: 'Russia', year: 2005, lat: 57.6261, lng: 39.8845, radiusKm: 8},
      {name: 'Macao', country: 'China', year: 2005, lat: 22.1987, lng: 113.5439, radiusKm: 8},
      {name: 'Mostar', country: 'Bosnia and Herzegovina', year: 2005, lat: 43.3438, lng: 17.8078, radiusKm: 8},
      {name: 'Harar', country: 'Ethiopia', year: 2006, lat: 9.3105, lng: 42.1199, radiusKm: 8},
      {name: 'Regensburg', country: 'Germany', year: 2006, lat: 49.0134, lng: 12.1016, radiusKm: 8},
      {name: 'Corfu', country: 'Greece', year: 2007, lat: 39.6243, lng: 19.9217, radiusKm: 8},
      {name: 'Camagüey', country: 'Cuba', year: 2008, lat: 21.3808, lng: -77.9169, radiusKm: 8},
      {name: 'George Town', country: 'Malaysia', year: 2008, lat: 5.4141, lng: 100.3288, radiusKm: 10},
      {name: 'Melaka', country: 'Malaysia', year: 2008, lat: 2.1896, lng: 102.2501, radiusKm: 8},
      {name: 'Bridgetown', country: 'Barbados', year: 2011, lat: 13.0975, lng: -59.6167, radiusKm: 8},
      {name: 'Rabat', country: 'Morocco', year: 2012, lat: 33.9716, lng: -6.8498, radiusKm: 10},
      {name: 'Jeddah', country: 'Saudi Arabia', year: 2014, lat: 21.4858, lng: 39.1925, radiusKm: 10},
      {name: 'Ahmedabad', country: 'India', year: 2017, lat: 23.0225, lng: 72.5714, radiusKm: 10},
      {name: 'Yazd', country: 'Iran', year: 2017, lat: 31.8974, lng: 54.3678, radiusKm: 8},
      {name: 'Sheki', country: 'Azerbaijan', year: 2019, lat: 41.1919, lng: 47.1706, radiusKm: 8},
      {name: 'Odesa', country: 'Ukraine', year: 2023, lat: 46.4825, lng: 30.7233, radiusKm: 10},
      {name: 'Kuldīga', country: 'Latvia', year: 2023, lat: 56.9677, lng: 21.9687, radiusKm: 8},
    ],
  },

  'usca_top50': {
    name: 'Top 50 US/Canada Cities',
    source: 'US Census Bureau & Statistics Canada 2024-2025',
    cities: [
      {name: 'New York City', state: 'New York', country: 'United States of America', lat: 40.7128, lng: -74.006, radiusKm: 25},
      {name: 'Los Angeles', state: 'California', country: 'United States of America', lat: 34.0522, lng: -118.2437, radiusKm: 25},
      {name: 'Chicago', state: 'Illinois', country: 'United States of America', lat: 41.8781, lng: -87.6298, radiusKm: 20},
      {name: 'Dallas', state: 'Texas', country: 'United States of America', lat: 32.7767, lng: -96.797, radiusKm: 20},
      {name: 'Houston', state: 'Texas', country: 'United States of America', lat: 29.7604, lng: -95.3698, radiusKm: 25},
      {name: 'Toronto', state: 'Ontario', country: 'Canada', lat: 43.6532, lng: -79.3832, radiusKm: 20},
      {name: 'Miami', state: 'Florida', country: 'United States of America', lat: 25.7617, lng: -80.1918, radiusKm: 20},
      {name: 'Atlanta', state: 'Georgia', country: 'United States of America', lat: 33.749, lng: -84.388, radiusKm: 20},
      {name: 'Philadelphia', state: 'Pennsylvania', country: 'United States of America', lat: 39.9526, lng: -75.1652, radiusKm: 15},
      {name: 'Washington', state: 'District of Columbia', country: 'United States of America', lat: 38.9072, lng: -77.0369, radiusKm: 15},
      {name: 'Phoenix', state: 'Arizona', country: 'United States of America', lat: 33.4484, lng: -112.074, radiusKm: 20},
      {name: 'Boston', state: 'Massachusetts', country: 'United States of America', lat: 42.3601, lng: -71.0589, radiusKm: 15},
      {name: 'Montréal', state: 'Quebec', country: 'Canada', lat: 45.5017, lng: -73.5673, radiusKm: 20},
      {name: 'San Francisco', state: 'California', country: 'United States of America', lat: 37.7749, lng: -122.4194, radiusKm: 15},
      {name: 'Detroit', state: 'Michigan', country: 'United States of America', lat: 42.3314, lng: -83.0458, radiusKm: 15},
      {name: 'Seattle', state: 'Washington', country: 'United States of America', lat: 47.6062, lng: -122.3321, radiusKm: 15},
      {name: 'Minneapolis', state: 'Minnesota', country: 'United States of America', lat: 44.9778, lng: -93.265, radiusKm: 15},
      {name: 'Tampa', state: 'Florida', country: 'United States of America', lat: 27.9506, lng: -82.4572, radiusKm: 15},
      {name: 'San Diego', state: 'California', country: 'United States of America', lat: 32.7157, lng: -117.1611, radiusKm: 15},
      {name: 'Denver', state: 'Colorado', country: 'United States of America', lat: 39.7392, lng: -104.9903, radiusKm: 15},
      {name: 'Vancouver', state: 'British Columbia', country: 'Canada', lat: 49.2827, lng: -123.1207, radiusKm: 15},
      {name: 'Orlando', state: 'Florida', country: 'United States of America', lat: 28.5383, lng: -81.3792, radiusKm: 15},
      {name: 'Baltimore', state: 'Maryland', country: 'United States of America', lat: 39.2904, lng: -76.6122, radiusKm: 12},
      {name: 'Portland', state: 'Oregon', country: 'United States of America', lat: 45.5051, lng: -122.675, radiusKm: 12},
      {name: 'St. Louis', state: 'Missouri', country: 'United States of America', lat: 38.627, lng: -90.1994, radiusKm: 12},
      {name: 'Sacramento', state: 'California', country: 'United States of America', lat: 38.5816, lng: -121.4944, radiusKm: 12},
      {name: 'Austin', state: 'Texas', country: 'United States of America', lat: 30.2672, lng: -97.7431, radiusKm: 15},
      {name: 'Calgary', state: 'Alberta', country: 'Canada', lat: 51.0447, lng: -114.0719, radiusKm: 15},
      {name: 'Pittsburgh', state: 'Pennsylvania', country: 'United States of America', lat: 40.4406, lng: -79.9959, radiusKm: 12},
      {name: 'San Antonio', state: 'Texas', country: 'United States of America', lat: 29.4241, lng: -98.4936, radiusKm: 15},
      {name: 'Las Vegas', state: 'Nevada', country: 'United States of America', lat: 36.1699, lng: -115.1398, radiusKm: 15},
      {name: 'Cincinnati', state: 'Ohio', country: 'United States of America', lat: 39.1031, lng: -84.512, radiusKm: 12},
      {name: 'Kansas City', state: 'Missouri', country: 'United States of America', lat: 39.0997, lng: -94.5786, radiusKm: 12},
      {name: 'Columbus', state: 'Ohio', country: 'United States of America', lat: 39.9612, lng: -82.9988, radiusKm: 12},
      {name: 'Cleveland', state: 'Ohio', country: 'United States of America', lat: 41.4993, lng: -81.6944, radiusKm: 12},
      {name: 'Indianapolis', state: 'Indiana', country: 'United States of America', lat: 39.7684, lng: -86.1581, radiusKm: 15},
      {name: 'Edmonton', state: 'Alberta', country: 'Canada', lat: 53.5461, lng: -113.4938, radiusKm: 12},
      {name: 'Charlotte', state: 'North Carolina', country: 'United States of America', lat: 35.2271, lng: -80.8431, radiusKm: 12},
      {name: 'Nashville', state: 'Tennessee', country: 'United States of America', lat: 36.1627, lng: -86.7816, radiusKm: 12},
      {name: 'Ottawa', state: 'Ontario', country: 'Canada', lat: 45.4215, lng: -75.6972, radiusKm: 12},
      {name: 'Jacksonville', state: 'Florida', country: 'United States of America', lat: 30.3322, lng: -81.6557, radiusKm: 15},
      {name: 'Raleigh', state: 'North Carolina', country: 'United States of America', lat: 35.7796, lng: -78.6382, radiusKm: 12},
      {name: 'Louisville', state: 'Kentucky', country: 'United States of America', lat: 38.2527, lng: -85.7585, radiusKm: 12},
      {name: 'New Orleans', state: 'Louisiana', country: 'United States of America', lat: 29.9511, lng: -90.0715, radiusKm: 12},
      {name: 'Salt Lake City', state: 'Utah', country: 'United States of America', lat: 40.7608, lng: -111.891, radiusKm: 12},
      {name: 'Winnipeg', state: 'Manitoba', country: 'Canada', lat: 49.8951, lng: -97.1384, radiusKm: 12},
      {name: 'Richmond', state: 'Virginia', country: 'United States of America', lat: 37.5407, lng: -77.436, radiusKm: 10},
      {name: 'Hartford', state: 'Connecticut', country: 'United States of America', lat: 41.7637, lng: -72.6851, radiusKm: 10},
      {name: 'Milwaukee', state: 'Wisconsin', country: 'United States of America', lat: 43.0389, lng: -87.9065, radiusKm: 12},
      {name: 'Memphis', state: 'Tennessee', country: 'United States of America', lat: 35.1495, lng: -90.049, radiusKm: 12},
    ],
  },

  'usca_unesco': {
    name: 'US/Canada UNESCO Heritage Sites',
    source: 'UNESCO World Heritage Centre',
    cities: [
      {name: 'New York City', state: 'New York', country: 'United States of America', lat: 40.7128, lng: -74.006, radiusKm: 20, site: 'Statue of Liberty'},
      {name: 'Philadelphia', state: 'Pennsylvania', country: 'United States of America', lat: 39.9526, lng: -75.1652, radiusKm: 15, site: 'Independence Hall'},
      {name: 'San Antonio', state: 'Texas', country: 'United States of America', lat: 29.4241, lng: -98.4936, radiusKm: 15, site: 'San Antonio Missions'},
      {name: 'San Juan', state: 'Puerto Rico', country: 'United States of America', lat: 18.4655, lng: -66.1057, radiusKm: 10, site: 'La Fortaleza and San Juan Historic Site'},
      {name: 'Charlottesville', state: 'Virginia', country: 'United States of America', lat: 38.0293, lng: -78.4767, radiusKm: 8, site: 'Monticello and University of Virginia'},
      {name: 'Taos', state: 'New Mexico', country: 'United States of America', lat: 36.4072, lng: -105.5731, radiusKm: 8, site: 'Taos Pueblo'},
      {name: 'Chicago', state: 'Illinois', country: 'United States of America', lat: 41.8781, lng: -87.6298, radiusKm: 15, site: 'Frank Lloyd Wright Architecture'},
      {name: 'Cahokia', state: 'Illinois', country: 'United States of America', lat: 38.6531, lng: -90.0624, radiusKm: 8, site: 'Cahokia Mounds'},
      {name: 'Bethlehem', state: 'Pennsylvania', country: 'United States of America', lat: 40.6259, lng: -75.3705, radiusKm: 8, site: 'Moravian Church Settlements'},
      {name: 'Hilo', state: 'Hawaii', country: 'United States of America', lat: 19.7297, lng: -155.09, radiusKm: 10, site: 'Hawaii Volcanoes National Park'},
      {name: 'Gatlinburg', state: 'Tennessee', country: 'United States of America', lat: 35.7143, lng: -83.5102, radiusKm: 10, site: 'Great Smoky Mountains National Park'},
      {name: 'Québec City', state: 'Quebec', country: 'Canada', lat: 46.8139, lng: -71.208, radiusKm: 10, site: 'Historic District of Old Québec'},
      {name: 'Lunenburg', state: 'Nova Scotia', country: 'Canada', lat: 44.3728, lng: -64.318, radiusKm: 8, site: 'Old Town Lunenburg'},
      {name: 'Ottawa', state: 'Ontario', country: 'Canada', lat: 45.4215, lng: -75.6972, radiusKm: 12, site: 'Rideau Canal'},
      {name: 'Dawson City', state: 'Yukon Territory', country: 'Canada', lat: 64.06, lng: -139.4333, radiusKm: 8, site: "Tr'ondëk-Klondike"},
      {name: 'Grand Pré', state: 'Nova Scotia', country: 'Canada', lat: 45.1167, lng: -64.3167, radiusKm: 8, site: 'Landscape of Grand Pré'},
      {name: 'Red Bay', state: 'Newfoundland and Labrador', country: 'Canada', lat: 51.7167, lng: -56.4333, radiusKm: 8, site: 'Red Bay Basque Whaling Station'},
      {name: 'Joggins', state: 'Nova Scotia', country: 'Canada', lat: 45.6834, lng: -64.4432, radiusKm: 8, site: 'Joggins Fossil Cliffs'},
      {name: 'Carlsbad', state: 'New Mexico', country: 'United States of America', lat: 32.4207, lng: -104.2288, radiusKm: 10, site: 'Carlsbad Caverns National Park'},
      {name: 'Chillicothe', state: 'Ohio', country: 'United States of America', lat: 39.3331, lng: -82.9824, radiusKm: 8, site: 'Hopewell Ceremonial Earthworks'},
    ],
  },
};
