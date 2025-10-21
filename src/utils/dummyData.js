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

// Generate reports for a specific city with high concentration (for testing suspension)
export const generateHighDensityReports = (city, count = 45) => {
  const reports = [];
  const now = new Date();

  const categories = [
    { type: 'flooding', severity: 'critical', count: 12 },
    { type: 'flooding', severity: 'high', count: 18 },
    { type: 'heavy_rain', severity: 'high', count: 8 },
    { type: 'strong_wind', severity: 'medium', count: 5 },
    { type: 'road_blockage', severity: 'high', count: 2 }
  ];

  let reportId = 1;

  categories.forEach(({ type, severity, count: catCount }) => {
    for (let i = 0; i < catCount; i++) {
      const user = SAMPLE_USERS[Math.floor(Math.random() * SAMPLE_USERS.length)];
      const descriptions = SAMPLE_DESCRIPTIONS[type] || SAMPLE_DESCRIPTIONS.flooding;
      const description = descriptions[Math.floor(Math.random() * descriptions.length)];

      // Random time within last 6 hours
      const minutesAgo = Math.floor(Math.random() * 360);
      const createdAt = new Date(now.getTime() - minutesAgo * 60000);

      // Some reports are verified (about 70% for high density areas)
      const isVerified = Math.random() < 0.7;

      reports.push({
        id: `report_${city.replace(/\s/g, '_').toLowerCase()}_${reportId++}`,
        category: type,
        severity: severity,
        description: description,
        city: city,
        userName: user.name,
        userEmail: user.email,
        createdAt: createdAt.toISOString(),
        verified: isVerified,
        verifiedBy: isVerified ? 'Admin' : null,
        verifiedAt: isVerified ? new Date(createdAt.getTime() + 1800000).toISOString() : null,
        imageCount: Math.floor(Math.random() * 4),
        aiAnalysis: {
          confidence: severity === 'critical' ? 85 + Math.floor(Math.random() * 15) : 70 + Math.floor(Math.random() * 20),
          assessment: generateAIAssessment(type, severity, true)
        }
      });
    }
  });

  return reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

// Generate scattered reports for other cities (lower density)
export const generateScatteredReports = (cities, totalCount = 30) => {
  const reports = [];
  const now = new Date();

  for (let i = 0; i < totalCount; i++) {
    const city = cities[Math.floor(Math.random() * cities.length)];
    const user = SAMPLE_USERS[Math.floor(Math.random() * SAMPLE_USERS.length)];
    const category = REPORT_CATEGORIES[Math.floor(Math.random() * REPORT_CATEGORIES.length)];
    const severities = ['low', 'medium', 'high', 'critical'];
    const weights = [0.3, 0.4, 0.2, 0.1]; // More low/medium, fewer critical

    const random = Math.random();
    let severity = 'low';
    let cumulative = 0;
    for (let j = 0; j < weights.length; j++) {
      cumulative += weights[j];
      if (random <= cumulative) {
        severity = severities[j];
        break;
      }
    }

    const descriptions = SAMPLE_DESCRIPTIONS[category.value] || SAMPLE_DESCRIPTIONS.flooding;
    const description = descriptions[Math.floor(Math.random() * descriptions.length)];

    // Random time within last 24 hours
    const minutesAgo = Math.floor(Math.random() * 1440);
    const createdAt = new Date(now.getTime() - minutesAgo * 60000);

    // Lower verification rate for scattered reports (about 30%)
    const isVerified = Math.random() < 0.3;

    reports.push({
      id: `report_${city.replace(/\s/g, '_').toLowerCase()}_${i + 1}`,
      category: category.value,
      severity: severity,
      description: description,
      city: city,
      userName: user.name,
      userEmail: user.email,
      createdAt: createdAt.toISOString(),
      verified: isVerified,
      verifiedBy: isVerified ? 'Admin' : null,
      verifiedAt: isVerified ? new Date(createdAt.getTime() + 1800000).toISOString() : null,
      imageCount: Math.floor(Math.random() * 3),
      aiAnalysis: {
        confidence: 40 + Math.floor(Math.random() * 40), // Lower confidence for scattered
        assessment: generateAIAssessment(category.value, severity, false)
      }
    });
  }

  return reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

// Generate AI assessment text
const generateAIAssessment = (category, severity, highDensity) => {
  const assessments = {
    high_density: {
      critical: 'Multiple critical reports from the same area confirm severe conditions. Community consensus strongly supports immediate action. Visual evidence and report details are consistent across multiple sources.',
      high: 'Several reports from the same location validate serious conditions. Community members confirm similar observations. Evidence suggests genuine emergency situation.',
      medium: 'Multiple reports from this area show consistent patterns. Community validation supports the reported conditions.',
      low: 'Report shows consistency with other submissions from the area. Community feedback indicates moderate conditions.'
    },
    low_density: {
      critical: 'Critical severity reported but limited corroboration from other sources. Requires admin verification before taking action.',
      high: 'High priority report but only a few submissions from this location. Additional verification recommended.',
      medium: 'Report appears credible but lacks strong community consensus. Monitor for additional reports from this area.',
      low: 'Single or limited reports from this location. Unable to verify with community consensus at this time.'
    }
  };

  const densityKey = highDensity ? 'high_density' : 'low_density';
  return assessments[densityKey][severity] || assessments[densityKey].low;
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
    highConfidence: generateHighDensityReports('Lipa City', 45),

    // Scenario 2: Medium confidence, borderline case
    mediumConfidence: generateHighDensityReports('Tanauan City', 15),

    // Scenario 3: Low confidence, scattered reports
    lowConfidence: generateScatteredReports(['Mabini', 'San Juan'], 5),

    // Scenario 4: All test data combined
    fullDataset: generateAllDummyData()
  };
};
