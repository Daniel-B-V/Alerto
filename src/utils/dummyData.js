// Dummy data for testing reports, community feed, and suspension features

export const BATANGAS_CITIES = [
  'Lipa City',
  'Batangas City',
  'Tanauan City',
  'Santo Tomas',
  'Taal',
  'Lemery',
  'Balayan',
  'Nasugbu',
  'San Juan',
  'Rosario',
  'Ibaan',
  'Mabini',
  'Bauan',
  'San Pascual',
  'Calaca'
];

// Barangays by city for realistic testing
export const CITY_BARANGAYS = {
  'Lipa City': ['Barangay 1', 'Barangay 2', 'Barangay 3', 'Barangay 4', 'Barangay 5', 'Barangay 6', 'Barangay 7', 'Barangay 8', 'Barangay 9', 'Barangay 10', 'Barangay 11', 'Barangay 12', 'Adya', 'Anilao', 'Anilao Labac', 'Antipolo Del Norte', 'Antipolo Del Sur', 'Bagong Pook', 'Balintawak', 'Banaybanay', 'Bolbok', 'Bugtong Na Pulo', 'Bulacnin', 'Bulaklakan', 'Calamias', 'Cumba', 'Dagatan', 'Duhatan', 'Halang', 'Inosluban', 'Kayumanggi', 'Latag', 'Lodlod', 'Lumbang', 'Mabini', 'Malagonlong', 'Malitlit', 'Marauoy', 'Mataas Na Lupa', 'Munting Pulo', 'Pagolingin Bata', 'Pagolingin East', 'Pagolingin West', 'Pangao', 'Pinagkawitan', 'Pinagtongulan', 'Plaridel', 'Poblacion Barangay 1', 'Poblacion Barangay 2', 'Poblacion Barangay 3', 'Poblacion Barangay 4', 'Poblacion Barangay 5', 'Poblacion Barangay 6', 'Poblacion Barangay 7', 'Poblacion Barangay 8', 'Poblacion Barangay 9', 'Poblacion Barangay 9-A', 'Poblacion Barangay 10', 'Poblacion Barangay 11', 'Poblacion Barangay 12', 'Pusil', 'Quezon', 'Rizal', 'Sabang', 'Sampaguita', 'San Benito', 'San Carlos', 'San Celestino', 'San Francisco', 'San Guillermo', 'San Jose', 'San Lucas', 'San Salvador', 'San Sebastian (Balagbag)', 'Santo Nino', 'Santo Toribio', 'Sapac', 'Sico', 'Talisay', 'Tambo', 'Tangob', 'Tanguay', 'Tibig', 'Tipacan'],
  'Batangas City': ['Alangilan', 'Balagtas', 'Balete', 'Banaba Center', 'Banaba Ibaba', 'Banaba Kanluran', 'Banaba Silangan', 'Bilogo', 'Bolbok', 'Bukal', 'Calicanto', 'Catandala', 'Cond Ibaba', 'Cond Itaas', 'Cuta', 'Dalig', 'Dela Paz', 'Dela Paz Pulot', 'Dumantay', 'Gulod Itaas', 'Gulod Labac', 'Haligue Kanluran', 'Haligue Silangan', 'Ilihan', 'Kumba', 'Kumintang Ibaba', 'Kumintang Ilaya', 'Libjo', 'Liponpon Isla Verde', 'Maapas', 'Mahabang Dahilig', 'Mahabang Parang', 'Mahacot Kanluran', 'Mahacot Silangan', 'Malalim', 'Malibayo', 'Malitam', 'Maruclap', 'Mataas Na Lupa', 'Pagkilatan', 'Paharang Kanluran', 'Paharang Silangan', 'Pallocan Kanluran', 'Pallocan Silangan', 'Pinamucan', 'Pinamucan Ibaba', 'Pinamucan Silangan', 'Plaridel', 'Poblacion', 'Pontevedra', 'Sabang', 'San Agapito Isla Verde', 'San Agustin Kanluran', 'San Agustin Silangan', 'San Andres Isla Verde', 'San Antonio Isla Verde', 'San Isidro', 'San Jose', 'San Miguel', 'San Pedro', 'Santa Clara', 'Santa Rita Aplaya', 'Santa Rita Karsada', 'Santo Domingo', 'Santo Nino', 'Simlong', 'Sirang Lupa', 'Sorosoro Ibaba', 'Sorosoro Ilaya', 'Sorosoro Karsada', 'Tabangao Aplaya', 'Tabangao Ambulong', 'Tabangao Dao', 'Talahib Pandayan', 'Talahib Payapa', 'Talumpok Kanluran', 'Talumpok Silangan', 'Tinga Itaas', 'Tinga Labac', 'Tulo', 'Wawa'],
  'Tanauan City': ['Altura Bata', 'Altura Matanda', 'Altura-South', 'Ambulong', 'Bagbag', 'Bagumbayan', 'Balele', 'Banjo East', 'Banjo Laurel', 'Banjo West', 'Bilog-Bilog', 'Boot', 'Cale', 'Darasa', 'Gonzales', 'Hidalgo', 'Janopol', 'Janopol Oriental', 'Laurel', 'Luyos', 'Mabini', 'Malaking Pulo', 'Maria Paz', 'Maugat', 'Montana', 'Natatas', 'Pagaspas', 'Pantay Matanda', 'Pantay na Matanda', 'Pantay na Munti', 'Poblacion Barangay 1', 'Poblacion Barangay 2', 'Poblacion Barangay 3', 'Poblacion Barangay 4', 'Poblacion Barangay 5', 'Poblacion Barangay 6', 'Poblacion Barangay 7', 'Sambat', 'San Jose', 'Santol', 'Sulpoc', 'Suplang', 'Talaga', 'Tinurik', 'Trapiche', 'Ulango'],
  'Santo Tomas': ['Barangay I (Poblacion)', 'Barangay II (Poblacion)', 'Barangay III (Poblacion)', 'Barangay IV (Poblacion)', 'San Agustin', 'San Antonio', 'San Bartolome', 'San Felix', 'San Fernando', 'San Francisco', 'San Isidro Norte', 'San Isidro Sur', 'San Joaquin', 'San Jose', 'San Juan', 'San Luis', 'San Miguel', 'San Pablo', 'San Pedro', 'San Rafael', 'San Roque', 'San Vicente', 'Santa Ana', 'Santa Clara', 'Santa Cruz', 'Santa Elena', 'Santa Maria', 'Santa Teresita', 'Santiago', 'Pulong Anahao', 'Pulong Balibaguhan', 'Pulong Saging', 'Pulong Santa Cruz', 'San Bartolome (Matanda)', 'Sta. Anastacia'],
  'Taal': ['Apacay', 'Balisong', 'Bolbok', 'Buli', 'Butong', 'Cawit', 'Colu', 'Cultihan', 'Gahol', 'Halang', 'Ilog', 'Ipil', 'Luntal', 'Maria Laurel', 'Poblacion Barangay 1', 'Poblacion Barangay 2', 'Poblacion Barangay 3', 'Poblacion Barangay 4', 'Poblacion Barangay 5', 'Poblacion Barangay 6', 'Poblacion Barangay 7', 'Poblacion Barangay 8', 'Poblacion Barangay 9', 'Poblacion Barangay 10', 'Poblacion Barangay 11', 'Poblacion Barangay 12', 'Poblacion Barangay 13', 'Poblacion Barangay 14', 'Poblacion Barangay 15', 'Poblacion Barangay 16', 'Poblacion Barangay 17', 'Poblacion Barangay 18', 'Quiling', 'Tierra Alta', 'Trece'],
  'Lemery': ['Anak-Dagat', 'Arumahan', 'Ayao-iyao', 'Bagong Pook', 'Bagong Sikat', 'Balanga', 'Bukal', 'Bunga', 'Cahilan I', 'Cahilan II', 'Dayapan', 'Dita', 'Gulod', 'Malinis', 'Malibu', 'Mahabang Dahilig', 'Mahayahay', 'Malaruhatan', 'Nonong Castro', 'Palanas', 'Poblacion Barangay 1', 'Poblacion Barangay 2', 'Poblacion Barangay 3', 'Poblacion Barangay 4', 'Poblacion Barangay 5', 'Rizal', 'Sambal-Ibaba', 'San Isidro', 'San Juan', 'Sangalang', 'Santo Angel', 'Talaga', 'Taliba', 'Tubigan', 'Wawa'],
  'Balayan': ['Baclaran', 'Balayagmanok', 'Barangay 1 (Poblacion)', 'Barangay 2 (Poblacion)', 'Barangay 3 (Poblacion)', 'Barangay 4 (Poblacion)', 'Barangay 5 (Poblacion)', 'Barangay 6 (Poblacion)', 'Barangay 7 (Poblacion)', 'Barangay 8 (Poblacion)', 'Barangay 9 (Poblacion)', 'Barangay 10 (Poblacion)', 'Barangay 11 (Poblacion)', 'Barangay 12 (Poblacion)', 'Caloocan', 'Calzada', 'Canda', 'Carenahan', 'Caybunga', 'Cayponce', 'Dao', 'Dilao', 'Duhatan', 'Durungao', 'Gimalas', 'Gumamela', 'Lagnas', 'Lanatan', 'Langgangan', 'Lucban Putol', 'Lucban Pook', 'Magabe', 'Malalay', 'Munting-Tubig', 'Navotas', 'Palikpikan', 'Patugo', 'Pooc', 'Sampaga', 'San Juan', 'San Piro', 'Santa Cruz', 'Santo Nino', 'Sukol', 'Taludtud', 'Tanggoy', 'Yumang'],
  'Nasugbu': ['Aga', 'Balaytigui', 'Banilad', 'Barangay 1 (Poblacion)', 'Barangay 2 (Poblacion)', 'Barangay 3 (Poblacion)', 'Barangay 4 (Poblacion)', 'Barangay 5 (Poblacion)', 'Barangay 6 (Poblacion)', 'Barangay 7 (Poblacion)', 'Barangay 8 (Poblacion)', 'Barangay 9 (Poblacion)', 'Barangay 10 (Poblacion)', 'Barangay 11 (Poblacion)', 'Barangay 12 (Poblacion)', 'Bilaran', 'Bucana', 'Bued', 'Bulihan', 'Bunducan', 'Butucan', 'Catandaan', 'Cogunan', 'Dayap', 'Kaylaway', 'Kayrilaw', 'Latag', 'Looc', 'Lumbangan', 'Malapad Na Bato', 'Mataas Na Pulo', 'Maugat', 'Munting Indan', 'Natipuan', 'Pantalan', 'Papaya', 'Putat', 'Reparo', 'Talangan', 'Tumalim', 'Utod', 'Wawa'],
  'San Juan': ['Abung', 'Barangay 1 (Poblacion)', 'Barangay 2 (Poblacion)', 'Barangay 3 (Poblacion)', 'Barangay 4 (Poblacion)', 'Barangay 5 (Poblacion)', 'Barangay 6 (Poblacion)', 'Barangay 7 (Poblacion)', 'Bataan', 'Calicanto', 'Calitcalit', 'Catmon', 'Daungan', 'Gulibay', 'Hugom', 'Imelda', 'Janaojanao', 'Laiya-Aplaya', 'Laiya-Ibabao', 'Lapolapo', 'Libato', 'Lipahan', 'Maysusuran', 'Muzon', 'Pao', 'Pinagbayanan', 'Putingbuhangin', 'Quipot', 'Sampiro', 'San Roque', 'Sapangan', 'Subukin', 'Talahiban', 'Tayuman'],
  'Rosario': ['Alupay', 'Antipolo', 'Bagong Pook', 'Balibago', 'Bayawang', 'Bulihan', 'Caingin', 'Diliman I', 'Diliman II', 'Lagalag', 'Lumbangan', 'Mabunga', 'Maguihan', 'Malusak', 'Natu', 'Naunong Silangan', 'Navotas', 'Palma', 'Pinagdilawan', 'Pinagtung-Ulan', 'Poblacion', 'Pook I', 'Putingkahoy', 'San Carlos', 'San Ignacio', 'San Isidro', 'San Jose', 'San Roque', 'Talaga', 'Tiquiwan'],
  'Ibaan': ['Bago', 'Balanga', 'Bungahan', 'Calamias', 'Coliat', 'Dayapan', 'Lapu-lapu', 'Lucsuhin', 'Mabalor', 'Malainin', 'Matala', 'Munting-Tubig', 'Palindan', 'Pangao', 'Panghayaan', 'Poblacion', 'Sabang', 'Salaban I', 'Salaban II', 'Salaban III', 'San Agustin', 'Sandalan', 'Santo Nino', 'Talaibon', 'Tulay na Patpat'],
  'Mabini': ['Anilao East', 'Anilao Proper', 'Bagalangit', 'Balagasan', 'Balibago', 'Bulacan', 'Calamias', 'Dalahican', 'Estrella', 'Gasang', 'Laurel', 'Ligaya', 'Mainaga', 'Mainit', 'Majuben', 'Malimatoc I', 'Malimatoc II', 'Nag-Iba', 'Pilahan', 'Poblacion', 'Pulang Lupa', 'Pulong Anahao', 'Pulong Balibaguhan', 'Pulong Niogan', 'Saguing', 'San Francisco', 'San Jose', 'San Juan', 'San Luis', 'San Pedro', 'San Teodoro', 'Santa Ana', 'Santa Fe', 'Santa Teresa'],
  'Bauan': ['Alagao', 'Aplaya', 'As-Is', 'Baguilawa', 'Balayong', 'Balitoc', 'Barangay 1', 'Barangay 2', 'Barangay 3', 'Barangay 4', 'Barangay 5', 'Barangay 6', 'Barangay 7', 'Barangay 8', 'Barangay 9', 'Barangay 10', 'Barangay 11', 'Barangay 12', 'Bolo', 'Colvo', 'Cupang', 'Dalig', 'Dalig Bucana', 'Durungao', 'Gulibay', 'Inicbulan', 'Locloc', 'Locloc Tuyo', 'Magalang-Sarile', 'Malindig', 'Manghinao', 'Manalupa', 'Munlawin', 'Nag-Iba I', 'Nag-Iba II', 'New Danglayan', 'Old Danglayan', 'Orense', 'Pitugo', 'Rizal', 'Sala', 'San Agustin', 'San Andres Proper', 'San Antonio', 'San Diego', 'San Miguel', 'San Pablo', 'San Pedro', 'San Roque', 'San Teodoro', 'Santa Maria', 'Sinala', 'Sinisian East', 'Sinisian West', 'Sotero Nuesa'],
  'San Pascual': ['Alalum', 'Antipolo', 'Balimbing', 'Banaba', 'Barangay 1 (Poblacion)', 'Barangay 2 (Poblacion)', 'Barangay 3 (Poblacion)', 'Barangay 4 (Poblacion)', 'Barangay 5 (Poblacion)', 'Bayanan', 'Danglayan I', 'Danglayan II', 'Del Pilar', 'Gelerang Kawayan', 'Immaculada Concepcion', 'Kaingin', 'Laurel', 'Lumbangan', 'Malaking Pook', 'Manggahan', 'Natunuan', 'Palsahingin', 'Pili', 'Pook ni Banal', 'Resplandor', 'Sambat', 'San Antonio', 'San Mariano', 'San Miguel', 'San Roque', 'Santa Elena', 'Santa Matilde', 'Santo Nino'],
  'Calaca': ['Bagong Tubig', 'Balimbing', 'Barangay 1 (Poblacion)', 'Barangay 2 (Poblacion)', 'Barangay 3 (Poblacion)', 'Barangay 4 (Poblacion)', 'Barangay 5 (Poblacion)', 'Barangay 6 (Poblacion)', 'Bisaya', 'Cahil', 'Caluangan', 'Camastilisan', 'Coral ni Lopez', 'Dacanlao', 'Dila', 'Loma', 'Lumbang Calzada', 'Lumbang na Bata', 'Lumbang na Matanda', 'Maigsing Dahilig', 'Malapad na Parang', 'Matuklok', 'Munting Coral', 'Nag-Iba', 'Pantay', 'Puting Bato East', 'Puting Bato West', 'Quisumbing', 'San Rafael', 'Salong', 'Sinisian', 'Taklang Anak', 'Talisay', 'Tamayo']
};

