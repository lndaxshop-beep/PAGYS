import React from 'react';
import US from 'country-flag-icons/react/3x2/US';
import GB from 'country-flag-icons/react/3x2/GB';
import CA from 'country-flag-icons/react/3x2/CA';
import AU from 'country-flag-icons/react/3x2/AU';
import DE from 'country-flag-icons/react/3x2/DE';
import FR from 'country-flag-icons/react/3x2/FR';
import CN from 'country-flag-icons/react/3x2/CN';
import IN from 'country-flag-icons/react/3x2/IN';
import BR from 'country-flag-icons/react/3x2/BR';
import NG from 'country-flag-icons/react/3x2/NG';
import ZA from 'country-flag-icons/react/3x2/ZA';
import KE from 'country-flag-icons/react/3x2/KE';
import GH from 'country-flag-icons/react/3x2/GH';
import EG from 'country-flag-icons/react/3x2/EG';
import MA from 'country-flag-icons/react/3x2/MA';
import TZ from 'country-flag-icons/react/3x2/TZ';
import UG from 'country-flag-icons/react/3x2/UG';
import RW from 'country-flag-icons/react/3x2/RW';
import ZW from 'country-flag-icons/react/3x2/ZW';
import ZM from 'country-flag-icons/react/3x2/ZM';
import BW from 'country-flag-icons/react/3x2/BW';
import NA from 'country-flag-icons/react/3x2/NA';
import MZ from 'country-flag-icons/react/3x2/MZ';
import AO from 'country-flag-icons/react/3x2/AO';
import ET from 'country-flag-icons/react/3x2/ET';
import SD from 'country-flag-icons/react/3x2/SD';
import TN from 'country-flag-icons/react/3x2/TN';
import DZ from 'country-flag-icons/react/3x2/DZ';
import LY from 'country-flag-icons/react/3x2/LY';
import MU from 'country-flag-icons/react/3x2/MU';
import SC from 'country-flag-icons/react/3x2/SC';
import MW from 'country-flag-icons/react/3x2/MW';
import LS from 'country-flag-icons/react/3x2/LS';
import SZ from 'country-flag-icons/react/3x2/SZ';

const flags = { US, GB, CA, AU, DE, FR, CN, IN, BR, NG, ZA, KE, GH, EG, MA, TZ, UG, RW, ZW, ZM, BW, NA, MZ, AO, ET, SD, TN, DZ, LY, MU, SC, MW, LS, SZ };

const CountryFlag = ({ countryCode, size = 20 }) => {
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