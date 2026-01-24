-- =====================================================
-- ADD MAJOR COUNTRIES AND PORTS
-- Countries from image + All EU Countries
-- =====================================================

-- =====================================================
-- COUNTRIES FROM THE IMAGE
-- =====================================================
INSERT INTO countries (name, code, ecgc_risk_category, ecgc_rate_percent) VALUES
-- Already exist: USA, UK, UAE, Germany, Australia, Singapore, Saudi Arabia, Russia
-- Adding new ones:
('Japan', 'JP', 'A', 0.25),
('Canada', 'CA', 'A', 0.30),
('France', 'FR', 'A', 0.30),
('Italy', 'IT', 'A', 0.35),
('South Africa', 'ZA', 'B', 0.55),
('Vietnam', 'VN', 'B', 0.50),
('Netherlands', 'NL', 'A', 0.30),
('Spain', 'ES', 'A', 0.35),
('Mexico', 'MX', 'B', 0.50),
('Thailand', 'TH', 'A', 0.40),
('Malaysia', 'MY', 'A', 0.35)
ON CONFLICT DO NOTHING;

-- =====================================================
-- ALL EUROPEAN UNION COUNTRIES
-- =====================================================
INSERT INTO countries (name, code, ecgc_risk_category, ecgc_rate_percent) VALUES
-- Already added: Germany, France, Italy, Netherlands, Spain
('Austria', 'AT', 'A', 0.30),
('Belgium', 'BE', 'A', 0.30),
('Bulgaria', 'BG', 'B', 0.45),
('Croatia', 'HR', 'B', 0.45),
('Cyprus', 'CY', 'B', 0.50),
('Czech Republic', 'CZ', 'A', 0.35),
('Denmark', 'DK', 'A', 0.25),
('Estonia', 'EE', 'A', 0.35),
('Finland', 'FI', 'A', 0.25),
('Greece', 'GR', 'B', 0.50),
('Hungary', 'HU', 'A', 0.40),
('Ireland', 'IE', 'A', 0.30),
('Latvia', 'LV', 'A', 0.40),
('Lithuania', 'LT', 'A', 0.40),
('Luxembourg', 'LU', 'A', 0.25),
('Malta', 'MT', 'A', 0.35),
('Poland', 'PL', 'A', 0.35),
('Portugal', 'PT', 'A', 0.40),
('Romania', 'RO', 'B', 0.45),
('Slovakia', 'SK', 'A', 0.35),
('Slovenia', 'SI', 'A', 0.35),
('Sweden', 'SE', 'A', 0.25)
ON CONFLICT DO NOTHING;

-- =====================================================
-- OTHER MAJOR TRADING COUNTRIES
-- =====================================================
INSERT INTO countries (name, code, ecgc_risk_category, ecgc_rate_percent) VALUES
('China', 'CN', 'A', 0.35),
('South Korea', 'KR', 'A', 0.30),
('Indonesia', 'ID', 'B', 0.50),
('Philippines', 'PH', 'B', 0.50),
('New Zealand', 'NZ', 'A', 0.30),
('Brazil', 'BR', 'B', 0.55),
('Turkey', 'TR', 'B', 0.55),
('Egypt', 'EG', 'B', 0.60),
('Kenya', 'KE', 'C', 0.75),
('Bangladesh', 'BD', 'B', 0.55),
('Sri Lanka', 'LK', 'B', 0.60),
('Nepal', 'NP', 'B', 0.50),
('Oman', 'OM', 'A', 0.40),
('Qatar', 'QA', 'A', 0.35),
('Kuwait', 'KW', 'A', 0.35),
('Bahrain', 'BH', 'A', 0.40),
('Israel', 'IL', 'A', 0.40),
('Jordan', 'JO', 'B', 0.50)
ON CONFLICT DO NOTHING;

-- =====================================================
-- DESTINATION PORTS - MAJOR PORTS BY COUNTRY
-- =====================================================

-- Japan
INSERT INTO destination_ports (country_id, name, code) VALUES
((SELECT id FROM countries WHERE code = 'JP'), 'Tokyo Port', 'JPTYO'),
((SELECT id FROM countries WHERE code = 'JP'), 'Yokohama Port', 'JPYOK'),
((SELECT id FROM countries WHERE code = 'JP'), 'Osaka Port', 'JPOSA'),
((SELECT id FROM countries WHERE code = 'JP'), 'Kobe Port', 'JPUKB')
ON CONFLICT DO NOTHING;