export const REPORT_CATEGORIES = [
  { value: 'flooding', label: 'Flooding' },
  { value: 'heavy_rain', label: 'Heavy Rain' },
  { value: 'strong_wind', label: 'Strong Wind/Storm' },
  { value: 'typhoon', label: 'Typhoon' },
  { value: 'road_blockage', label: 'Road Blockage' },
  { value: 'power_outage', label: 'Power Outage' },
  { value: 'infrastructure_damage', label: 'Infrastructure Damage' },
  { value: 'landslide', label: 'Landslide' },
  { value: 'other', label: 'Other' }
];

export const SAMPLE_USERS = [
  { name: 'Juan Dela Cruz', email: 'juan@example.com', role: 'user' },
  { name: 'Maria Santos', email: 'maria@example.com', role: 'user' },
  { name: 'Pedro Reyes', email: 'pedro@example.com', role: 'user' },
  { name: 'Ana Garcia', email: 'ana@example.com', role: 'user' },
  { name: 'Carlos Mendoza', email: 'carlos@example.com', role: 'user' },
  { name: 'Isabel Ramos', email: 'isabel@example.com', role: 'user' },
  { name: 'Miguel Torres', email: 'miguel@example.com', role: 'user' },
  { name: 'Sofia Villanueva', email: 'sofia@example.com', role: 'user' },
  { name: 'Diego Aquino', email: 'diego@example.com', role: 'user' },
  { name: 'Carmen Lopez', email: 'carmen@example.com', role: 'user' }
];

