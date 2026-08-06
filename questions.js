// Question bank for Ballpark.
// Two kinds of questions:
//  - static: { cat, q, a, unit }  -> fixed numeric answer
//  - age:    { cat, q, birth: 'YYYY-MM-DD', unit: 'years' } -> answer computed at game time
// Answers are approximate real-world values (circa 2025). The game is about
// closeness, not perfect precision.

const QUESTIONS = [
  // ---------------- GEOGRAPHY ----------------
  { cat: 'Geography', q: 'What is the population of Brazil?', a: 212000000, unit: 'people' },
  { cat: 'Geography', q: 'What is the population of Japan?', a: 124000000, unit: 'people' },
  { cat: 'Geography', q: 'What is the population of Iceland?', a: 390000, unit: 'people' },
  { cat: 'Geography', q: 'What is the population of Australia?', a: 26800000, unit: 'people' },
  { cat: 'Geography', q: 'What is the population of Nigeria?', a: 227000000, unit: 'people' },
  { cat: 'Geography', q: 'What is the area of France (in km²)?', a: 551695, unit: 'km²' },
  { cat: 'Geography', q: 'What is the area of Russia (in km²)?', a: 17098246, unit: 'km²' },
  { cat: 'Geography', q: 'What is the area of Israel (in km²)?', a: 22072, unit: 'km²' },
  { cat: 'Geography', q: 'What is the area of Texas (in km²)?', a: 695662, unit: 'km²' },
  { cat: 'Geography', q: "What is the USA's GDP (in US dollars)?", a: 29000000000000, unit: 'US$' },
  { cat: 'Geography', q: "What is Germany's GDP (in US dollars)?", a: 4700000000000, unit: 'US$' },
  { cat: 'Geography', q: "What is India's GDP (in US dollars)?", a: 3900000000000, unit: 'US$' },
  { cat: 'Geography', q: 'How long is the Nile river (in km)?', a: 6650, unit: 'km' },
  { cat: 'Geography', q: 'How long is the Amazon river (in km)?', a: 6400, unit: 'km' },
  { cat: 'Geography', q: 'How tall is Mount Everest (in meters)?', a: 8849, unit: 'meters' },
  { cat: 'Geography', q: 'How tall is Mount Kilimanjaro (in meters)?', a: 5895, unit: 'meters' },
  { cat: 'Geography', q: 'How many countries are there in Africa?', a: 54, unit: 'countries' },
  { cat: 'Geography', q: 'How many islands does Indonesia have (approximately)?', a: 17500, unit: 'islands' },
  { cat: 'Geography', q: 'What is the deepest point of the ocean (Mariana Trench, in meters)?', a: 10935, unit: 'meters' },
  { cat: 'Geography', q: 'How many time zones does Russia span?', a: 11, unit: 'time zones' },
  { cat: 'Geography', q: 'What is the population of New York City?', a: 8300000, unit: 'people' },
  { cat: 'Geography', q: 'What is the population of Tokyo (greater metro area)?', a: 37000000, unit: 'people' },
  { cat: 'Geography', q: 'What is the distance from New York to Los Angeles (in km, straight line)?', a: 3936, unit: 'km' },
  { cat: 'Geography', q: 'What is the length of the Great Wall of China (all sections, in km)?', a: 21196, unit: 'km' },

  // ---------------- PEOPLE ----------------
  { cat: 'People', q: 'How old is Mick Jagger?', birth: '1943-07-26', unit: 'years' },
  { cat: 'People', q: 'How old is Taylor Swift?', birth: '1989-12-13', unit: 'years' },
  { cat: 'People', q: 'How old is Keanu Reeves?', birth: '1964-09-02', unit: 'years' },
  { cat: 'People', q: 'How old is Oprah Winfrey?', birth: '1954-01-29', unit: 'years' },
  { cat: 'People', q: 'How old is Cristiano Ronaldo?', birth: '1985-02-05', unit: 'years' },
  { cat: 'People', q: 'How old is Paul McCartney?', birth: '1942-06-18', unit: 'years' },
  { cat: 'People', q: 'How old is Rihanna?', birth: '1988-02-20', unit: 'years' },
  { cat: 'People', q: 'How old is Arnold Schwarzenegger?', birth: '1947-07-30', unit: 'years' },
  { cat: 'People', q: "What is Elon Musk's estimated net worth (in US dollars)?", a: 400000000000, unit: 'US$' },
  { cat: 'People', q: "What is Taylor Swift's estimated net worth (in US dollars)?", a: 1600000000, unit: 'US$' },
  { cat: 'People', q: "What is LeBron James's estimated net worth (in US dollars)?", a: 1200000000, unit: 'US$' },
  { cat: 'People', q: 'How many times has Elizabeth Taylor been married?', a: 8, unit: 'marriages' },
  { cat: 'People', q: 'How many children does Elon Musk have (publicly known)?', a: 12, unit: 'children' },
  { cat: 'People', q: 'How many Grammy awards has Beyoncé won?', a: 35, unit: 'Grammys' },
  { cat: 'People', q: 'How many Olympic gold medals does Michael Phelps have?', a: 23, unit: 'gold medals' },
  { cat: 'People', q: 'At what age did Einstein publish his theory of special relativity?', a: 26, unit: 'years old' },
  { cat: 'People', q: 'How old was Queen Elizabeth II when she died?', a: 96, unit: 'years old' },
  { cat: 'People', q: 'How many US presidents have there been (counting Cleveland twice)?', a: 47, unit: 'presidents' },
  { cat: 'People', q: 'How many followers does Cristiano Ronaldo have on Instagram (approximately)?', a: 660000000, unit: 'followers' },
  { cat: 'People', q: 'How tall is Shaquille O\'Neal (in cm)?', a: 216, unit: 'cm' },

  // ---------------- HISTORY ----------------
  { cat: 'History', q: 'In what year did World War II end?', a: 1945, unit: 'year' },
  { cat: 'History', q: 'In what year did humans first land on the Moon?', a: 1969, unit: 'year' },
  { cat: 'History', q: 'In what year did the Titanic sink?', a: 1912, unit: 'year' },
  { cat: 'History', q: 'In what year did the Berlin Wall fall?', a: 1989, unit: 'year' },
  { cat: 'History', q: 'In what year was Google founded?', a: 1998, unit: 'year' },
  { cat: 'History', q: 'In what year was the Eiffel Tower completed?', a: 1889, unit: 'year' },
  { cat: 'History', q: 'In what year did Columbus first reach the Americas?', a: 1492, unit: 'year' },
  { cat: 'History', q: 'In what year was the first iPhone released?', a: 2007, unit: 'year' },
  { cat: 'History', q: 'How many years did the Hundred Years\' War actually last?', a: 116, unit: 'years' },
  { cat: 'History', q: 'How old are the Great Pyramids of Giza (approximately, in years)?', a: 4600, unit: 'years' },
  { cat: 'History', q: 'In what year was the State of Israel established?', a: 1948, unit: 'year' },
  { cat: 'History', q: 'How many people sailed on the Mayflower?', a: 102, unit: 'passengers' },

  // ---------------- SCIENCE & NATURE ----------------
  { cat: 'Science & Nature', q: 'What is the speed of light (in km per second)?', a: 299792, unit: 'km/s' },
  { cat: 'Science & Nature', q: 'How far is the Moon from Earth (average, in km)?', a: 384400, unit: 'km' },
  { cat: 'Science & Nature', q: 'How many bones are in the adult human body?', a: 206, unit: 'bones' },
  { cat: 'Science & Nature', q: 'What is the average human body temperature (in °C, to nearest tenth ok)?', a: 37, unit: '°C' },
  { cat: 'Science & Nature', q: 'How many moons does Jupiter have (confirmed)?', a: 95, unit: 'moons' },
  { cat: 'Science & Nature', q: 'How hot is the surface of the Sun (in °C)?', a: 5500, unit: '°C' },
  { cat: 'Science & Nature', q: 'How many hearts does an octopus have?', a: 3, unit: 'hearts' },
  { cat: 'Science & Nature', q: 'What is the top speed of a cheetah (in km/h)?', a: 112, unit: 'km/h' },
  { cat: 'Science & Nature', q: 'How long can a blue whale grow (in meters)?', a: 30, unit: 'meters' },
  { cat: 'Science & Nature', q: 'How many teeth does an adult great white shark have (at one time)?', a: 300, unit: 'teeth' },
  { cat: 'Science & Nature', q: 'How many days does it take Mercury to orbit the Sun?', a: 88, unit: 'days' },
  { cat: 'Science & Nature', q: 'What percentage of the human body is water?', a: 60, unit: '%' },
  { cat: 'Science & Nature', q: 'How many species of insects have been described (approximately)?', a: 1000000, unit: 'species' },
  { cat: 'Science & Nature', q: 'How long is the DNA in one human cell if stretched out (in meters)?', a: 2, unit: 'meters' },
  { cat: 'Science & Nature', q: 'What is the wingspan of a wandering albatross (in cm)?', a: 310, unit: 'cm' },

  // ---------------- SPORTS ----------------
  { cat: 'Sports', q: "What is the men's world record for the 100m sprint (in seconds)?", a: 9.58, unit: 'seconds' },
  { cat: 'Sports', q: 'What is the world record for the marathon (men, in minutes)?', a: 120.58, unit: 'minutes' },
  { cat: 'Sports', q: 'How many players are on the field in a soccer match (both teams total)?', a: 22, unit: 'players' },
  { cat: 'Sports', q: 'How many career goals has Cristiano Ronaldo scored (club + country, approximately)?', a: 940, unit: 'goals' },
  { cat: 'Sports', q: 'How many points did Wilt Chamberlain score in his famous single NBA game?', a: 100, unit: 'points' },
  { cat: 'Sports', q: 'How long is an Olympic swimming pool (in meters)?', a: 50, unit: 'meters' },
  { cat: 'Sports', q: 'How many Grand Slam singles titles does Novak Djokovic have?', a: 24, unit: 'titles' },
  { cat: 'Sports', q: 'What is the maximum break in snooker?', a: 147, unit: 'points' },
  { cat: 'Sports', q: 'How many dimples does a typical golf ball have?', a: 336, unit: 'dimples' },
  { cat: 'Sports', q: 'How high is an NBA basketball hoop (in cm)?', a: 305, unit: 'cm' },
  { cat: 'Sports', q: 'How many World Cups has Brazil won (men\'s soccer)?', a: 5, unit: 'World Cups' },
  { cat: 'Sports', q: 'What distance is the Tour de France (approximately, in km)?', a: 3500, unit: 'km' },

  // ---------------- MOVIES & TV ----------------
  { cat: 'Movies & TV', q: 'How much money did the movie Avatar (2009) gross worldwide (in US dollars)?', a: 2920000000, unit: 'US$' },
  { cat: 'Movies & TV', q: 'How many Oscars did Titanic win?', a: 11, unit: 'Oscars' },
  { cat: 'Movies & TV', q: 'How many episodes of The Simpsons have aired (approximately)?', a: 790, unit: 'episodes' },
  { cat: 'Movies & TV', q: 'How long is the extended version of The Lord of the Rings: Return of the King (in minutes)?', a: 263, unit: 'minutes' },
  { cat: 'Movies & TV', q: 'How many James Bond films have been made (official Eon productions)?', a: 25, unit: 'films' },
  { cat: 'Movies & TV', q: 'How many seasons of Friends were made?', a: 10, unit: 'seasons' },
  { cat: 'Movies & TV', q: 'What did a 30-second Super Bowl ad cost in 2025 (in US dollars)?', a: 8000000, unit: 'US$' },
  { cat: 'Movies & TV', q: 'How many films are in the Marvel Cinematic Universe (approximately)?', a: 36, unit: 'films' },
  { cat: 'Movies & TV', q: 'In what year was the first Star Wars movie released?', a: 1977, unit: 'year' },
  { cat: 'Movies & TV', q: 'How many episodes of Game of Thrones were made?', a: 73, unit: 'episodes' },

  // ---------------- FOOD & DRINK ----------------
  { cat: 'Food & Drink', q: 'How many calories are in a Big Mac?', a: 590, unit: 'calories' },
  { cat: 'Food & Drink', q: 'How many cups of coffee are consumed worldwide per day (approximately)?', a: 2250000000, unit: 'cups' },
  { cat: 'Food & Drink', q: 'How many varieties of pasta shapes exist (approximately)?', a: 350, unit: 'shapes' },
  { cat: 'Food & Drink', q: 'How much did the most expensive pizza in the world cost (in US dollars)?', a: 12000, unit: 'US$' },
  { cat: 'Food & Drink', q: 'How many McDonald\'s restaurants are there worldwide (approximately)?', a: 42000, unit: 'restaurants' },
  { cat: 'Food & Drink', q: 'How many liters of beer does the average German drink per year?', a: 88, unit: 'liters' },
  { cat: 'Food & Drink', q: 'How many bananas does the average person eat per year (worldwide average)?', a: 130, unit: 'bananas' },
  { cat: 'Food & Drink', q: 'What temperature should pizza ovens reach for Neapolitan pizza (in °C)?', a: 485, unit: '°C' },
  { cat: 'Food & Drink', q: 'How many kilograms of chocolate does the average Swiss person eat per year?', a: 11, unit: 'kg' },
  { cat: 'Food & Drink', q: 'How many grapes does it take to make one bottle of wine (approximately)?', a: 700, unit: 'grapes' },

  // ---------------- MUSIC ----------------
  { cat: 'Music', q: 'How many studio albums did The Beatles release?', a: 13, unit: 'albums' },
  { cat: 'Music', q: 'How many copies has Michael Jackson\'s Thriller sold worldwide (approximately)?', a: 70000000, unit: 'copies' },
  { cat: 'Music', q: 'How many keys does a standard piano have?', a: 88, unit: 'keys' },
  { cat: 'Music', q: 'How many strings does a standard harp have?', a: 47, unit: 'strings' },
  { cat: 'Music', q: 'In what year was Spotify launched?', a: 2008, unit: 'year' },
  { cat: 'Music', q: 'How many people attended Woodstock in 1969 (approximately)?', a: 400000, unit: 'people' },
  { cat: 'Music', q: 'What is the length of Bohemian Rhapsody (in seconds)?', a: 355, unit: 'seconds' },
  { cat: 'Music', q: 'How many #1 Billboard Hot 100 hits do The Beatles have?', a: 20, unit: 'hits' },

  // ---------------- RANDOM & WEIRD ----------------
  { cat: 'Random & Weird', q: 'How many steps are there to the top of the Eiffel Tower?', a: 1665, unit: 'steps' },
  { cat: 'Random & Weird', q: 'How many words are there in the English language (approximately, per major dictionaries)?', a: 170000, unit: 'words' },
  { cat: 'Random & Weird', q: 'How many times does the average person blink per day?', a: 19200, unit: 'blinks' },
  { cat: 'Random & Weird', q: 'How many LEGO bricks are produced per year (approximately)?', a: 36000000000, unit: 'bricks' },
  { cat: 'Random & Weird', q: 'What is the record for most hot dogs eaten in 10 minutes?', a: 83, unit: 'hot dogs' },
  { cat: 'Random & Weird', q: 'How many rooms are in Buckingham Palace?', a: 775, unit: 'rooms' },
  { cat: 'Random & Weird', q: 'How heavy is the Statue of Liberty (in tons)?', a: 225, unit: 'tons' },
  { cat: 'Random & Weird', q: 'How many emails are sent worldwide per day (approximately)?', a: 360000000000, unit: 'emails' },
  { cat: 'Random & Weird', q: 'How long is the longest fingernail ever recorded (single nail, in cm)?', a: 197, unit: 'cm' },
  { cat: 'Random & Weird', q: 'How many pieces are in the largest commercially sold jigsaw puzzle?', a: 54000, unit: 'pieces' },
];

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

// Pick n questions, spread across categories, avoiding a given set of used question texts
function pickQuestions(n, usedTexts = new Set()) {
  const byCat = {};
  for (const q of QUESTIONS) {
    if (usedTexts.has(q.q)) continue;
    (byCat[q.cat] = byCat[q.cat] || []).push(q);
  }
  const cats = Object.keys(byCat);
  // shuffle categories and each bucket
  const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };
  shuffle(cats);
  cats.forEach((c) => shuffle(byCat[c]));
  const picked = [];
  let ci = 0;
  while (picked.length < n) {
    const cat = cats[ci % cats.length];
    const bucket = byCat[cat];
    if (bucket && bucket.length) picked.push(bucket.pop());
    ci++;
    // safety: if all buckets empty, recycle full bank
    if (cats.every((c) => !byCat[c] || byCat[c].length === 0) && picked.length < n) {
      return picked.concat(pickQuestions(n - picked.length, new Set(picked.map((p) => p.q))));
    }
  }
  return shuffle(picked).map(resolveQuestion);
}

module.exports = { QUESTIONS, pickQuestions, resolveQuestion };