-- Canada
INSERT INTO destination_ports (country_id, name, code) VALUES
((SELECT id FROM countries WHERE code = 'CA'), 'Vancouver Port', 'CAVAN'),
((SELECT id FROM countries WHERE code = 'CA'), 'Montreal Port', 'CAMTR'),
((SELECT id FROM countries WHERE code = 'CA'), 'Toronto Port', 'CATOR')
ON CONFLICT DO NOTHING;

-- France
INSERT INTO destination_ports (country_id, name, code) VALUES
((SELECT id FROM countries WHERE code = 'FR'), 'Le Havre Port', 'FRLEH'),
((SELECT id FROM countries WHERE code = 'FR'), 'Marseille Port', 'FRMRS'),
((SELECT id FROM countries WHERE code = 'FR'), 'Dunkirk Port', 'FRDKK')
ON CONFLICT DO NOTHING;

-- Italy
INSERT INTO destination_ports (country_id, name, code) VALUES
((SELECT id FROM countries WHERE code = 'IT'), 'Genoa Port', 'ITGOA'),
((SELECT id FROM countries WHERE code = 'IT'), 'La Spezia Port', 'ITSPE'),
((SELECT id FROM countries WHERE code = 'IT'), 'Naples Port', 'ITNAP'),
((SELECT id FROM countries WHERE code = 'IT'), 'Venice Port', 'ITVCE')
ON CONFLICT DO NOTHING;

-- South Africa
INSERT INTO destination_ports (country_id, name, code) VALUES
((SELECT id FROM countries WHERE code = 'ZA'), 'Durban Port', 'ZADUR'),
((SELECT id FROM countries WHERE code = 'ZA'), 'Cape Town Port', 'ZACPT'),
((SELECT id FROM countries WHERE code = 'ZA'), 'Port Elizabeth', 'ZAPLZ')
ON CONFLICT DO NOTHING;

-- Vietnam
INSERT INTO destination_ports (country_id, name, code) VALUES
((SELECT id FROM countries WHERE code = 'VN'), 'Ho Chi Minh Port', 'VNSGN'),
((SELECT id FROM countries WHERE code = 'VN'), 'Hai Phong Port', 'VNHPH'),
((SELECT id FROM countries WHERE code = 'VN'), 'Da Nang Port', 'VNDAD')
ON CONFLICT DO NOTHING;

-- Netherlands
INSERT INTO destination_ports (country_id, name, code) VALUES
((SELECT id FROM countries WHERE code = 'NL'), 'Rotterdam Port', 'NLRTM'),
((SELECT id FROM countries WHERE code = 'NL'), 'Amsterdam Port', 'NLAMS')
ON CONFLICT DO NOTHING;

-- Spain
INSERT INTO destination_ports (country_id, name, code) VALUES
((SELECT id FROM countries WHERE code = 'ES'), 'Barcelona Port', 'ESBCN'),
((SELECT id FROM countries WHERE code = 'ES'), 'Valencia Port', 'ESVLC'),
((SELECT id FROM countries WHERE code = 'ES'), 'Algeciras Port', 'ESALG')
ON CONFLICT DO NOTHING;

-- Mexico
INSERT INTO destination_ports (country_id, name, code) VALUES
((SELECT id FROM countries WHERE code = 'MX'), 'Manzanillo Port', 'MXZLO'),
((SELECT id FROM countries WHERE code = 'MX'), 'Lazaro Cardenas Port', 'MXLZC'),
((SELECT id FROM countries WHERE code = 'MX'), 'Veracruz Port', 'MXVER')
ON CONFLICT DO NOTHING;

-- Thailand
INSERT INTO destination_ports (country_id, name, code) VALUES
((SELECT id FROM countries WHERE code = 'TH'), 'Laem Chabang Port', 'THLCH'),
((SELECT id FROM countries WHERE code = 'TH'), 'Bangkok Port', 'THBKK')
ON CONFLICT DO NOTHING;

-- Malaysia
INSERT INTO destination_ports (country_id, name, code) VALUES
((SELECT id FROM countries WHERE code = 'MY'), 'Port Klang', 'MYPKG'),
((SELECT id FROM countries WHERE code = 'MY'), 'Penang Port', 'MYPEN'),
((SELECT id FROM countries WHERE code = 'MY'), 'Johor Port', 'MYJHB')
ON CONFLICT DO NOTHING;