export const SAMPLE_TITLES = {
  flooding: [
    'Severe Flooding on Main Road',
    'Flash Flood in Residential Area',
    'Market Area Flooding - Roads Impassable',
    'Highway Flooding - Vehicles Stranded',
    'Emergency: Severe Waterlogging'
  ],
  heavy_rain: [
    'Non-Stop Heavy Rain for 3 Hours',
    'Intense Rainfall - Poor Visibility',
    'Continuous Heavy Rain Since Morning',
    'Extreme Rainfall with Thunder',
    'Heavy Downpour - Streets Flooding'
  ],
  strong_wind: [
    'Strong Winds Damaging Roofs',
    'Storm-Force Winds - Property Damage',
    'Trees Uprooted - Road Blocked',
    'Severe Wind Damage to Infrastructure',
    'Dangerous Wind Conditions - Flying Debris'
  ],
  typhoon: [
    'Typhoon Alert - Strong Winds and Rain',
    'Severe Typhoon Impact',
    'Typhoon Emergency Situation',
    'Typhoon Causing Massive Destruction',
    'Direct Typhoon Hit - Severe Damage'
  ],
  road_blockage: [
    'Fallen Tree Blocking Highway',
    'Landslide Debris - Road Impassable',
    'Large Rocks on Road',
    'Road Blocked by Flood Debris',
    'Major Road Obstruction'
  ],
  power_outage: [
    'Complete Power Outage',
    'Widespread Blackout - Storm Damage',
    'Power Lines Down',
    'Total Power Failure',
    'Extensive Power Outage'
  ],
  infrastructure_damage: [
    'Bridge Severely Damaged',
    'Building Wall Collapsed',
    'Major Road Damage',
    'School Building Damaged',
    'Community Center Structural Damage'
  ],
  landslide: [
    'Active Landslide on Mountain Road',
    'Mudslide Blocking Route',
    'Massive Landslide Near Homes',
    'Hillside Collapse',
    'Critical Landslide - Evacuations Needed'
  ]
};

