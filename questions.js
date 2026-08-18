// Ballpark question bank — data-driven generator producing 1,000+ questions.
//
// Sources of questions:
//  - COUNTRIES: population / area / GDP per country        (~175 questions)
//  - US_STATES: population / area                          (~40)
//  - CITY_POP: city populations                            (~40)
//  - CITY_GEO: straight-line distances between city pairs  (~190, computed by haversine)
//  - AGES: "how old is X" from birthdates (always current) (~110)
//  - NET_WORTH: estimated net worths                       (~25)
//  - STATIC: hand-written questions in many categories     (~450)
//
// Values are approximate real-world figures (circa 2025). The game is about
// closeness, not perfect precision.

// ---------------------------------------------------------------------------
// Countries: [name, population in millions, area km², GDP in $ billions|null]
const COUNTRIES = [
  ['China', 1416, 9596960, 18800], ['India', 1450, 3287263, 3900],
  ['the United States', 340, 9833520, 29000], ['Indonesia', 283, 1904569, 1400],
  ['Pakistan', 251, 881913, 375], ['Nigeria', 232, 923768, 480],
  ['Brazil', 212, 8515767, 2200], ['Bangladesh', 173, 147570, 460],
  ['Russia', 144, 17098246, 2200], ['Mexico', 130, 1964375, 1850],
  ['Japan', 124, 377975, 4100], ['Ethiopia', 132, 1104300, 160],
  ['the Philippines', 115, 300000, 440], ['Egypt', 116, 1001450, 380],
  ['Vietnam', 100, 331212, 470], ['Turkey', 87, 783562, 1100],
  ['Iran', 91, 1648195, 400], ['Germany', 84, 357114, 4700],
  ['Thailand', 72, 513120, 540], ['the United Kingdom', 69, 242495, 3600],
  ['France', 68, 551695, 3200], ['Italy', 59, 301340, 2400],
  ['South Africa', 63, 1221037, 400], ['Spain', 48, 505990, 1700],
  ['Argentina', 46, 2780400, 640], ['Canada', 41, 9984670, 2200],
  ['Poland', 38, 312679, 850], ['Ukraine', 37, 603550, 180],
  ['Australia', 27, 7692024, 1800], ['the Netherlands', 18, 41850, 1200],
  ['Israel', 9.8, 22072, 530], ['Switzerland', 9, 41284, 940],
  ['Sweden', 10.6, 450295, 620], ['Norway', 5.6, 385207, 500],
  ['Greece', 10.3, 131957, 250], ['Portugal', 10.5, 92090, 300],
  ['New Zealand', 5.3, 268021, 250], ['Ireland', 5.3, 70273, 560],
  ['Singapore', 6, 728, 530], ['Iceland', 0.39, 103000, 33],
  ['Saudi Arabia', 37, 2149690, 1100], ['the United Arab Emirates', 10, 83600, 550],
  ['South Korea', 52, 100210, 1750], ['Kenya', 56, 580367, 110],
  ['Morocco', 38, 446550, 150], ['Colombia', 52, 1141748, 390],
  ['Chile', 20, 756102, 340], ['Peru', 34, 1285216, 280],
  ['Cuba', 11, 109884, null], ['Finland', 5.6, 338424, 300],
  ['Denmark', 6, 43094, 410], ['Belgium', 11.8, 30528, 640],
  ['Austria', 9.1, 83879, 520], ['Czechia', 10.9, 78867, 340],
  ['Hungary', 9.6, 93028, 220], ['Romania', 19, 238391, 350],
  ['Jordan', 11.4, 89342, 50], ['Mongolia', 3.5, 1564110, 20],
  ['Cambodia', 17, 181035, 45], ['Nepal', 30, 147181, 44],
];

// US states: [name, population in millions, area km²]
const US_STATES = [
  ['California', 39, 423967], ['Texas', 31, 695662], ['Florida', 23, 170312],
  ['New York State', 19.6, 141297], ['Pennsylvania', 13, 119280], ['Illinois', 12.6, 149995],
  ['Ohio', 11.8, 116098], ['Georgia (US state)', 11.1, 153910], ['Michigan', 10, 250487],
  ['New Jersey', 9.3, 22591], ['Washington State', 7.9, 184661], ['Arizona', 7.5, 295234],
  ['Massachusetts', 7, 27336], ['Colorado', 5.9, 269601], ['Alaska', 0.74, 1723337],
  ['Hawaii', 1.4, 28313], ['Nevada', 3.2, 286380], ['Montana', 1.1, 380831],
  ['Rhode Island', 1.1, 4001], ['Wyoming', 0.58, 253335],
];

// Cities: [display name, population in millions]
const CITY_POP = [
  ['the Tokyo metro area', 37], ['the Delhi metro area', 33], ['Shanghai', 29],
  ['the São Paulo metro area', 22.8], ['the Cairo metro area', 22], ['the Mexico City metro area', 22],
  ['the Mumbai metro area', 21], ['Beijing', 21], ['the Osaka metro area', 19],
  ['New York City (city proper)', 8.3], ['Los Angeles (city proper)', 3.8], ['Chicago (city proper)', 2.7],
  ['Houston (city proper)', 2.3], ['London', 8.9], ['Paris (city proper)', 2.1],
  ['Berlin', 3.7], ['Madrid', 3.3], ['Rome', 2.8],
  ['Moscow', 13], ['Istanbul', 15.6], ['Lagos', 16],
  ['the Buenos Aires metro area', 15], ['the Tel Aviv metro area', 4.4], ['Jerusalem', 1],
  ['Toronto (city proper)', 2.8], ['the Sydney metro area', 5.3], ['the Melbourne metro area', 5.2],
  ['Hong Kong', 7.5], ['Dubai', 3.6], ['the Bangkok metro area', 11],
  ['Seoul', 9.4], ['Jakarta (city proper)', 10.6], ['Amsterdam', 0.93],
  ['Vienna', 2], ['Prague', 1.3], ['Dublin', 0.6],
  ['San Francisco (city proper)', 0.81], ['Miami (city proper)', 0.46],
  ['Las Vegas (city proper)', 0.66], ['Boston (city proper)', 0.65],
];

// Cities with coordinates for distance questions: [name, lat, lon]
const CITY_GEO = [
  ['New York', 40.71, -74.01], ['London', 51.51, -0.13], ['Paris', 48.86, 2.35],
  ['Tokyo', 35.68, 139.69], ['Sydney', -33.87, 151.21], ['Los Angeles', 34.05, -118.24],
  ['Rio de Janeiro', -22.91, -43.17], ['Cairo', 30.04, 31.24], ['Moscow', 55.76, 37.62],
  ['Beijing', 39.90, 116.41], ['Mumbai', 19.08, 72.88], ['Tel Aviv', 32.08, 34.78],
  ['Rome', 41.90, 12.50], ['Berlin', 52.52, 13.40], ['Toronto', 43.65, -79.38],
  ['Mexico City', 19.43, -99.13], ['Singapore', 1.35, 103.82], ['Cape Town', -33.92, 18.42],
  ['Buenos Aires', -34.60, -58.38], ['Reykjavik', 64.15, -21.94],
];