-- USA (additional ports)
INSERT INTO destination_ports (country_id, name, code) VALUES
((SELECT id FROM countries WHERE code = 'US'), 'Long Beach Port', 'USLGB'),
((SELECT id FROM countries WHERE code = 'US'), 'Houston Port', 'USHOU'),
((SELECT id FROM countries WHERE code = 'US'), 'Savannah Port', 'USSAV'),
((SELECT id FROM countries WHERE code = 'US'), 'Seattle Port', 'USSEA'),
((SELECT id FROM countries WHERE code = 'US'), 'Miami Port', 'USMIA')
ON CONFLICT DO NOTHING;

-- UK (additional ports)
INSERT INTO destination_ports (country_id, name, code) VALUES
((SELECT id FROM countries WHERE code = 'GB'), 'Southampton Port', 'GBSOU'),
((SELECT id FROM countries WHERE code = 'GB'), 'London Gateway', 'GBLON'),
((SELECT id FROM countries WHERE code = 'GB'), 'Liverpool Port', 'GBLIV')
ON CONFLICT DO NOTHING;

-- Germany (additional ports)
INSERT INTO destination_ports (country_id, name, code) VALUES
((SELECT id FROM countries WHERE code = 'DE'), 'Bremen Port', 'DEBRV'),
((SELECT id FROM countries WHERE code = 'DE'), 'Bremerhaven Port', 'DEBHV')
ON CONFLICT DO NOTHING;

-- Australia (additional ports)
INSERT INTO destination_ports (country_id, name, code) VALUES
((SELECT id FROM countries WHERE code = 'AU'), 'Sydney Port', 'AUSYD'),
((SELECT id FROM countries WHERE code = 'AU'), 'Brisbane Port', 'AUBNE'),
((SELECT id FROM countries WHERE code = 'AU'), 'Fremantle Port', 'AUFRE')
ON CONFLICT DO NOTHING;

-- UAE (additional ports)
INSERT INTO destination_ports (country_id, name, code) VALUES
((SELECT id FROM countries WHERE code = 'AE'), 'Dubai Creek', 'AEDXB'),
((SELECT id FROM countries WHERE code = 'AE'), 'Sharjah Port', 'AESHJ')
ON CONFLICT DO NOTHING;

-- Saudi Arabia (additional ports)
INSERT INTO destination_ports (country_id, name, code) VALUES
((SELECT id FROM countries WHERE code = 'SA'), 'Dammam Port', 'SADMM'),
((SELECT id FROM countries WHERE code = 'SA'), 'Riyadh Dry Port', 'SARUH')
ON CONFLICT DO NOTHING;

-- China
INSERT INTO destination_ports (country_id, name, code) VALUES
((SELECT id FROM countries WHERE code = 'CN'), 'Shanghai Port', 'CNSHA'),
((SELECT id FROM countries WHERE code = 'CN'), 'Shenzhen Port', 'CNSZX'),
((SELECT id FROM countries WHERE code = 'CN'), 'Ningbo Port', 'CNNGB'),
((SELECT id FROM countries WHERE code = 'CN'), 'Qingdao Port', 'CNTAO'),
((SELECT id FROM countries WHERE code = 'CN'), 'Tianjin Port', 'CNTSN')
ON CONFLICT DO NOTHING;

-- South Korea
INSERT INTO destination_ports (country_id, name, code) VALUES
((SELECT id FROM countries WHERE code = 'KR'), 'Busan Port', 'KRPUS'),
((SELECT id FROM countries WHERE code = 'KR'), 'Incheon Port', 'KRINC')
ON CONFLICT DO NOTHING;

-- Indonesia
INSERT INTO destination_ports (country_id, name, code) VALUES
((SELECT id FROM countries WHERE code = 'ID'), 'Jakarta Port', 'IDJKT'),
((SELECT id FROM countries WHERE code = 'ID'), 'Surabaya Port', 'IDSUB')
ON CONFLICT DO NOTHING;

-- Philippines
INSERT INTO destination_ports (country_id, name, code) VALUES
((SELECT id FROM countries WHERE code = 'PH'), 'Manila Port', 'PHMNL'),
((SELECT id FROM countries WHERE code = 'PH'), 'Cebu Port', 'PHCEB')
ON CONFLICT DO NOTHING;

-- New Zealand
INSERT INTO destination_ports (country_id, name, code) VALUES
((SELECT id FROM countries WHERE code = 'NZ'), 'Auckland Port', 'NZAKL'),
((SELECT id FROM countries WHERE code = 'NZ'), 'Tauranga Port', 'NZTRG')
ON CONFLICT DO NOTHING;

-- Brazil
INSERT INTO destination_ports (country_id, name, code) VALUES
((SELECT id FROM countries WHERE code = 'BR'), 'Santos Port', 'BRSSZ'),
((SELECT id FROM countries WHERE code = 'BR'), 'Rio de Janeiro Port', 'BRRIO')
ON CONFLICT DO NOTHING;