export const SAMPLE_DESCRIPTIONS = {
  flooding: [
    'Severe flooding on main road, knee-deep water. Unable to pass through.',
    'Flash flood in our barangay, several houses affected. Water rising quickly.',
    'Heavy flooding near the market area. Roads completely impassable.',
    'Waist-deep flood on the highway. Many vehicles stranded.',
    'Severe waterlogging in residential area. Need immediate assistance.'
  ],
  heavy_rain: [
    'Non-stop heavy rain for 3 hours. Very strong downpour.',
    'Intense rainfall causing poor visibility. Dangerous driving conditions.',
    'Continuous heavy rain since early morning. No signs of stopping.',
    'Extremely heavy rain with thunder and lightning. Power flickering.',
    'Heavy downpour affecting the entire area. Streets beginning to flood.'
  ],
  strong_wind: [
    'Very strong winds damaging roofs and trees. Several branches falling.',
    'Storm-force winds causing property damage. Unsafe to go outside.',
    'Strong gusts of wind, several trees uprooted blocking the road.',
    'Severe wind damage to infrastructure. Power lines down in some areas.',
    'Dangerous wind conditions. Flying debris reported in the area.'
  ],
  typhoon: [
    'Typhoon conditions observed. Very strong winds and heavy rain.',
    'Severe typhoon impact. Multiple houses damaged, flooding widespread.',
    'Typhoon-force winds and torrential rain. Emergency situation.',
    'Typhoon causing massive destruction. Trees down, power out.',
    'Direct typhoon hit. Severe damage to buildings and infrastructure.'
  ],
  road_blockage: [
    'Fallen tree blocking main highway. Complete road closure.',
    'Landslide debris blocking the road. Impassable to all vehicles.',
    'Large rocks on road from nearby cliff. Very dangerous conditions.',
    'Road completely blocked by flood debris and fallen trees.',
    'Major road obstruction due to collapsed structure. Seek alternate route.'
  ],
  power_outage: [
    'Complete power outage in our barangay. Affecting hundreds of homes.',
    'Widespread blackout due to storm damage. Transformer exploded.',
    'Power lines down on the street. No electricity for 5+ hours.',
    'Total power failure in the area. Emergency lights needed.',
    'Extensive power outage affecting the entire subdivision.'
  ],
  infrastructure_damage: [
    'Bridge severely damaged and unstable. Do not attempt to cross.',
    'Building wall collapsed onto the street. Very dangerous area.',
    'Major road damage with large cracks and potholes. Unsafe for vehicles.',
    'School building damaged by strong winds. Roof partially collapsed.',
    'Community center sustained severe structural damage. Avoid the area.'
  ],
  landslide: [
    'Active landslide on mountain road. Extremely dangerous!',
    'Mudslide blocking evacuation route. Need immediate help.',
    'Massive landslide near residential area. Several houses at risk.',
    'Hillside collapse due to heavy rain. Road completely buried.',
    'Critical landslide situation. Evacuations may be necessary.'
  ]
};

