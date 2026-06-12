/**
 * data/quiz.js — Quiz / Assessment content (Screen 5).
 *
 * Kept separate from logic (mirrors the geometry / editorial split).
 * Each item: { q: question, options: [..4], answer: index of correct option }.
 * Answer positions are varied intentionally (not always the same slot).
 */
window.QUIZ = [
  {
    q: 'Which constellation is known as "The Hunter"?',
    options: ["Leo", "Orion", "Cygnus", "Taurus"],
    answer: 1,
  },
  {
    q: "Sirius, the brightest star in the night sky, lies in which constellation?",
    options: ["Lyra", "Ursa Major", "Canis Major", "Scorpius"],
    answer: 2,
  },
  {
    q: "The North Star, Polaris, belongs to which constellation?",
    options: ["Ursa Minor", "Ursa Major", "Cassiopeia", "Draco"],
    answer: 0,
  },
  {
    q: "Which of these constellations is part of the Summer Triangle?",
    options: ["Orion", "Crux", "Leo", "Cygnus"],
    answer: 3,
  },
  {
    q: "Cassiopeia is most recognizable for a shape resembling which letter?",
    options: ["S", "W", "T", "O"],
    answer: 1,
  },
  {
    q: "Betelgeuse and Rigel are bright stars in which constellation?",
    options: ["Gemini", "Orion", "Perseus", "Boötes"],
    answer: 1,
  },
  {
    q: "Crux, the Southern Cross, is best seen from which hemisphere?",
    options: ["Northern", "Southern", "Equatorial only", "Neither"],
    answer: 1,
  },
];