-- Turkey
INSERT INTO destination_ports (country_id, name, code) VALUES
((SELECT id FROM countries WHERE code = 'TR'), 'Istanbul Port', 'TRIST'),
((SELECT id FROM countries WHERE code = 'TR'), 'Mersin Port', 'TRMER'),
((SELECT id FROM countries WHERE code = 'TR'), 'Izmir Port', 'TRIZM')
ON CONFLICT DO NOTHING;

-- Egypt
INSERT INTO destination_ports (country_id, name, code) VALUES
((SELECT id FROM countries WHERE code = 'EG'), 'Alexandria Port', 'EGALY'),
((SELECT id FROM countries WHERE code = 'EG'), 'Port Said', 'EGPSD')
ON CONFLICT DO NOTHING;

-- Kenya
INSERT INTO destination_ports (country_id, name, code) VALUES
((SELECT id FROM countries WHERE code = 'KE'), 'Mombasa Port', 'KEMBA')
ON CONFLICT DO NOTHING;

-- Bangladesh
INSERT INTO destination_ports (country_id, name, code) VALUES
((SELECT id FROM countries WHERE code = 'BD'), 'Chittagong Port', 'BDCGP'),
((SELECT id FROM countries WHERE code = 'BD'), 'Mongla Port', 'BDMGL')
ON CONFLICT DO NOTHING;

-- Sri Lanka
INSERT INTO destination_ports (country_id, name, code) VALUES
((SELECT id FROM countries WHERE code = 'LK'), 'Colombo Port', 'LKCMB')
ON CONFLICT DO NOTHING;

-- Gulf Countries
INSERT INTO destination_ports (country_id, name, code) VALUES
((SELECT id FROM countries WHERE code = 'OM'), 'Muscat Port', 'OMMCT'),
((SELECT id FROM countries WHERE code = 'QA'), 'Hamad Port', 'QAHMD'),
((SELECT id FROM countries WHERE code = 'KW'), 'Kuwait Port', 'KWKWI'),
((SELECT id FROM countries WHERE code = 'BH'), 'Bahrain Port', 'BHBAH')
ON CONFLICT DO NOTHING;

-- EU Countries Ports
INSERT INTO destination_ports (country_id, name, code) VALUES
((SELECT id FROM countries WHERE code = 'BE'), 'Antwerp Port', 'BEANR'),
((SELECT id FROM countries WHERE code = 'BE'), 'Zeebrugge Port', 'BEZEE'),
((SELECT id FROM countries WHERE code = 'PL'), 'Gdansk Port', 'PLGDN'),
((SELECT id FROM countries WHERE code = 'PT'), 'Lisbon Port', 'PTLIS'),
((SELECT id FROM countries WHERE code = 'PT'), 'Sines Port', 'PTSIE'),
((SELECT id FROM countries WHERE code = 'GR'), 'Piraeus Port', 'GRPIR'),
((SELECT id FROM countries WHERE code = 'DK'), 'Copenhagen Port', 'DKCPH'),
((SELECT id FROM countries WHERE code = 'SE'), 'Gothenburg Port', 'SEGOT'),
((SELECT id FROM countries WHERE code = 'FI'), 'Helsinki Port', 'FIHEL'),
((SELECT id FROM countries WHERE code = 'IE'), 'Dublin Port', 'IEDUB'),
((SELECT id FROM countries WHERE code = 'HR'), 'Rijeka Port', 'HRRJK'),
((SELECT id FROM countries WHERE code = 'SI'), 'Koper Port', 'SIKOP'),
((SELECT id FROM countries WHERE code = 'RO'), 'Constanta Port', 'ROCND'),
((SELECT id FROM countries WHERE code = 'BG'), 'Varna Port', 'BGVAR'),
((SELECT id FROM countries WHERE code = 'LT'), 'Klaipeda Port', 'LTKLJ'),
((SELECT id FROM countries WHERE code = 'LV'), 'Riga Port', 'LVRIX'),
((SELECT id FROM countries WHERE code = 'EE'), 'Tallinn Port', 'EETLL'),
((SELECT id FROM countries WHERE code = 'MT'), 'Malta Freeport', 'MTMLA'),
((SELECT id FROM countries WHERE code = 'CY'), 'Limassol Port', 'CYLMS')
ON CONFLICT DO NOTHING;

-- =====================================================
-- DONE! All major countries and ports added
-- =====================================================