// People with birthdates -> "How old is X?" (answer computed at game time)
const AGES = [
  ['Mick Jagger', '1943-07-26'], ['Paul McCartney', '1942-06-18'], ['Ringo Starr', '1940-07-07'],
  ['Bob Dylan', '1941-05-24'], ['Bruce Springsteen', '1949-09-23'], ['Elton John', '1947-03-25'],
  ['Stevie Wonder', '1950-05-13'], ['Dolly Parton', '1946-01-19'], ['Cher', '1946-05-20'],
  ['Madonna', '1958-08-16'], ['Snoop Dogg', '1971-10-20'], ['Eminem', '1972-10-17'],
  ['Taylor Swift', '1989-12-13'], ['Adele', '1988-05-05'], ['Ed Sheeran', '1991-02-17'],
  ['Justin Bieber', '1994-03-01'], ['Ariana Grande', '1993-06-26'], ['Billie Eilish', '2001-12-18'],
  ['Drake', '1986-10-24'], ['Kanye West', '1977-06-08'], ['Lady Gaga', '1986-03-28'],
  ['Katy Perry', '1984-10-25'], ['Bruno Mars', '1985-10-08'], ['The Weeknd', '1990-02-16'],
  ['Bad Bunny', '1994-03-10'], ['Shakira', '1977-02-02'], ['Jennifer Lopez', '1969-07-24'],
  ['Celine Dion', '1968-03-30'], ['Mariah Carey', '1969-03-27'], ['Rihanna', '1988-02-20'],
  ['Beyoncé', '1981-09-04'], ['Jay-Z', '1969-12-04'],
  ['Keanu Reeves', '1964-09-02'], ['Tom Cruise', '1962-07-03'], ['Brad Pitt', '1963-12-18'],
  ['Angelina Jolie', '1975-06-04'], ['Jennifer Aniston', '1969-02-11'], ['Leonardo DiCaprio', '1974-11-11'],
  ['Kate Winslet', '1975-10-05'], ['Johnny Depp', '1963-06-09'], ['Meryl Streep', '1949-06-22'],
  ['Robert De Niro', '1943-08-17'], ['Al Pacino', '1940-04-25'], ['Morgan Freeman', '1937-06-01'],
  ['Samuel L. Jackson', '1948-12-21'], ['Denzel Washington', '1954-12-28'], ['Will Smith', '1968-09-25'],
  ['Dwayne "The Rock" Johnson', '1972-05-02'], ['Ryan Reynolds', '1976-10-23'], ['Hugh Jackman', '1968-10-12'],
  ['Scarlett Johansson', '1984-11-22'], ['Emma Watson', '1990-04-15'], ['Daniel Radcliffe', '1989-07-23'],
  ['Arnold Schwarzenegger', '1947-07-30'], ['Sylvester Stallone', '1946-07-06'], ['Harrison Ford', '1942-07-13'],
  ['Clint Eastwood', '1930-05-31'], ['Anthony Hopkins', '1937-12-31'], ['Ian McKellen', '1939-05-25'],
  ['Judi Dench', '1934-12-09'], ['Helen Mirren', '1945-07-26'], ['Jack Nicholson', '1937-04-22'],
  ['Julia Roberts', '1967-10-28'], ['Sandra Bullock', '1964-07-26'], ['Nicole Kidman', '1967-06-20'],
  ['Cate Blanchett', '1969-05-14'], ['Natalie Portman', '1981-06-09'], ['Gal Gadot', '1985-04-30'],
  ['Chris Hemsworth', '1983-08-11'], ['Chris Evans', '1981-06-13'], ['Robert Downey Jr.', '1965-04-04'],
  ['Tom Hanks', '1956-07-09'], ['Tom Holland', '1996-06-01'], ['Zendaya', '1996-09-01'],
  ['Timothée Chalamet', '1995-12-27'], ['Margot Robbie', '1990-07-02'], ['Jim Carrey', '1962-01-17'],
  ['Adam Sandler', '1966-09-09'], ['Ben Stiller', '1965-11-30'], ['Steve Martin', '1945-08-14'],
  ['Larry David', '1947-07-02'], ['Jerry Seinfeld', '1954-04-29'], ['Conan O\'Brien', '1963-04-18'],
  ['Stephen Colbert', '1964-05-13'], ['Trevor Noah', '1984-02-20'], ['Ellen DeGeneres', '1958-01-26'],
  ['Oprah Winfrey', '1954-01-29'], ['David Attenborough', '1926-05-08'], ['Jane Goodall', '1934-04-03'],
  ['Stephen King', '1947-09-21'], ['J.K. Rowling', '1965-07-31'], ['George R.R. Martin', '1948-09-20'],
  ['Malala Yousafzai', '1997-07-12'], ['Greta Thunberg', '2003-01-03'],
  ['Elon Musk', '1971-06-28'], ['Jeff Bezos', '1964-01-12'], ['Bill Gates', '1955-10-28'],
  ['Warren Buffett', '1930-08-30'], ['Mark Zuckerberg', '1984-05-14'], ['Tim Cook', '1960-11-01'],
  ['Satya Nadella', '1967-08-19'], ['Sundar Pichai', '1972-06-10'], ['Sam Altman', '1985-04-22'],
  ['Jensen Huang', '1963-02-17'], ['Larry Ellison', '1944-08-17'], ['Richard Branson', '1950-07-18'],
  ['Bernard Arnault', '1949-03-05'], ['Martha Stewart', '1941-08-03'], ['Gordon Ramsay', '1966-11-08'],
  ['Jamie Oliver', '1975-05-27'],
  ['Barack Obama', '1961-08-04'], ['Donald Trump', '1946-06-14'], ['Joe Biden', '1942-11-20'],
  ['Hillary Clinton', '1947-10-26'], ['Vladimir Putin', '1952-10-07'], ['Benjamin Netanyahu', '1949-10-21'],
  ['King Charles III', '1948-11-14'], ['Prince William', '1982-06-21'],
  ['Cristiano Ronaldo', '1985-02-05'], ['Lionel Messi', '1987-06-24'], ['LeBron James', '1984-12-30'],
  ['Serena Williams', '1981-09-26'], ['Roger Federer', '1981-08-08'], ['Rafael Nadal', '1986-06-03'],
  ['Novak Djokovic', '1987-05-22'], ['Usain Bolt', '1986-08-21'], ['Michael Jordan', '1963-02-17'],
  ['Tiger Woods', '1975-12-30'], ['Tom Brady', '1977-08-03'], ['Shaquille O\'Neal', '1972-03-06'],
  ['David Beckham', '1975-05-02'], ['Zlatan Ibrahimović', '1981-10-03'], ['Kylian Mbappé', '1998-12-20'],
  ['Neymar', '1992-02-05'], ['Stephen Curry', '1988-03-14'], ['Simone Biles', '1997-03-14'],
  ['Michael Phelps', '1985-06-30'], ['Mike Tyson', '1966-06-30'], ['Magnus Carlsen', '1990-11-30'],
  ['Quentin Tarantino', '1963-03-27'], ['Steven Spielberg', '1946-12-18'], ['Martin Scorsese', '1942-11-17'],
  ['Christopher Nolan', '1970-07-30'], ['Ridley Scott', '1937-11-30'], ['James Cameron', '1954-08-16'],
];

// Net worths: [name, $ billions]
const NET_WORTH = [
  ['Elon Musk', 400], ['Jeff Bezos', 240], ['Bernard Arnault', 180], ['Mark Zuckerberg', 200],
  ['Bill Gates', 130], ['Warren Buffett', 145], ['Larry Ellison', 190], ['Larry Page', 140],
  ['Sergey Brin', 135], ['Jensen Huang', 120], ['Michael Bloomberg', 105], ['Mukesh Ambani', 110],
  ['Taylor Swift', 1.6], ['Rihanna', 1.4], ['Jay-Z', 2.5], ['Oprah Winfrey', 3],
  ['Kim Kardashian', 1.7], ['LeBron James', 1.2], ['Cristiano Ronaldo', 0.9], ['Lionel Messi', 0.85],
  ['Tiger Woods', 1.3], ['Michael Jordan', 3.5], ['Steven Spielberg', 5.3], ['George Lucas', 5.5],
  ['Peter Jackson', 1.5],
];

