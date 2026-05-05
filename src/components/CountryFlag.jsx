import React from 'react';
import * as flags from 'country-flag-icons/react/3x2';


const CountryFlag = ({ countryCode, size = 20 }) => {
  // Map country names to country codes
  const countryCodeMap = {
    'United States': 'US',
    'USA': 'US',
    'United Kingdom': 'GB',
    'UK': 'GB',
    'Canada': 'CA',
    'Australia': 'AU',
    'Germany': 'DE',
    'France': 'FR',
    'China': 'CN',
    'India': 'IN',
    'Brazil': 'BR',
    'Nigeria': 'NG',
    'South Africa': 'ZA',
    'Kenya': 'KE',
    'Ghana': 'GH',
    'Egypt': 'EG',
    'Morocco': 'MA',
    'Tanzania': 'TZ',
    'Uganda': 'UG',
    'Rwanda': 'RW',
    'Zimbabwe': 'ZW',
    'Zambia': 'ZM',
    'Botswana': 'BW',
    'Namibia': 'NA',
    'Mozambique': 'MZ',
    'Angola': 'AO',
    'Ethiopia': 'ET',
    'Sudan': 'SD',
    'Tunisia': 'TN',
    'Algeria': 'DZ',
    'Libya': 'LY',
    'Mauritius': 'MU',
    'Seychelles': 'SC',
    'Malawi': 'MW',
    'Lesotho': 'LS',
    'Eswatini': 'SZ',
    'Other': 'UN' // United Nations flag for "Other"
  };

  // Get country code from the map
  const code = countryCodeMap[countryCode] || 'UN';
  
  // Get the flag component
  const FlagComponent = flags[code];

  if (!FlagComponent) {
    // Return a default globe icon if flag not found
    return (
      <span style={{ fontSize: `${size}px`, marginRight: '4px' }}>🌍</span>
    );
  }

  return (
    <FlagComponent 
      style={{ 
        width: `${size}px`, 
        height: 'auto',
        marginRight: '4px',
        borderRadius: '2px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
      }} 
      title={countryCode}
    />
  );
};

export default CountryFlag;