// Number of available images per category
const CATEGORY_IMAGE_COUNTS = {
  flooding: 8,
  heavy_rain: 8,
  strong_wind: 7,
  landslide: 6,
  power_outage: 7,
  road_blockage: 6,
  infrastructure_damage: 6,
  typhoon: 8,
  other: 3
};

// Generate category-based image URLs for reports
const generateCategoryImages = (category, count = 2) => {
  const images = [];
  const maxAvailable = CATEGORY_IMAGE_COUNTS[category] || 3;
  const numImages = Math.min(count, maxAvailable);

  // Generate random image indices without repetition
  const availableIndices = Array.from({ length: maxAvailable }, (_, i) => i + 1);
  const selectedIndices = [];

  for (let i = 0; i < numImages; i++) {
    const randomIndex = Math.floor(Math.random() * availableIndices.length);
    selectedIndices.push(availableIndices[randomIndex]);
    availableIndices.splice(randomIndex, 1);
  }

  // Add image URLs
  selectedIndices.forEach(idx => {
    images.push(`/assets/reports/${category}/${category}-${idx}.jpg`);
  });

  return images;
};

// Generate reports for a specific city with high concentration (for testing suspension)
export const generateHighDensityReports = (city, count = 45) => {
  const reports = [];
  const now = new Date();

  // Get barangays for this city
  const cityBarangays = CITY_BARANGAYS[city] || ['Poblacion', 'Barangay 1', 'Barangay 2', 'Barangay 3'];

  const categories = [
    { type: 'flooding', count: 12, severity: 'critical' },
    { type: 'flooding', count: 18, severity: 'high' },
    { type: 'heavy_rain', count: 8, severity: 'high' },
    { type: 'strong_wind', count: 5, severity: 'medium' },
    { type: 'road_blockage', count: 2, severity: 'medium' }
  ];

  let reportId = 1;

  categories.forEach(({ type, count: catCount, severity }) => {
    for (let i = 0; i < catCount; i++) {
      const user = SAMPLE_USERS[Math.floor(Math.random() * SAMPLE_USERS.length)];
      const descriptions = SAMPLE_DESCRIPTIONS[type] || SAMPLE_DESCRIPTIONS.flooding;
      const description = descriptions[Math.floor(Math.random() * descriptions.length)];

      // Select a random title from SAMPLE_TITLES
      const titles = SAMPLE_TITLES[type] || ['Untitled Report'];
      const title = titles[Math.floor(Math.random() * titles.length)];

      // Random barangay from city
      const barangay = cityBarangays[Math.floor(Math.random() * cityBarangays.length)];

      // Random time within last 6 hours
      const minutesAgo = Math.floor(Math.random() * 360);
      const createdAt = new Date(now.getTime() - minutesAgo * 60000);

      // Some reports are verified (about 70% for high density areas)
      const isVerified = Math.random() < 0.7;

      reports.push({
        id: `report_${city.replace(/\s/g, '_').toLowerCase()}_${reportId++}`,
        category: type,
        severity: severity,
        title: title,
        description: description,
        location: {
          city: city,
          barangay: barangay,
          province: 'Batangas',
          country: 'Philippines',
          coordinates: {
            lat: 13.9411 + (Math.random() - 0.5) * 0.1,
            lng: 121.1650 + (Math.random() - 0.5) * 0.1
          }
        },
        userName: user.name,
        userEmail: user.email,
        createdAt: { seconds: Math.floor(createdAt.getTime() / 1000), nanoseconds: 0 },
        status: 'verified', // All reports auto-verified by AI
        verifiedBy: 'AI (Gemini)',
        verifiedAt: { seconds: Math.floor((createdAt.getTime() + 1000) / 1000), nanoseconds: 0 }, // Verified shortly after creation
        images: generateCategoryImages(type, Math.floor(Math.random() * 5) + 1) // 1-5 images per report
      });
    }
  });

  return reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

// Generate scattered reports for other cities (lower density)
export const generateScatteredReports = (cities, totalCount = 30) => {
  const reports = [];
  const now = new Date();

  // Severity levels for scattered reports
  const severityLevels = ['low', 'medium', 'medium', 'high', 'critical'];

  for (let i = 0; i < totalCount; i++) {
    const city = cities[Math.floor(Math.random() * cities.length)];
    const user = SAMPLE_USERS[Math.floor(Math.random() * SAMPLE_USERS.length)];
    const category = REPORT_CATEGORIES[Math.floor(Math.random() * REPORT_CATEGORIES.length)];

    // Get barangays for this city
    const cityBarangays = CITY_BARANGAYS[city] || ['Poblacion', 'Barangay 1', 'Barangay 2', 'Barangay 3'];
    const barangay = cityBarangays[Math.floor(Math.random() * cityBarangays.length)];

    const descriptions = SAMPLE_DESCRIPTIONS[category.value] || SAMPLE_DESCRIPTIONS.flooding;
    const description = descriptions[Math.floor(Math.random() * descriptions.length)];

    // Select a random title from SAMPLE_TITLES
    const titles = SAMPLE_TITLES[category.value] || ['Untitled Report'];
    const title = titles[Math.floor(Math.random() * titles.length)];

    // Random severity
    const severity = severityLevels[Math.floor(Math.random() * severityLevels.length)];

    // Random time within last 24 hours
    const minutesAgo = Math.floor(Math.random() * 1440);
    const createdAt = new Date(now.getTime() - minutesAgo * 60000);

    // Lower verification rate for scattered reports (about 30%)
    const isVerified = Math.random() < 0.3;

    reports.push({
      id: `report_${city.replace(/\s/g, '_').toLowerCase()}_${i + 1}`,
      category: category.value,
      severity: severity,
      title: title,
      description: description,
      location: {
        city: city,
        barangay: barangay,
        province: 'Batangas',
        country: 'Philippines',
        coordinates: {
          lat: 13.7565 + (Math.random() - 0.5) * 0.5,
          lng: 121.0583 + (Math.random() - 0.5) * 0.5
        }
      },
      userName: user.name,
      userEmail: user.email,
      createdAt: { seconds: Math.floor(createdAt.getTime() / 1000), nanoseconds: 0 },
      status: 'verified', // All reports auto-verified by AI
      verifiedBy: 'AI (Gemini)',
      verifiedAt: { seconds: Math.floor((createdAt.getTime() + 1000) / 1000), nanoseconds: 0 }, // Verified shortly after creation
      images: generateCategoryImages(category.value, Math.floor(Math.random() * 5) + 1) // 1-5 images per report
    });
  }

  return reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

// Main function to generate all dummy data
export const generateAllDummyData = () => {
  // Generate high-density reports for Lipa City (should trigger suspension recommendation)
  const lipaReports = generateHighDensityReports('Lipa City', 45);

  // Generate moderate reports for Batangas City
  const batangasReports = generateHighDensityReports('Batangas City', 18);

  // Generate scattered reports for other cities
  const otherCities = BATANGAS_CITIES.filter(c => c !== 'Lipa City' && c !== 'Batangas City');
  const scatteredReports = generateScatteredReports(otherCities, 35);

  return [...lipaReports, ...batangasReports, ...scatteredReports];
};

// Export function to get specific test scenarios
export const getTestScenarios = () => {
  return {
    // Scenario 1: High confidence, should recommend suspension
    // Multiple cities with high report density
    highConfidence: [
      ...generateHighDensityReports('Lipa City', 45),
      ...generateHighDensityReports('Batangas City', 28),
      ...generateHighDensityReports('Tanauan City', 22),
      ...generateScatteredReports(['Santo Tomas', 'Rosario', 'Ibaan', 'Taal'], 15)
    ],

    // Scenario 2: Medium confidence, borderline case
    mediumConfidence: generateHighDensityReports('Tanauan City', 15),

    // Scenario 3: Low confidence, scattered reports across more cities
    lowConfidence: generateScatteredReports(['Mabini', 'San Juan', 'Balayan', 'Lemery', 'Nasugbu', 'Bauan', 'San Pascual', 'Calaca'], 12),

    // Scenario 4: All test data combined
    fullDataset: generateAllDummyData()
  };
};