// ---------------------------------------------------------------------------
// Hand-written static questions
const STATIC = [
  // ============ PEOPLE (facts) ============
  { cat: 'People', q: 'How many times has Elizabeth Taylor been married?', a: 8, unit: 'marriages' },
  { cat: 'People', q: 'How many children does Elon Musk have (publicly known)?', a: 12, unit: 'children' },
  { cat: 'People', q: 'How many Grammy awards has Beyoncé won?', a: 35, unit: 'Grammys' },
  { cat: 'People', q: 'How many Olympic gold medals does Michael Phelps have?', a: 23, unit: 'gold medals' },
  { cat: 'People', q: 'At what age did Einstein publish his theory of special relativity?', a: 26, unit: 'years old' },
  { cat: 'People', q: 'How old was Queen Elizabeth II when she died?', a: 96, unit: 'years old' },
  { cat: 'People', q: 'How many US presidents have there been (counting Cleveland twice)?', a: 47, unit: 'presidents' },
  { cat: 'People', q: 'How many followers does Cristiano Ronaldo have on Instagram (approximately)?', a: 660000000, unit: 'followers' },
  { cat: 'People', q: 'How tall is Shaquille O\'Neal (in cm)?', a: 216, unit: 'cm' },
  { cat: 'People', q: 'How many artworks did Picasso produce in his lifetime (approximately)?', a: 50000, unit: 'artworks' },
  { cat: 'People', q: 'At what age did Mozart die?', a: 35, unit: 'years old' },
  { cat: 'People', q: 'How many plays did Shakespeare write?', a: 37, unit: 'plays' },
  { cat: 'People', q: 'How many patents did Thomas Edison hold?', a: 1093, unit: 'patents' },
  { cat: 'People', q: 'How many Nobel Prizes did Marie Curie win?', a: 2, unit: 'Nobel Prizes' },
  { cat: 'People', q: 'How old was the youngest Nobel Prize laureate ever (Malala)?', a: 17, unit: 'years old' },
  { cat: 'People', q: 'How tall was Abraham Lincoln (in cm)?', a: 193, unit: 'cm' },
  { cat: 'People', q: 'How tall was Napoleon (in cm)?', a: 170, unit: 'cm' },
  { cat: 'People', q: 'How tall was the tallest man ever recorded (in cm)?', a: 272, unit: 'cm' },
  { cat: 'People', q: 'How old was the oldest person ever recorded (Jeanne Calment)?', a: 122, unit: 'years old' },
  { cat: 'People', q: 'What is the record for most children born to one mother?', a: 69, unit: 'children' },
  { cat: 'People', q: 'How old was JFK when he became US president (youngest elected)?', a: 43, unit: 'years old' },
  { cat: 'People', q: 'How long was the longest recorded marriage (in years)?', a: 86, unit: 'years' },

  // ============ HISTORY ============
  { cat: 'History', q: 'In what year did World War I begin?', a: 1914, unit: 'year' },
  { cat: 'History', q: 'In what year did World War I end?', a: 1918, unit: 'year' },
  { cat: 'History', q: 'In what year did World War II begin?', a: 1939, unit: 'year' },
  { cat: 'History', q: 'In what year did World War II end?', a: 1945, unit: 'year' },
  { cat: 'History', q: 'In what year did humans first land on the Moon?', a: 1969, unit: 'year' },
  { cat: 'History', q: 'In what year did the Titanic sink?', a: 1912, unit: 'year' },
  { cat: 'History', q: 'In what year was the Berlin Wall built?', a: 1961, unit: 'year' },
  { cat: 'History', q: 'In what year did the Berlin Wall fall?', a: 1989, unit: 'year' },
  { cat: 'History', q: 'In what year did the French Revolution begin?', a: 1789, unit: 'year' },
  { cat: 'History', q: 'In what year did the US declare independence?', a: 1776, unit: 'year' },
  { cat: 'History', q: 'In what year did Columbus first reach the Americas?', a: 1492, unit: 'year' },
  { cat: 'History', q: 'In what year was the Magna Carta signed?', a: 1215, unit: 'year' },
  { cat: 'History', q: 'Around what year did Gutenberg invent the printing press?', a: 1440, unit: 'year' },
  { cat: 'History', q: 'In what year did the American Civil War end?', a: 1865, unit: 'year' },
  { cat: 'History', q: 'In what year was the Wright brothers\' first powered flight?', a: 1903, unit: 'year' },
  { cat: 'History', q: 'In what year did Ford introduce the Model T?', a: 1908, unit: 'year' },
  { cat: 'History', q: 'In what year was penicillin discovered?', a: 1928, unit: 'year' },
  { cat: 'History', q: 'In what year was the structure of DNA discovered?', a: 1953, unit: 'year' },
  { cat: 'History', q: 'In what year were the first modern Olympic Games held?', a: 1896, unit: 'year' },
  { cat: 'History', q: 'In what year was the first FIFA World Cup held?', a: 1930, unit: 'year' },
  { cat: 'History', q: 'In what year was JFK assassinated?', a: 1963, unit: 'year' },
  { cat: 'History', q: 'In what year was the Chernobyl disaster?', a: 1986, unit: 'year' },
  { cat: 'History', q: 'In what year was the Soviet Union dissolved?', a: 1991, unit: 'year' },
  { cat: 'History', q: 'In what year was Nelson Mandela released from prison?', a: 1990, unit: 'year' },
  { cat: 'History', q: 'In what year did Nelson Mandela become president of South Africa?', a: 1994, unit: 'year' },
  { cat: 'History', q: 'In what year was Hong Kong handed back to China?', a: 1997, unit: 'year' },
  { cat: 'History', q: 'In what year did euro banknotes and coins enter circulation?', a: 2002, unit: 'year' },
  { cat: 'History', q: 'In what year was Facebook founded?', a: 2004, unit: 'year' },
  { cat: 'History', q: 'In what year was YouTube founded?', a: 2005, unit: 'year' },
  { cat: 'History', q: 'In what year was Twitter founded?', a: 2006, unit: 'year' },
  { cat: 'History', q: 'In what year was the first iPhone released?', a: 2007, unit: 'year' },
  { cat: 'History', q: 'In what year was the Bitcoin whitepaper published?', a: 2008, unit: 'year' },
  { cat: 'History', q: 'In what year was Instagram launched?', a: 2010, unit: 'year' },
  { cat: 'History', q: 'In what year was the Great Fire of London?', a: 1666, unit: 'year' },
  { cat: 'History', q: 'In what year did Mount Vesuvius bury Pompeii?', a: 79, unit: 'year (AD)' },
  { cat: 'History', q: 'In what year did the Western Roman Empire fall?', a: 476, unit: 'year (AD)' },
  { cat: 'History', q: 'In what year did Constantinople fall to the Ottomans?', a: 1453, unit: 'year' },
  { cat: 'History', q: 'In what year did Shakespeare die?', a: 1616, unit: 'year' },
  { cat: 'History', q: 'In what year was Mozart born?', a: 1756, unit: 'year' },
  { cat: 'History', q: 'In what year was Beethoven born?', a: 1770, unit: 'year' },
  { cat: 'History', q: 'In what year was the Battle of Waterloo?', a: 1815, unit: 'year' },
  { cat: 'History', q: 'In what year did the California Gold Rush begin?', a: 1848, unit: 'year' },
  { cat: 'History', q: 'In what year was the Eiffel Tower completed?', a: 1889, unit: 'year' },
  { cat: 'History', q: 'In what year was the Statue of Liberty dedicated?', a: 1886, unit: 'year' },
  { cat: 'History', q: 'In what year was the Golden Gate Bridge completed?', a: 1937, unit: 'year' },
  { cat: 'History', q: 'In what year was the Empire State Building completed?', a: 1931, unit: 'year' },
  { cat: 'History', q: 'In what year was Sputnik, the first satellite, launched?', a: 1957, unit: 'year' },
  { cat: 'History', q: 'In what year did Yuri Gagarin become the first human in space?', a: 1961, unit: 'year' },
  { cat: 'History', q: 'In what year was the first email sent?', a: 1971, unit: 'year' },
  { cat: 'History', q: 'In what year was the World Wide Web invented?', a: 1989, unit: 'year' },
  { cat: 'History', q: 'In what year was Google founded?', a: 1998, unit: 'year' },
  { cat: 'History', q: 'In what year was the State of Israel established?', a: 1948, unit: 'year' },
  { cat: 'History', q: 'In what year did India gain independence?', a: 1947, unit: 'year' },
  { cat: 'History', q: 'In what year was the Roman Colosseum completed?', a: 80, unit: 'year (AD)' },
  { cat: 'History', q: 'In what year did US women gain the right to vote nationwide?', a: 1920, unit: 'year' },
  { cat: 'History', q: 'In what year did Prohibition end in the US?', a: 1933, unit: 'year' },
  { cat: 'History', q: 'In what year was D-Day?', a: 1944, unit: 'year' },
  { cat: 'History', q: 'In what year was the attack on Pearl Harbor?', a: 1941, unit: 'year' },
  { cat: 'History', q: 'In what year was the United Nations founded?', a: 1945, unit: 'year' },
  { cat: 'History', q: 'In what year was NATO founded?', a: 1949, unit: 'year' },
  { cat: 'History', q: 'In what year did the UK vote for Brexit?', a: 2016, unit: 'year' },
  { cat: 'History', q: 'In what year was COVID-19 declared a pandemic?', a: 2020, unit: 'year' },
  { cat: 'History', q: 'In what year was ChatGPT released?', a: 2022, unit: 'year' },
  { cat: 'History', q: 'How many years did the Hundred Years\' War actually last?', a: 116, unit: 'years' },
  { cat: 'History', q: 'How old are the Great Pyramids of Giza (approximately, in years)?', a: 4600, unit: 'years' },
  { cat: 'History', q: 'How many people sailed on the Mayflower?', a: 102, unit: 'passengers' },

  // ============ SCIENCE & NATURE ============
  { cat: 'Science & Nature', q: 'What is the speed of light (in km per second)?', a: 299792, unit: 'km/s' },
  { cat: 'Science & Nature', q: 'What is the speed of sound at sea level (in meters per second)?', a: 343, unit: 'm/s' },
  { cat: 'Science & Nature', q: 'How far is the Moon from Earth (average, in km)?', a: 384400, unit: 'km' },
  { cat: 'Science & Nature', q: 'How far is the Sun from Earth (average, in millions of km)?', a: 150, unit: 'million km' },
  { cat: 'Science & Nature', q: 'How many seconds does sunlight take to reach Earth?', a: 500, unit: 'seconds' },
  { cat: 'Science & Nature', q: 'What is the diameter of Earth (in km)?', a: 12742, unit: 'km' },
  { cat: 'Science & Nature', q: 'What is the diameter of the Moon (in km)?', a: 3474, unit: 'km' },
  { cat: 'Science & Nature', q: 'What is the diameter of Jupiter (in km)?', a: 139820, unit: 'km' },
  { cat: 'Science & Nature', q: 'What is the diameter of the Sun (in km)?', a: 1392700, unit: 'km' },
  { cat: 'Science & Nature', q: 'How many days does it take Mercury to orbit the Sun?', a: 88, unit: 'days' },
  { cat: 'Science & Nature', q: 'How many moons does Jupiter have (confirmed)?', a: 95, unit: 'moons' },
  { cat: 'Science & Nature', q: 'How hot is the surface of the Sun (in °C)?', a: 5500, unit: '°C' },
  { cat: 'Science & Nature', q: 'What is absolute zero (in °C)?', a: -273, unit: '°C' },
  { cat: 'Science & Nature', q: 'At what temperature does water boil (in °F)?', a: 212, unit: '°F' },
  { cat: 'Science & Nature', q: 'At what temperature does water freeze (in °F)?', a: 32, unit: '°F' },
  { cat: 'Science & Nature', q: 'How old is Earth (in billions of years)?', a: 4.54, unit: 'billion years' },
  { cat: 'Science & Nature', q: 'How old is the universe (in billions of years)?', a: 13.8, unit: 'billion years' },
  { cat: 'Science & Nature', q: 'How many million years ago did the dinosaurs go extinct?', a: 66, unit: 'million years ago' },
  { cat: 'Science & Nature', q: 'How many elements are in the periodic table?', a: 118, unit: 'elements' },
  { cat: 'Science & Nature', q: 'What is the atomic number of gold?', a: 79, unit: '(atomic number)' },
  { cat: 'Science & Nature', q: 'What percentage of the atmosphere is oxygen?', a: 21, unit: '%' },
  { cat: 'Science & Nature', q: 'What percentage of the atmosphere is nitrogen?', a: 78, unit: '%' },
  { cat: 'Science & Nature', q: 'What is the current CO₂ concentration in the atmosphere (in ppm)?', a: 425, unit: 'ppm' },
  { cat: 'Science & Nature', q: 'How many bones are in the adult human body?', a: 206, unit: 'bones' },
  { cat: 'Science & Nature', q: 'How many bones does a newborn baby have (approximately)?', a: 300, unit: 'bones' },
  { cat: 'Science & Nature', q: 'How many muscles are in the human body (approximately)?', a: 600, unit: 'muscles' },
  { cat: 'Science & Nature', q: 'How many chromosomes do humans have?', a: 46, unit: 'chromosomes' },
  { cat: 'Science & Nature', q: 'How many genes are in the human genome (approximately)?', a: 20000, unit: 'genes' },
  { cat: 'Science & Nature', q: 'How many neurons are in the human brain (in billions)?', a: 86, unit: 'billion neurons' },
  { cat: 'Science & Nature', q: 'How many liters of blood does an adult human have?', a: 5, unit: 'liters' },
  { cat: 'Science & Nature', q: 'How many times does a human heart beat per day (approximately)?', a: 100000, unit: 'beats' },
  { cat: 'Science & Nature', q: 'How many breaths does a person take per day (approximately)?', a: 20000, unit: 'breaths' },
  { cat: 'Science & Nature', q: 'How many taste buds does the human tongue have (approximately)?', a: 10000, unit: 'taste buds' },
  { cat: 'Science & Nature', q: 'How many days does a red blood cell live?', a: 120, unit: 'days' },
  { cat: 'Science & Nature', q: 'How many cm does human hair grow per year (approximately)?', a: 15, unit: 'cm' },
  { cat: 'Science & Nature', q: 'What is the average human body temperature (in °C)?', a: 37, unit: '°C' },
  { cat: 'Science & Nature', q: 'What percentage of the human body is water?', a: 60, unit: '%' },
  { cat: 'Science & Nature', q: 'What percentage of DNA do humans share with chimpanzees?', a: 98.8, unit: '%' },
  { cat: 'Science & Nature', q: 'What percentage of DNA do humans share with bananas (approximately)?', a: 60, unit: '%' },
  { cat: 'Science & Nature', q: 'How long is the DNA in one human cell if stretched out (in meters)?', a: 2, unit: 'meters' },
  { cat: 'Science & Nature', q: 'What is the deepest hole ever drilled (Kola Superdeep Borehole, in meters)?', a: 12262, unit: 'meters' },
  { cat: 'Science & Nature', q: 'At what altitude does the International Space Station orbit (in km)?', a: 400, unit: 'km' },
  { cat: 'Science & Nature', q: 'How fast does the ISS travel (in km/h)?', a: 28000, unit: 'km/h' },
  { cat: 'Science & Nature', q: 'How many active satellites orbit Earth (approximately)?', a: 10000, unit: 'satellites' },
  { cat: 'Science & Nature', q: 'How many humans have ever been to space (approximately)?', a: 700, unit: 'people' },
  { cat: 'Science & Nature', q: 'How many Apollo missions landed humans on the Moon?', a: 6, unit: 'missions' },
  { cat: 'Science & Nature', q: 'What is the hottest air temperature ever recorded on Earth (in °C)?', a: 56.7, unit: '°C' },
  { cat: 'Science & Nature', q: 'What is the coldest temperature ever recorded on Earth (in °C)?', a: -89.2, unit: '°C' },
  { cat: 'Science & Nature', q: 'How long was the longest lightning bolt ever recorded (in km)?', a: 768, unit: 'km' },
  { cat: 'Science & Nature', q: 'How much does an average cumulus cloud weigh (in tons)?', a: 500, unit: 'tons' },
  { cat: 'Science & Nature', q: 'How tall is the tallest tree in the world (in meters)?', a: 116, unit: 'meters' },
  { cat: 'Science & Nature', q: 'How old is the oldest known living tree (in years)?', a: 4850, unit: 'years' },
  { cat: 'Science & Nature', q: 'How many species of bees are there (approximately)?', a: 20000, unit: 'species' },
  { cat: 'Science & Nature', q: 'How many species of insects have been described (approximately)?', a: 1000000, unit: 'species' },
  { cat: 'Science & Nature', q: 'How many hearts does an octopus have?', a: 3, unit: 'hearts' },

  // ============ ANIMALS ============
  { cat: 'Animals', q: 'What is the top speed of a cheetah (in km/h)?', a: 112, unit: 'km/h' },
  { cat: 'Animals', q: 'What is the top speed of a lion (in km/h)?', a: 80, unit: 'km/h' },
  { cat: 'Animals', q: 'What is the top speed of an ostrich (in km/h)?', a: 70, unit: 'km/h' },
  { cat: 'Animals', q: 'What is the top speed of a racehorse (in km/h)?', a: 88, unit: 'km/h' },
  { cat: 'Animals', q: 'How much does an adult African elephant weigh (in kg)?', a: 6000, unit: 'kg' },
  { cat: 'Animals', q: 'How much does a blue whale weigh (in kg)?', a: 150000, unit: 'kg' },
  { cat: 'Animals', q: 'How long can a blue whale grow (in meters)?', a: 30, unit: 'meters' },
  { cat: 'Animals', q: 'How much does a blue whale\'s heart weigh (in kg)?', a: 180, unit: 'kg' },
  { cat: 'Animals', q: 'How tall is an adult giraffe (in meters)?', a: 5.5, unit: 'meters' },
  { cat: 'Animals', q: 'How many times per second does a hummingbird flap its wings?', a: 50, unit: 'flaps/second' },
  { cat: 'Animals', q: 'How many hours a day does a koala sleep?', a: 20, unit: 'hours' },
  { cat: 'Animals', q: 'How many hours a day does a cat sleep?', a: 15, unit: 'hours' },
  { cat: 'Animals', q: 'How many years can a giant tortoise live?', a: 150, unit: 'years' },
  { cat: 'Animals', q: 'How many years can a Greenland shark live?', a: 400, unit: 'years' },
  { cat: 'Animals', q: 'How many years can a bowhead whale live?', a: 200, unit: 'years' },
  { cat: 'Animals', q: 'How many months is an elephant pregnant?', a: 22, unit: 'months' },
  { cat: 'Animals', q: 'How many teeth does an adult great white shark have (at one time)?', a: 300, unit: 'teeth' },
  { cat: 'Animals', q: 'How many species of spiders are there (approximately)?', a: 50000, unit: 'species' },
  { cat: 'Animals', q: 'How many species of birds are there (approximately)?', a: 11000, unit: 'species' },
  { cat: 'Animals', q: 'How many species of fish are there (approximately)?', a: 34000, unit: 'species' },
  { cat: 'Animals', q: 'How many species of mammals are there (approximately)?', a: 6500, unit: 'species' },
  { cat: 'Animals', q: 'How many species of penguins are there?', a: 18, unit: 'species' },
  { cat: 'Animals', q: 'How many species of sharks are there (approximately)?', a: 500, unit: 'species' },
  { cat: 'Animals', q: 'How long was a T-Rex (in meters)?', a: 12, unit: 'meters' },
  { cat: 'Animals', q: 'How many teeth did a T-Rex have?', a: 60, unit: 'teeth' },
  { cat: 'Animals', q: 'What is the bite force of a saltwater crocodile (in psi)?', a: 3700, unit: 'psi' },
  { cat: 'Animals', q: 'How far can a kangaroo jump in one leap (in meters)?', a: 9, unit: 'meters' },
  { cat: 'Animals', q: 'How many times its own body length can a flea jump?', a: 100, unit: 'times' },
  { cat: 'Animals', q: 'How many times its own body weight can an ant lift?', a: 50, unit: 'times' },
  { cat: 'Animals', q: 'How many flowers does a honeybee visit per day (approximately)?', a: 2000, unit: 'flowers' },
  { cat: 'Animals', q: 'How many km do monarch butterflies migrate (one way)?', a: 4800, unit: 'km' },
  { cat: 'Animals', q: 'How many km does an Arctic tern fly per year (round trip migration)?', a: 70000, unit: 'km' },
  { cat: 'Animals', q: 'How many kg of food does an elephant eat per day?', a: 150, unit: 'kg' },
  { cat: 'Animals', q: 'How many kg of bamboo does a panda eat per day?', a: 12, unit: 'kg' },
  { cat: 'Animals', q: 'What is the heart rate of a hummingbird in flight (beats per minute)?', a: 1200, unit: 'bpm' },
  { cat: 'Animals', q: 'How many bones does a cat have?', a: 230, unit: 'bones' },
  { cat: 'Animals', q: 'How many recognized dog breeds are there worldwide (approximately)?', a: 360, unit: 'breeds' },
  { cat: 'Animals', q: 'How many chickens are there in the world (in billions)?', a: 26, unit: 'billion' },
  { cat: 'Animals', q: 'How many neurons does an octopus have (in millions)?', a: 500, unit: 'million neurons' },
  { cat: 'Animals', q: 'What is the wingspan of a wandering albatross (in cm)?', a: 310, unit: 'cm' },
  { cat: 'Animals', q: 'How many times better is a dog\'s sense of smell than a human\'s (approximately)?', a: 40000, unit: 'times' },
  { cat: 'Animals', q: 'How many meters per minute does a sloth move on the ground?', a: 4, unit: 'meters/minute' },

  // ============ SPORTS ============
  { cat: 'Sports', q: 'What is the men\'s world record for the 100m sprint (in seconds)?', a: 9.58, unit: 'seconds' },
  { cat: 'Sports', q: 'What is the women\'s world record for the 100m sprint (in seconds)?', a: 10.49, unit: 'seconds' },
  { cat: 'Sports', q: 'What is the world record for the marathon (men, in minutes)?', a: 120.58, unit: 'minutes' },
  { cat: 'Sports', q: 'How long is a marathon (in km)?', a: 42.195, unit: 'km' },
  { cat: 'Sports', q: 'How long is a full Ironman triathlon in total (in km)?', a: 226, unit: 'km' },
  { cat: 'Sports', q: 'How many players are on the field in a soccer match (both teams total)?', a: 22, unit: 'players' },
  { cat: 'Sports', q: 'How many career goals has Cristiano Ronaldo scored (club + country, approximately)?', a: 940, unit: 'goals' },
  { cat: 'Sports', q: 'How many points did Wilt Chamberlain score in his famous single NBA game?', a: 100, unit: 'points' },
  { cat: 'Sports', q: 'How many career NBA points does LeBron James have (approximately)?', a: 42000, unit: 'points' },
  { cat: 'Sports', q: 'How long is an Olympic swimming pool (in meters)?', a: 50, unit: 'meters' },
  { cat: 'Sports', q: 'How many Grand Slam singles titles does Novak Djokovic have?', a: 24, unit: 'titles' },
  { cat: 'Sports', q: 'What is the maximum break in snooker?', a: 147, unit: 'points' },
  { cat: 'Sports', q: 'How many dimples does a typical golf ball have?', a: 336, unit: 'dimples' },
  { cat: 'Sports', q: 'How high is an NBA basketball hoop (in cm)?', a: 305, unit: 'cm' },
  { cat: 'Sports', q: 'How many World Cups has Brazil won (men\'s soccer)?', a: 5, unit: 'World Cups' },
  { cat: 'Sports', q: 'What distance is the Tour de France (approximately, in km)?', a: 3500, unit: 'km' },
  { cat: 'Sports', q: 'How many teams will play in the 2026 FIFA World Cup?', a: 48, unit: 'teams' },
  { cat: 'Sports', q: 'How many games are in an NBA regular season (per team)?', a: 82, unit: 'games' },
  { cat: 'Sports', q: 'How many games are in an NFL regular season (per team)?', a: 17, unit: 'games' },
  { cat: 'Sports', q: 'How many games are in an MLB regular season (per team)?', a: 162, unit: 'games' },
  { cat: 'Sports', q: 'How many events were at the Paris 2024 Olympics?', a: 329, unit: 'events' },
  { cat: 'Sports', q: 'What is the diameter of a basketball (in cm)?', a: 24, unit: 'cm' },
  { cat: 'Sports', q: 'What is the length of a tennis court (in meters)?', a: 23.77, unit: 'meters' },
  { cat: 'Sports', q: 'How many chess pieces are on the board at the start of a game?', a: 32, unit: 'pieces' },
  { cat: 'Sports', q: 'How many possible first moves does White have in chess?', a: 20, unit: 'moves' },
  { cat: 'Sports', q: 'How many world chess champions have there been (classical)?', a: 17, unit: 'champions' },
  { cat: 'Sports', q: 'How many rounds is a professional boxing championship fight (maximum)?', a: 12, unit: 'rounds' },
  { cat: 'Sports', q: 'How many races were in the 2025 Formula 1 season?', a: 24, unit: 'races' },
  { cat: 'Sports', q: 'What is the fastest speed ever recorded in Formula 1 (in km/h)?', a: 372, unit: 'km/h' },
  { cat: 'Sports', q: 'How many World Series titles do the New York Yankees have?', a: 27, unit: 'titles' },
  { cat: 'Sports', q: 'How many Stanley Cups have the Montreal Canadiens won?', a: 24, unit: 'Stanley Cups' },
  { cat: 'Sports', q: 'What is the fastest recorded tennis serve (in km/h)?', a: 263, unit: 'km/h' },
  { cat: 'Sports', q: 'How many hours did the longest professional tennis match last?', a: 11, unit: 'hours' },
  { cat: 'Sports', q: 'How many people summit Mount Everest per year (approximately)?', a: 800, unit: 'climbers' },
  { cat: 'Sports', q: 'How many career home runs did Barry Bonds hit (MLB record)?', a: 762, unit: 'home runs' },
  { cat: 'Sports', q: 'How many Olympic medals (total) does Michael Phelps have?', a: 28, unit: 'medals' },
  { cat: 'Sports', q: 'How many Ballon d\'Or awards has Lionel Messi won?', a: 8, unit: 'awards' },
  { cat: 'Sports', q: 'How many NBA championships did Michael Jordan win?', a: 6, unit: 'championships' },
  { cat: 'Sports', q: 'How many Super Bowls has Tom Brady won?', a: 7, unit: 'Super Bowls' },
  { cat: 'Sports', q: 'How many Wimbledon singles titles does Roger Federer have?', a: 8, unit: 'titles' },
  { cat: 'Sports', q: 'What is the men\'s high jump world record (in cm)?', a: 245, unit: 'cm' },
  { cat: 'Sports', q: 'What is the men\'s pole vault world record (in cm)?', a: 630, unit: 'cm' },
  { cat: 'Sports', q: 'What is the men\'s long jump world record (in cm)?', a: 895, unit: 'cm' },

  // ============ MOVIES & TV ============
  { cat: 'Movies & TV', q: 'How much did Avatar (2009) gross worldwide (in US dollars)?', a: 2920000000, unit: 'US$' },
  { cat: 'Movies & TV', q: 'How much did Avengers: Endgame gross worldwide (in US dollars)?', a: 2800000000, unit: 'US$' },
  { cat: 'Movies & TV', q: 'How much did Titanic gross worldwide (in US dollars)?', a: 2260000000, unit: 'US$' },
  { cat: 'Movies & TV', q: 'How much did Star Wars: The Force Awakens gross worldwide (in US dollars)?', a: 2070000000, unit: 'US$' },
  { cat: 'Movies & TV', q: 'How much did Spider-Man: No Way Home gross worldwide (in US dollars)?', a: 1920000000, unit: 'US$' },
  { cat: 'Movies & TV', q: 'How much did Barbie gross worldwide (in US dollars)?', a: 1450000000, unit: 'US$' },
  { cat: 'Movies & TV', q: 'How much did Frozen gross worldwide (in US dollars)?', a: 1280000000, unit: 'US$' },
  { cat: 'Movies & TV', q: 'How much did Oppenheimer gross worldwide (in US dollars)?', a: 970000000, unit: 'US$' },
  { cat: 'Movies & TV', q: 'How much did Joker (2019) gross worldwide (in US dollars)?', a: 1080000000, unit: 'US$' },
  { cat: 'Movies & TV', q: 'How much did The Super Mario Bros. Movie gross worldwide (in US dollars)?', a: 1360000000, unit: 'US$' },
  { cat: 'Movies & TV', q: 'How much did The Dark Knight gross worldwide (in US dollars)?', a: 1006000000, unit: 'US$' },
  { cat: 'Movies & TV', q: 'How much did E.T. gross worldwide (in US dollars)?', a: 790000000, unit: 'US$' },
  { cat: 'Movies & TV', q: 'How much did Inside Out 2 gross worldwide (in US dollars)?', a: 1700000000, unit: 'US$' },
  { cat: 'Movies & TV', q: 'In what year was The Wizard of Oz released?', a: 1939, unit: 'year' },
  { cat: 'Movies & TV', q: 'In what year was Casablanca released?', a: 1942, unit: 'year' },
  { cat: 'Movies & TV', q: 'In what year was The Godfather released?', a: 1972, unit: 'year' },
  { cat: 'Movies & TV', q: 'In what year was Jaws released?', a: 1975, unit: 'year' },
  { cat: 'Movies & TV', q: 'In what year was the first Star Wars movie released?', a: 1977, unit: 'year' },
  { cat: 'Movies & TV', q: 'In what year was Back to the Future released?', a: 1985, unit: 'year' },
  { cat: 'Movies & TV', q: 'In what year was The Terminator released?', a: 1984, unit: 'year' },
  { cat: 'Movies & TV', q: 'In what year was Jurassic Park released?', a: 1993, unit: 'year' },
  { cat: 'Movies & TV', q: 'In what year was Pulp Fiction released?', a: 1994, unit: 'year' },
  { cat: 'Movies & TV', q: 'In what year was Toy Story released?', a: 1995, unit: 'year' },
  { cat: 'Movies & TV', q: 'In what year was The Matrix released?', a: 1999, unit: 'year' },
  { cat: 'Movies & TV', q: 'In what year was The Lord of the Rings: The Fellowship of the Ring released?', a: 2001, unit: 'year' },
  { cat: 'Movies & TV', q: 'In what year was Finding Nemo released?', a: 2003, unit: 'year' },
  { cat: 'Movies & TV', q: 'In what year was Parasite released?', a: 2019, unit: 'year' },
  { cat: 'Movies & TV', q: 'How many Oscars did Titanic win?', a: 11, unit: 'Oscars' },
  { cat: 'Movies & TV', q: 'How many Oscars did The Lord of the Rings: The Return of the King win?', a: 11, unit: 'Oscars' },
  { cat: 'Movies & TV', q: 'How many episodes of The Simpsons have aired (approximately)?', a: 790, unit: 'episodes' },
  { cat: 'Movies & TV', q: 'How many seasons of The Simpsons have aired (approximately)?', a: 36, unit: 'seasons' },
  { cat: 'Movies & TV', q: 'How long is the extended version of The Return of the King (in minutes)?', a: 263, unit: 'minutes' },
  { cat: 'Movies & TV', q: 'How many official James Bond films have been made?', a: 25, unit: 'films' },
  { cat: 'Movies & TV', q: 'How many seasons of Friends were made?', a: 10, unit: 'seasons' },
  { cat: 'Movies & TV', q: 'How many episodes of Seinfeld were made?', a: 180, unit: 'episodes' },
  { cat: 'Movies & TV', q: 'How many episodes of The Office (US) were made?', a: 201, unit: 'episodes' },
  { cat: 'Movies & TV', q: 'How many episodes of Breaking Bad were made?', a: 62, unit: 'episodes' },
  { cat: 'Movies & TV', q: 'How many episodes of Game of Thrones were made?', a: 73, unit: 'episodes' },
  { cat: 'Movies & TV', q: 'What did a 30-second Super Bowl ad cost in 2025 (in US dollars)?', a: 8000000, unit: 'US$' },
  { cat: 'Movies & TV', q: 'How many films are in the Marvel Cinematic Universe (approximately)?', a: 36, unit: 'films' },
  { cat: 'Movies & TV', q: 'How many Harry Potter films are there?', a: 8, unit: 'films' },
  { cat: 'Movies & TV', q: 'How many Fast & Furious main-series films are there?', a: 10, unit: 'films' },
  { cat: 'Movies & TV', q: 'How many minutes long is the longest Best Picture winner, Gone with the Wind?', a: 238, unit: 'minutes' },
  { cat: 'Movies & TV', q: 'How many Oscar nominations does Meryl Streep have?', a: 21, unit: 'nominations' },
  { cat: 'Movies & TV', q: 'How many Netflix subscribers are there worldwide (approximately)?', a: 300000000, unit: 'subscribers' },

  // ============ MUSIC ============
  { cat: 'Music', q: 'How many studio albums did The Beatles release?', a: 13, unit: 'albums' },
  { cat: 'Music', q: 'How many songs did The Beatles officially release (approximately)?', a: 213, unit: 'songs' },
  { cat: 'Music', q: 'How many #1 Billboard Hot 100 hits do The Beatles have?', a: 20, unit: 'hits' },
  { cat: 'Music', q: 'How many #1 Billboard Hot 100 hits did Elvis Presley have?', a: 18, unit: 'hits' },
  { cat: 'Music', q: 'How many copies has Michael Jackson\'s Thriller sold worldwide (approximately)?', a: 70000000, unit: 'copies' },
  { cat: 'Music', q: 'How many keys does a standard piano have?', a: 88, unit: 'keys' },
  { cat: 'Music', q: 'How many strings does a standard harp have?', a: 47, unit: 'strings' },
  { cat: 'Music', q: 'How many strings does a violin have?', a: 4, unit: 'strings' },
  { cat: 'Music', q: 'How many musicians are in a full symphony orchestra (approximately)?', a: 100, unit: 'musicians' },
  { cat: 'Music', q: 'How many symphonies did Beethoven complete?', a: 9, unit: 'symphonies' },
  { cat: 'Music', q: 'How many works did Mozart compose (approximately)?', a: 600, unit: 'works' },
  { cat: 'Music', q: 'How many children did Johann Sebastian Bach have?', a: 20, unit: 'children' },
  { cat: 'Music', q: 'How many countries participated in Eurovision 2025?', a: 37, unit: 'countries' },
  { cat: 'Music', q: 'In what year was Spotify launched?', a: 2008, unit: 'year' },
  { cat: 'Music', q: 'How many tracks are on Spotify (approximately)?', a: 100000000, unit: 'tracks' },
  { cat: 'Music', q: 'How many people attended Woodstock in 1969 (approximately)?', a: 400000, unit: 'people' },
  { cat: 'Music', q: 'What is the length of Bohemian Rhapsody (in seconds)?', a: 355, unit: 'seconds' },
  { cat: 'Music', q: 'How much did Taylor Swift\'s Eras Tour gross (in US dollars)?', a: 2080000000, unit: 'US$' },
  { cat: 'Music', q: 'How many people attend Coachella per day (approximately)?', a: 125000, unit: 'people' },
  { cat: 'Music', q: 'How many Grammy award categories are there?', a: 94, unit: 'categories' },
  { cat: 'Music', q: 'What is the record price paid for a violin (a Stradivarius, in US dollars)?', a: 15900000, unit: 'US$' },
  { cat: 'Music', q: 'How many minutes of music fit on a standard CD?', a: 80, unit: 'minutes' },
  { cat: 'Music', q: 'In what year was Live Aid held?', a: 1985, unit: 'year' },
  { cat: 'Music', q: 'In what year did MTV launch?', a: 1981, unit: 'year' },

  // ============ FOOD & DRINK ============
  { cat: 'Food & Drink', q: 'How many calories are in a Big Mac?', a: 590, unit: 'calories' },
  { cat: 'Food & Drink', q: 'How many calories are in a medium banana?', a: 105, unit: 'calories' },
  { cat: 'Food & Drink', q: 'How many calories are in a slice of pepperoni pizza?', a: 285, unit: 'calories' },
  { cat: 'Food & Drink', q: 'How many calories are in a tablespoon of olive oil?', a: 119, unit: 'calories' },
  { cat: 'Food & Drink', q: 'How many cups of coffee are consumed worldwide per day (approximately)?', a: 2250000000, unit: 'cups' },
  { cat: 'Food & Drink', q: 'How many Coca-Cola servings are consumed per day worldwide (approximately)?', a: 1900000000, unit: 'servings' },
  { cat: 'Food & Drink', q: 'How many varieties of pasta shapes exist (approximately)?', a: 350, unit: 'shapes' },
  { cat: 'Food & Drink', q: 'How many kg of pasta does the average Italian eat per year?', a: 23, unit: 'kg' },
  { cat: 'Food & Drink', q: 'How much did the most expensive pizza in the world cost (in US dollars)?', a: 12000, unit: 'US$' },
  { cat: 'Food & Drink', q: 'How many McDonald\'s restaurants are there worldwide (approximately)?', a: 42000, unit: 'restaurants' },
  { cat: 'Food & Drink', q: 'How many customers does McDonald\'s serve per day worldwide (approximately)?', a: 69000000, unit: 'customers' },
  { cat: 'Food & Drink', q: 'How many Starbucks stores are there worldwide (approximately)?', a: 38000, unit: 'stores' },
  { cat: 'Food & Drink', q: 'How many restaurants are there in New York City (approximately)?', a: 25000, unit: 'restaurants' },
  { cat: 'Food & Drink', q: 'How many liters of beer does the average German drink per year?', a: 88, unit: 'liters' },
  { cat: 'Food & Drink', q: 'How many bananas does the average person eat per year (worldwide average)?', a: 130, unit: 'bananas' },
  { cat: 'Food & Drink', q: 'What temperature should a Neapolitan pizza oven reach (in °C)?', a: 485, unit: '°C' },
  { cat: 'Food & Drink', q: 'How many kg of chocolate does the average Swiss person eat per year?', a: 11, unit: 'kg' },
  { cat: 'Food & Drink', q: 'How many grapes does it take to make one bottle of wine (approximately)?', a: 700, unit: 'grapes' },
  { cat: 'Food & Drink', q: 'What percentage of a watermelon is water?', a: 92, unit: '%' },
  { cat: 'Food & Drink', q: 'How many Scoville units is Pepper X, the hottest chili (in millions)?', a: 2.69, unit: 'million Scoville' },
  { cat: 'Food & Drink', q: 'How many Scoville units is a jalapeño (typical)?', a: 5000, unit: 'Scoville' },
  { cat: 'Food & Drink', q: 'In what year was the first solid chocolate bar made?', a: 1847, unit: 'year' },
  { cat: 'Food & Drink', q: 'How many jars of Nutella are sold per year worldwide (approximately)?', a: 365000000, unit: 'jars' },
  { cat: 'Food & Drink', q: 'How many eggs does the average American eat per year?', a: 280, unit: 'eggs' },
  { cat: 'Food & Drink', q: 'How many varieties of cheese does France produce (approximately)?', a: 1000, unit: 'varieties' },
  { cat: 'Food & Drink', q: 'How many bubbles are in a bottle of champagne (estimated, in millions)?', a: 49, unit: 'million bubbles' },
  { cat: 'Food & Drink', q: 'What is the record for most hot dogs eaten in 10 minutes?', a: 83, unit: 'hot dogs' },
  { cat: 'Food & Drink', q: 'How heavy was the heaviest watermelon ever grown (in kg)?', a: 159, unit: 'kg' },
  { cat: 'Food & Drink', q: 'How heavy was the heaviest pumpkin ever grown (in kg)?', a: 1247, unit: 'kg' },
  { cat: 'Food & Drink', q: 'How many pizza slices are eaten per second in the US?', a: 350, unit: 'slices' },

  // ============ GEOGRAPHY (landmarks & records) ============
  { cat: 'Geography', q: 'How long is the Nile river (in km)?', a: 6650, unit: 'km' },
  { cat: 'Geography', q: 'How long is the Amazon river (in km)?', a: 6400, unit: 'km' },
  { cat: 'Geography', q: 'How long is the Yangtze river (in km)?', a: 6300, unit: 'km' },
  { cat: 'Geography', q: 'How long is the Mississippi river (in km)?', a: 3766, unit: 'km' },
  { cat: 'Geography', q: 'How long is the Danube river (in km)?', a: 2850, unit: 'km' },
  { cat: 'Geography', q: 'How tall is Mount Everest (in meters)?', a: 8849, unit: 'meters' },
  { cat: 'Geography', q: 'How tall is K2 (in meters)?', a: 8611, unit: 'meters' },
  { cat: 'Geography', q: 'How tall is Mount Kilimanjaro (in meters)?', a: 5895, unit: 'meters' },
  { cat: 'Geography', q: 'How tall is Mont Blanc (in meters)?', a: 4808, unit: 'meters' },
  { cat: 'Geography', q: 'How tall is Mount Fuji (in meters)?', a: 3776, unit: 'meters' },
  { cat: 'Geography', q: 'How tall is Denali (in meters)?', a: 6190, unit: 'meters' },
  { cat: 'Geography', q: 'How tall is the Burj Khalifa (in meters)?', a: 828, unit: 'meters' },
  { cat: 'Geography', q: 'How tall is the Eiffel Tower (in meters)?', a: 330, unit: 'meters' },
  { cat: 'Geography', q: 'How tall is the Empire State Building including antenna (in meters)?', a: 443, unit: 'meters' },
  { cat: 'Geography', q: 'How tall is the Statue of Liberty including pedestal (in meters)?', a: 93, unit: 'meters' },
  { cat: 'Geography', q: 'How tall is Big Ben\'s tower (in meters)?', a: 96, unit: 'meters' },
  { cat: 'Geography', q: 'How tall is One World Trade Center (in meters)?', a: 541, unit: 'meters' },
  { cat: 'Geography', q: 'How tall is the CN Tower in Toronto (in meters)?', a: 553, unit: 'meters' },
  { cat: 'Geography', q: 'How tall is the Great Pyramid of Giza today (in meters)?', a: 139, unit: 'meters' },
  { cat: 'Geography', q: 'How tall is the Christ the Redeemer statue in Rio (in meters)?', a: 38, unit: 'meters' },
  { cat: 'Geography', q: 'How long is the Golden Gate Bridge (in meters)?', a: 2737, unit: 'meters' },
  { cat: 'Geography', q: 'How long is the Channel Tunnel (in km)?', a: 50, unit: 'km' },
  { cat: 'Geography', q: 'How long is the Panama Canal (in km)?', a: 82, unit: 'km' },
  { cat: 'Geography', q: 'How long is the Suez Canal (in km)?', a: 193, unit: 'km' },
  { cat: 'Geography', q: 'How deep is the Grand Canyon at its deepest (in meters)?', a: 1857, unit: 'meters' },
  { cat: 'Geography', q: 'How long is the Grand Canyon (in km)?', a: 446, unit: 'km' },
  { cat: 'Geography', q: 'How far below sea level is the Dead Sea shore (in meters)?', a: 430, unit: 'meters below sea level' },
  { cat: 'Geography', q: 'How deep is Lake Baikal, the world\'s deepest lake (in meters)?', a: 1642, unit: 'meters' },
  { cat: 'Geography', q: 'What is the area of the Caspian Sea (in km²)?', a: 371000, unit: 'km²' },
  { cat: 'Geography', q: 'What is the area of the Sahara desert (in millions of km²)?', a: 9.2, unit: 'million km²' },
  { cat: 'Geography', q: 'What is the area of the Amazon rainforest (in millions of km²)?', a: 5.5, unit: 'million km²' },
  { cat: 'Geography', q: 'What is the area of Antarctica (in millions of km²)?', a: 14.2, unit: 'million km²' },
  { cat: 'Geography', q: 'What is the area of Greenland (in km²)?', a: 2166000, unit: 'km²' },
  { cat: 'Geography', q: 'What is the area of Vatican City (in km²)?', a: 0.44, unit: 'km²' },
  { cat: 'Geography', q: 'What is the area of Monaco (in km²)?', a: 2.02, unit: 'km²' },
  { cat: 'Geography', q: 'What is the area of Central Park in NYC (in km²)?', a: 3.41, unit: 'km²' },
  { cat: 'Geography', q: 'How many countries are there in the world (UN members + observers)?', a: 195, unit: 'countries' },
  { cat: 'Geography', q: 'How many countries are in the European Union?', a: 27, unit: 'countries' },
  { cat: 'Geography', q: 'How many countries are there in Africa?', a: 54, unit: 'countries' },
  { cat: 'Geography', q: 'How many US national parks are there?', a: 63, unit: 'parks' },
  { cat: 'Geography', q: 'How many UNESCO World Heritage sites are there (approximately)?', a: 1200, unit: 'sites' },
  { cat: 'Geography', q: 'How tall is Niagara Falls (in meters)?', a: 51, unit: 'meters' },
  { cat: 'Geography', q: 'How tall is Angel Falls, the world\'s highest waterfall (in meters)?', a: 979, unit: 'meters' },
  { cat: 'Geography', q: 'What is the length of the equator (in km)?', a: 40075, unit: 'km' },
  { cat: 'Geography', q: 'How many islands does Indonesia have (approximately)?', a: 17500, unit: 'islands' },
  { cat: 'Geography', q: 'What is the deepest point of the ocean (Mariana Trench, in meters)?', a: 10935, unit: 'meters' },
  { cat: 'Geography', q: 'How many time zones does Russia span?', a: 11, unit: 'time zones' },
  { cat: 'Geography', q: 'How long is the Great Wall of China (all sections, in km)?', a: 21196, unit: 'km' },
  { cat: 'Geography', q: 'How long is the Great Barrier Reef (in km)?', a: 2300, unit: 'km' },

  // ============ RANDOM & WEIRD ============
  { cat: 'Random & Weird', q: 'How many steps are there to the top of the Eiffel Tower?', a: 1665, unit: 'steps' },
  { cat: 'Random & Weird', q: 'How many languages are spoken in the world (approximately)?', a: 7000, unit: 'languages' },
  { cat: 'Random & Weird', q: 'How many words are there in the English language (approximately)?', a: 170000, unit: 'words' },
  { cat: 'Random & Weird', q: 'How many pages does War and Peace have (typical edition)?', a: 1225, unit: 'pages' },
  { cat: 'Random & Weird', q: 'How many words are in the entire Harry Potter series (approximately)?', a: 1084000, unit: 'words' },
  { cat: 'Random & Weird', q: 'How many Harry Potter books have been sold worldwide (approximately)?', a: 600000000, unit: 'copies' },
  { cat: 'Random & Weird', q: 'How many copies of the Bible have been sold (estimated, in billions)?', a: 5, unit: 'billion copies' },
  { cat: 'Random & Weird', q: 'How many times does the average person blink per day?', a: 19200, unit: 'blinks' },
  { cat: 'Random & Weird', q: 'How many LEGO bricks are produced per year (approximately)?', a: 36000000000, unit: 'bricks' },
  { cat: 'Random & Weird', q: 'How many possible combinations does a Rubik\'s Cube have (in quintillions)?', a: 43, unit: 'quintillion' },
  { cat: 'Random & Weird', q: 'How many tons of paint are used to repaint the Eiffel Tower?', a: 60, unit: 'tons' },
  { cat: 'Random & Weird', q: 'In what year was Oxford University founded (teaching began)?', a: 1096, unit: 'year' },
  { cat: 'Random & Weird', q: 'In what year was Harvard founded?', a: 1636, unit: 'year' },
  { cat: 'Random & Weird', q: 'How many books does the Library of Congress hold (approximately)?', a: 25000000, unit: 'books' },
  { cat: 'Random & Weird', q: 'How many airplanes are in the sky at any given moment (approximately)?', a: 10000, unit: 'airplanes' },
  { cat: 'Random & Weird', q: 'How many commercial flights take off per day worldwide (approximately)?', a: 100000, unit: 'flights' },
  { cat: 'Random & Weird', q: 'How many parts does a Boeing 747 have (approximately)?', a: 6000000, unit: 'parts' },
  { cat: 'Random & Weird', q: 'How many cars are there in the world (in billions)?', a: 1.5, unit: 'billion cars' },
  { cat: 'Random & Weird', q: 'How many bicycles are there in the world (in billions)?', a: 1, unit: 'billion bicycles' },
  { cat: 'Random & Weird', q: 'How many iPhones has Apple sold in total (in billions)?', a: 2.3, unit: 'billion' },
  { cat: 'Random & Weird', q: 'How many people use the internet worldwide (in billions)?', a: 5.5, unit: 'billion people' },
  { cat: 'Random & Weird', q: 'How many websites exist (approximately, in billions)?', a: 1.1, unit: 'billion websites' },
  { cat: 'Random & Weird', q: 'How many emails are sent worldwide per day (approximately)?', a: 360000000000, unit: 'emails' },
  { cat: 'Random & Weird', q: 'How many Google searches happen per day (in billions)?', a: 8.5, unit: 'billion searches' },
  { cat: 'Random & Weird', q: 'How many hours of video are uploaded to YouTube every minute?', a: 500, unit: 'hours' },
  { cat: 'Random & Weird', q: 'How many TikTok users are there worldwide (in billions)?', a: 1.6, unit: 'billion users' },
  { cat: 'Random & Weird', q: 'How many WhatsApp messages are sent per day (in billions)?', a: 100, unit: 'billion messages' },
  { cat: 'Random & Weird', q: 'How many letters are in the longest English dictionary word (pneumonoultra...)?', a: 45, unit: 'letters' },
  { cat: 'Random & Weird', q: 'How many letters are in the longest official place name in the world (in New Zealand)?', a: 85, unit: 'letters' },
  { cat: 'Random & Weird', q: 'How many km does the average person walk in a lifetime?', a: 120000, unit: 'km' },
  { cat: 'Random & Weird', q: 'How many times does a human heart beat in a lifetime (in billions)?', a: 2.5, unit: 'billion beats' },
  { cat: 'Random & Weird', q: 'How many dreams does a person have per night (on average)?', a: 4, unit: 'dreams' },
  { cat: 'Random & Weird', q: 'How fast does a sneeze travel (in km/h)?', a: 160, unit: 'km/h' },
  { cat: 'Random & Weird', q: 'How many years did the longest recorded case of hiccups last?', a: 68, unit: 'years' },
  { cat: 'Random & Weird', q: 'What is the current world population (in billions)?', a: 8.2, unit: 'billion people' },
  { cat: 'Random & Weird', q: 'How many babies are born per day worldwide (approximately)?', a: 385000, unit: 'babies' },
  { cat: 'Random & Weird', q: 'How many humans have ever lived (estimated, in billions)?', a: 117, unit: 'billion people' },
  { cat: 'Random & Weird', q: 'What is the average height of Dutch men, the world\'s tallest (in cm)?', a: 184, unit: 'cm' },
  { cat: 'Random & Weird', q: 'What is the life expectancy in Japan (in years)?', a: 84, unit: 'years' },
  { cat: 'Random & Weird', q: 'What is the average global life expectancy (in years)?', a: 73, unit: 'years' },
  { cat: 'Random & Weird', q: 'How many billionaires are there in the world (approximately)?', a: 2800, unit: 'billionaires' },
  { cat: 'Random & Weird', q: 'How many buildings taller than 150m does New York City have?', a: 316, unit: 'buildings' },
  { cat: 'Random & Weird', q: 'How many countries drive on the left side of the road?', a: 75, unit: 'countries' },
  { cat: 'Random & Weird', q: 'How many time zones are there in the world?', a: 38, unit: 'time zones' },
  { cat: 'Random & Weird', q: 'How many rooms are in Buckingham Palace?', a: 775, unit: 'rooms' },
  { cat: 'Random & Weird', q: 'How heavy is the Statue of Liberty (in tons)?', a: 225, unit: 'tons' },
  { cat: 'Random & Weird', q: 'How long is the longest fingernail ever recorded (single nail, in cm)?', a: 197, unit: 'cm' },
  { cat: 'Random & Weird', q: 'How many pieces are in the largest commercially sold jigsaw puzzle?', a: 54000, unit: 'pieces' },
  { cat: 'Random & Weird', q: 'How many pigeons live in New York City (approximately)?', a: 1000000, unit: 'pigeons' },
  { cat: 'Random & Weird', q: 'How many elevators does the Empire State Building have?', a: 73, unit: 'elevators' },
];

// ---------------------------------------------------------------------------
// Build the full question bank

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const Y = require('./data/years');
const N = require('./data/numbers');
const STATIC_EXTRA = require('./data/static-extra');

function buildQuestions() {
  const qs = [];

  for (const [name, popM, area, gdpB] of [...COUNTRIES, ...N.MORE_COUNTRIES]) {
    qs.push({ cat: 'Geography', q: `What is the population of ${name}?`, a: Math.round(popM * 1e6), unit: 'people' });
    qs.push({ cat: 'Geography', q: `What is the area of ${name} (in km²)?`, a: area, unit: 'km²' });
    if (gdpB) qs.push({ cat: 'Geography', q: `What is the GDP of ${name} (in US dollars)?`, a: Math.round(gdpB * 1e9), unit: 'US$' });
  }

  for (const [name, popM, area] of US_STATES) {
    qs.push({ cat: 'Geography', q: `What is the population of ${name}?`, a: Math.round(popM * 1e6), unit: 'people' });
    qs.push({ cat: 'Geography', q: `What is the area of ${name} (in km²)?`, a: area, unit: 'km²' });
  }

  for (const [name, popM] of CITY_POP) {
    qs.push({ cat: 'Geography', q: `What is the population of ${name}?`, a: Math.round(popM * 1e6), unit: 'people' });
  }

  // Only every other pair -> ~half the distance questions
  for (let i = 0; i < CITY_GEO.length; i++) {
    for (let j = i + 1; j < CITY_GEO.length; j++) {
      if ((i + j) % 2 !== 0) continue;
      const [n1, la1, lo1] = CITY_GEO[i];
      const [n2, la2, lo2] = CITY_GEO[j];
      const d = Math.round(haversineKm(la1, lo1, la2, lo2) / 10) * 10;
      qs.push({ cat: 'Geography', q: `What is the straight-line distance from ${n1} to ${n2} (in km)?`, a: d, unit: 'km' });
    }
  }

  for (const [name, birth] of [...AGES, ...N.MORE_AGES]) {
    qs.push({ cat: 'People', q: `How old is ${name}?`, birth, unit: 'years' });
  }

  for (const [name, b] of NET_WORTH) {
    qs.push({ cat: 'People', q: `What is ${name}'s estimated net worth (in US dollars)?`, a: Math.round(b * 1e9), unit: 'US$' });
  }

  // ---- Year generators ----
  for (const [c, y] of Y.COMPANIES_FOUNDED) qs.push({ cat: 'Business & Tech', q: `In what year was ${c} founded?`, a: y, unit: 'year' });
  for (const [m, y] of Y.MOVIES) qs.push({ cat: 'Movies & TV', q: `In what year was the movie "${m}" released?`, a: y, unit: 'year' });
  for (const [t, y] of Y.TV_SHOWS) qs.push({ cat: 'Movies & TV', q: `In what year did "${t}" first air on TV?`, a: y, unit: 'year' });
  for (const [b, y] of Y.BOOKS) qs.push({ cat: 'Books & Literature', q: `In what year was "${b}" published?`, a: y, unit: 'year' });
  for (const [i, y] of Y.INVENTIONS) qs.push({ cat: 'Science & Nature', q: `In what year was ${i} invented/introduced?`, a: y, unit: 'year' });
  for (const [p, y] of Y.PRESIDENTS) qs.push({ cat: 'History', q: `In what year did ${p} become US president?`, a: y, unit: 'year' });
  for (const [c, y] of Y.OLYMPICS) qs.push({ cat: 'Sports', q: `In what year did ${c} host the Summer Olympics?`, a: y, unit: 'year' });
  for (const [c, y] of Y.WORLD_CUPS) qs.push({ cat: 'Sports', q: `In what year did ${c} host the FIFA World Cup?`, a: y, unit: 'year' });
  for (const [c, y] of Y.INDEPENDENCE) qs.push({ cat: 'History', q: `In what year did ${c} become independent / founded as a modern state?`, a: y, unit: 'year' });
  for (const [p, y] of Y.DEATHS) qs.push({ cat: 'History', q: `In what year did ${p} die?`, a: y, unit: 'year' });
  for (const [w, y] of Y.WARS) qs.push({ cat: 'History', q: `In what year did ${w} begin?`, a: y, unit: 'year' });
  for (const [g, y] of Y.VIDEO_GAMES) qs.push({ cat: 'Video Games', q: `In what year was ${g} released?`, a: y, unit: 'year' });
  for (const [a, y] of Y.ALBUMS) qs.push({ cat: 'Music', q: `In what year was the album "${a}" released?`, a: y, unit: 'year' });

  // ---- Numeric generators ----
  for (const [p, diam, moons, orbit, dist] of N.PLANETS) {
    qs.push({ cat: 'Space', q: `What is the diameter of ${p} (in km)?`, a: diam, unit: 'km' });
    qs.push({ cat: 'Space', q: `How many days does ${p} take to orbit the Sun?`, a: orbit, unit: 'days' });
    qs.push({ cat: 'Space', q: `How far is ${p} from the Sun (in millions of km)?`, a: dist, unit: 'million km' });
    if (p !== 'Earth' && p !== 'Jupiter') qs.push({ cat: 'Space', q: `How many known moons does ${p} have?`, a: moons, unit: 'moons' });
  }
  for (const [e, n] of N.ELEMENTS) qs.push({ cat: 'Science & Nature', q: `What is the atomic number of ${e}?`, a: n, unit: '(atomic number)' });
  for (const [b, h] of N.BUILDINGS) qs.push({ cat: 'Geography', q: `How tall is ${b} (in meters)?`, a: h, unit: 'meters' });
  for (const [a, life, kg, kmh] of N.ANIMALS) {
    qs.push({ cat: 'Animals', q: `How long does ${a} typically live (in years)?`, a: life, unit: 'years' });
    qs.push({ cat: 'Animals', q: `How much does ${a} weigh (typical adult, in kg)?`, a: kg, unit: 'kg' });
    qs.push({ cat: 'Animals', q: `What is the top speed of ${a} (in km/h)?`, a: kmh, unit: 'km/h' });
  }
  for (const [l, m] of N.LANGUAGES) qs.push({ cat: 'Language & Words', q: `How many native speakers does ${l} have?`, a: Math.round(m * 1e6), unit: 'people' });
  for (const [f, c] of N.CALORIES) qs.push({ cat: 'Food & Drink', q: `How many calories are in ${f}?`, a: c, unit: 'calories' });
  for (const [c, k] of N.EMPLOYEES) qs.push({ cat: 'Business & Tech', q: `How many employees does ${c} have?`, a: Math.round(k * 1000), unit: 'employees' });
  for (const [q, a] of N.CHAMPIONSHIPS) qs.push({ cat: 'Sports', q, a, unit: 'count' });

  qs.push(...STATIC, ...STATIC_EXTRA);

  // Scale huge answers so players type small numbers:
  // ≥1 trillion -> trillions, ≥1 billion -> billions, ≥1 million -> millions.
  // "What is the GDP of France (in US dollars)?" a=3.2e12
  //   becomes "... (answer in trillions)" a=3.2, unit="trillion US$"
  for (const q of qs) {
    if (q.birth || typeof q.a !== 'number') continue;
    const abs = Math.abs(q.a);
    let scale = null, word = null;
    if (abs >= 1e12) { scale = 1e12; word = 'trillion'; }
    else if (abs >= 1e9) { scale = 1e9; word = 'billion'; }
    else if (abs >= 1e6) { scale = 1e6; word = 'million'; }
    if (scale && !q.unit.includes('million') && !q.unit.includes('billion') && !q.unit.includes('trillion')) {
      q.a = Math.round((q.a / scale) * 100) / 100;
      q.unit = `${word} ${q.unit}`;
      q.q = `${q.q.replace(/\?$/, '')}? (answer in ${word}s)`;
    }
  }

  // Safety: drop accidental duplicate question texts
  const seen = new Set();
  return qs.filter((q) => {
    if (seen.has(q.q)) return false;
    seen.add(q.q);
    return true;
  });
}

const QUESTIONS = buildQuestions();

// Resolve a question into a concrete {cat, q, a, unit} at game time
function resolveQuestion(entry) {
  if (entry.birth) {
    const b = new Date(entry.birth + 'T00:00:00Z');
    const now = new Date();
    let age = now.getUTCFullYear() - b.getUTCFullYear();
    const m = now.getUTCMonth() - b.getUTCMonth();
    if (m < 0 || (m === 0 && now.getUTCDate() < b.getUTCDate())) age--;
    return { cat: entry.cat, q: entry.q, a: age, unit: entry.unit };
  }
  return { cat: entry.cat, q: entry.q, a: entry.a, unit: entry.unit };
}

// Pick n questions purely at random (capped at 2 per category so one game
// doesn't drown in Geography), avoiding a given set of used question texts
// (so consecutive games with the same group don't repeat).
function pickQuestions(n, usedTexts = new Set()) {
  const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };
  const avail = shuffle(QUESTIONS.filter((q) => !usedTexts.has(q.q)));
  const picked = [];
  const perCat = {};
  const MAX_PER_CAT = 2;
  for (const q of avail) {
    if (picked.length === n) break;
    if ((perCat[q.cat] || 0) >= MAX_PER_CAT) continue;
    picked.push(q);
    perCat[q.cat] = (perCat[q.cat] || 0) + 1;
  }
  // Fill remainder ignoring the category cap (tiny banks / near-exhaustion)
  for (const q of avail) {
    if (picked.length === n) break;
    if (!picked.includes(q)) picked.push(q);
  }
  // Bank exhausted entirely: recycle from the full bank
  if (picked.length < n) {
    const already = new Set(picked.map((p) => p.q));
    for (const q of shuffle([...QUESTIONS])) {
      if (picked.length === n) break;
      if (!already.has(q.q)) picked.push(q);
    }
  }
  return shuffle(picked).map(resolveQuestion);
}

module.exports = { QUESTIONS, pickQuestions, resolveQuestion };
