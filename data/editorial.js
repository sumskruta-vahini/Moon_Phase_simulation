/**
 * data/editorial.js  —  HAND-WRITTEN educational overlay.
 *
 * Kept deliberately separate from data/geometry.generated.js: this file holds
 * the human, narrative content (nickname, mythology, fun facts, polished season
 * text, IAU boundary area) that no dataset provides. It is keyed by the lower-
 * case IAU abbreviation, matching the constellation `id` in the geometry file.
 *
 * script.js merges GEOMETRY + EDITORIAL at runtime. A constellation still
 * renders if its editorial entry is missing — the panel just shows fallbacks.
 */

window.EDITORIAL = {

  ori: {
    nickname: "The Hunter",
    season: "Winter — December to February",
    area: "594 sq deg (26th largest)",
    mythology: "In Greek mythology, Orion was a giant huntsman of great renown. Zeus placed him among the stars after his death. He is depicted with a club and lion pelt, hunting with his dogs Canis Major and Canis Minor. The scorpion Scorpius was his nemesis — placed on opposite sides of the sky so they never meet.",
    facts: [
      "Betelgeuse is a red supergiant ~700x the size of the Sun, expected to supernova within ~100,000 years.",
      "Rigel is a blue supergiant ~85,000x more luminous than the Sun.",
      "The three belt stars (Mintaka, Alnilam, Alnitak) are nearly perfectly collinear.",
      "The Orion Nebula (M42), visible to the naked eye, lies 1,344 light-years below the belt.",
    ],
  },

  uma: {
    nickname: "The Great Bear",
    season: "Spring — March to May (circumpolar from 40 N+)",
    area: "1,280 sq deg (3rd largest)",
    mythology: "Zeus transformed Callisto into a bear and placed her in the sky. Her son Arcas nearly killed her while hunting, so Zeus placed both as Ursa Major and Ursa Minor. Hera convinced Poseidon to forbid them from bathing in the ocean, so they circle the pole without setting.",
    facts: [
      "The Big Dipper (Plough) asterism is formed by its seven brightest stars.",
      "Dubhe and Merak, the Pointer Stars, point directly to Polaris, the North Star.",
      "Mizar was the first binary star discovered telescopically (1617, Benedetto Castelli).",
      "Five Dipper stars share common motion through space — the Ursa Major Moving Group.",
    ],
  },

  umi: {
    nickname: "The Little Bear",
    season: "Year-round (circumpolar from the Northern Hemisphere)",
    area: "256 sq deg",
    mythology: "Ursa Minor represents Arcas, son of Callisto, set in the sky by Zeus beside his mother, the Great Bear. Its brightest star, Polaris, stands almost exactly above Earth's north pole, so the entire sky appears to wheel slowly around it through the night.",
    facts: [
      "Polaris, the North Star, lies within 1° of the north celestial pole — it barely moves all night.",
      "Its seven main stars form the Little Dipper asterism.",
      "Polaris is a Cepheid variable and a triple-star system about 430 light-years away.",
      "Kochab and Pherkad, the two bowl stars, are known as the Guardians of the Pole.",
    ],
  },

  cas: {
    nickname: "The Queen",
    season: "Autumn — September to December (circumpolar from 34 N+)",
    area: "598 sq deg (25th largest)",
    mythology: "Cassiopeia was a vain queen of ancient Ethiopia who boasted her beauty surpassed the sea-nymphs. Poseidon punished her by placing her on a throne that rotates around the celestial pole — spending half the year upside-down as humiliation for her pride.",
    facts: [
      "Its W or M shape makes it one of the most recognisable circumpolar constellations.",
      "Cassiopeia is visible year-round from latitudes above 34 degrees N.",
      "Tycho Brahe's supernova of 1572 appeared here, visible in daylight for weeks.",
      "Cassiopeia A is one of the sky's strongest radio sources — a supernova remnant ~11,000 ly away.",
    ],
  },

  sco: {
    nickname: "The Scorpion",
    season: "Summer — June to August",
    area: "497 sq deg (33rd largest)",
    mythology: "Scorpius is the scorpion sent to kill Orion after he boasted he would hunt every animal on Earth. Zeus placed both in the sky on opposite sides so they never meet — Orion sets as Scorpius rises.",
    facts: [
      "Antares means 'rival of Mars' — its red colour and brightness rival the planet.",
      "Antares is a red supergiant ~700x the solar radius; it would engulf Mars if placed at our Sun.",
      "The stinger pair Shaula and Lesath are 700 and 530 light-years away respectively.",
      "Scorpius contains the naked-eye open clusters M6 (Butterfly) and M7 (Ptolemy Cluster).",
    ],
  },

  cyg: {
    nickname: "The Swan",
    season: "Summer and Autumn — July to November",
    area: "804 sq deg (16th largest)",
    mythology: "Cygnus is most often identified with Zeus disguised as a swan to court Leda. It is also said to be Orpheus, transformed into a swan after his death and placed beside his lyre (Lyra). The constellation forms the prominent Northern Cross asterism.",
    facts: [
      "Deneb is among the most luminous stars known — ~200,000x the Sun's luminosity.",
      "Cygnus X-1 was the first strong black hole candidate identified (1964).",
      "Albireo (β Cyg) shows a striking gold-and-blue colour contrast in a telescope.",
      "The Cygnus Wall is an active star-forming region about 4,600 light-years away.",
    ],
  },

  tau: {
    nickname: "The Bull",
    season: "Winter — November to February",
    area: "797 sq deg (17th largest)",
    mythology: "Taurus is the bull Zeus became to carry off the princess Europa across the sea. Only the front half of the charging bull is drawn. Its face is the V-shaped Hyades cluster, with the red star Aldebaran glaring as its eye.",
    facts: [
      "The Pleiades (M45), the Seven Sisters, is the most famous naked-eye star cluster.",
      "The Hyades is the nearest open cluster to the Sun and forms the bull's face.",
      "Aldebaran, the orange 'eye', lies in front of the Hyades — not actually a member.",
      "The Crab Nebula (M1), remnant of a supernova seen in 1054 AD, sits near a horn tip.",
    ],
  },

  cma: {
    nickname: "The Great Dog",
    season: "Winter — January to March",
    area: "380 sq deg",
    mythology: "Canis Major is the larger of Orion's two hunting dogs, following at the hunter's heels. It is ruled by Sirius, the Dog Star, whose dawn rising once marked the sweltering 'dog days' of summer for the ancient Egyptians and Greeks.",
    facts: [
      "Sirius is the brightest star in the night sky (magnitude -1.46), just 8.6 light-years away.",
      "Sirius has a white-dwarf companion, Sirius B (the 'Pup'), found in 1862.",
      "With Betelgeuse and Procyon, Sirius forms the Winter Triangle.",
      "The open cluster M41 lies about 4° south of Sirius and is just visible to the naked eye.",
    ],
  },

  leo: {
    nickname: "The Lion",
    season: "Spring — March to May",
    area: "947 sq deg (12th largest)",
    mythology: "Leo is the Nemean Lion slain by Heracles in the first of his twelve labours — a beast whose golden hide no weapon could pierce. The lion's head and mane are traced by the Sickle, a backward question mark anchored by Regulus.",
    facts: [
      "Regulus, the lion's heart, sits almost on the ecliptic and is often occulted by the Moon.",
      "The Sickle asterism forms the lion's head and mane.",
      "Leo hosts the Leo Triplet — the interacting galaxies M65, M66 and NGC 3628.",
      "The Leonid meteor shower radiates from Leo every November.",
    ],
  },

  gem: {
    nickname: "The Twins",
    season: "Winter — January to March",
    area: "514 sq deg",
    mythology: "Gemini honours the twin brothers Castor and Pollux. When mortal Castor died, the immortal Pollux begged Zeus to share his own immortality, so the pair were set together in the sky, alternating between the heavens and the underworld.",
    facts: [
      "Pollux, an orange giant, is the brighter twin and hosts a confirmed exoplanet.",
      "Castor looks like one star but is actually a six-star system.",
      "The Sun reaches Gemini at the June solstice, its northernmost point in the sky.",
      "Pluto was discovered in Gemini by Clyde Tombaugh in 1930.",
    ],
  },

  lyr: {
    nickname: "The Lyre",
    season: "Summer — June to August",
    area: "286 sq deg",
    mythology: "Lyra is the lyre of Orpheus, whose music could charm any living thing and even soften the lords of the underworld. After his death the instrument was placed in the sky beside the swan Cygnus, crowned by the brilliant star Vega.",
    facts: [
      "Vega (magnitude 0.03) was the northern pole star around 12,000 BC — and will be again.",
      "Vega was the first star other than the Sun ever photographed (1850).",
      "The Ring Nebula (M57), a classic planetary nebula, lies between β and γ Lyrae.",
      "Epsilon Lyrae, the 'Double Double', is two pairs of stars split in a small telescope.",
    ],
  },

  aql: {
    nickname: "The Eagle",
    season: "Summer — July to September",
    area: "652 sq deg (22nd largest)",
    mythology: "Aquila is the eagle that carried Zeus's thunderbolts and bore the youth Ganymede up to Olympus. The bird is shown soaring along the Milky Way, its bright star Altair marking the eagle's beating heart.",
    facts: [
      "Altair is one of the nearest naked-eye stars, just 17 light-years away.",
      "Altair spins so fast — once every ~9 hours — that it is visibly flattened.",
      "Altair forms the Summer Triangle with Vega (Lyra) and Deneb (Cygnus).",
      "It sits between Tarazed and Alshain in a distinctive short line of three stars.",
    ],
  },

  peg: {
    nickname: "The Winged Horse",
    season: "Autumn — September to November",
    area: "1,121 sq deg (7th largest)",
    mythology: "Pegasus is the winged horse that sprang from the blood of the slain Medusa and was tamed by the hero Bellerophon. The horse is drawn upside down, its body marked by the Great Square — a vast, nearly empty rectangle of four stars.",
    facts: [
      "The Great Square of Pegasus is the key signpost of the autumn sky.",
      "51 Pegasi was the first Sun-like star found to host an exoplanet (1995, a Nobel discovery).",
      "The square's corner star Alpheratz actually belongs to neighbouring Andromeda.",
      "The dense globular cluster M15 lies near the horse's nose.",
    ],
  },

  and: {
    nickname: "The Chained Maiden",
    season: "Autumn — October to December",
    area: "722 sq deg (19th largest)",
    mythology: "Andromeda was the daughter of Cassiopeia, chained to a sea-cliff as a sacrifice to the monster Cetus to atone for her mother's pride, then rescued by the hero Perseus. She is linked by one corner to the Great Square of Pegasus.",
    facts: [
      "The Andromeda Galaxy (M31), 2.5 million light-years away, is the most distant object visible to the naked eye.",
      "M31 is the nearest large spiral galaxy and is slowly approaching the Milky Way.",
      "Alpheratz, shared with Pegasus, marks Andromeda's head.",
      "The constellation ties together the whole Perseus-family myth of the autumn sky.",
    ],
  },

  boo: {
    nickname: "The Herdsman",
    season: "Spring — April to June",
    area: "907 sq deg (13th largest)",
    mythology: "Bootes, the herdsman or ploughman, is often pictured driving the great bears around the pole. His brilliant orange star Arcturus is found by following the curving handle of the Big Dipper down to it.",
    facts: [
      "Arcturus is the brightest star in the northern celestial hemisphere (magnitude -0.05).",
      "Find it with the phrase 'arc to Arcturus' off the Big Dipper's handle.",
      "Arcturus is a red giant racing through the galaxy almost perpendicular to the disc.",
      "Its bright stars form a distinctive kite or ice-cream-cone shape.",
    ],
  },

  per: {
    nickname: "The Hero",
    season: "Autumn to Winter — November to January",
    area: "615 sq deg (24th largest)",
    mythology: "Perseus is the hero who beheaded the Gorgon Medusa and rescued Andromeda from the sea monster. He is shown holding Medusa's severed head, marked by the winking star Algol — long known as the 'Demon Star'.",
    facts: [
      "Algol is an eclipsing binary that visibly dims every 2.87 days as a companion passes in front.",
      "The Double Cluster (NGC 869 and 884) is a striking naked-eye pair toward Cassiopeia.",
      "The Perseid meteor shower, among the year's best, radiates from Perseus each August.",
      "Mirfak, the brightest star, heads the loose Alpha Persei star cluster.",
    ],
  },

  sgr: {
    nickname: "The Archer",
    season: "Summer — July to August",
    area: "867 sq deg (15th largest)",
    mythology: "Sagittarius is the centaur archer drawing his bow toward the heart of the Scorpion. Its brightest stars form the Teapot, whose spout points straight at the hidden centre of our galaxy.",
    facts: [
      "The centre of the Milky Way lies in Sagittarius, behind dense clouds of stars and dust.",
      "Its main stars form the Teapot asterism, with the Milky Way rising like steam from the spout.",
      "It is packed with deep-sky gems: the Lagoon (M8), Trifid (M20) and Omega (M17) nebulae.",
      "The Sun reaches Sagittarius at the December solstice, its southernmost point.",
    ],
  },

  cru: {
    nickname: "The Southern Cross",
    season: "Best from the Southern Hemisphere — autumn to winter (March to June)",
    area: "68 sq deg (smallest constellation)",
    mythology: "Crux, the smallest of all 88 constellations, is the emblem of the southern sky. Unknown as a separate figure to the ancient Greeks, it was charted by European navigators in the 16th century and now appears on several national flags.",
    facts: [
      "Crux is the smallest constellation in the sky — just 68 square degrees.",
      "The long axis of the cross points toward the south celestial pole, a key navigation aid.",
      "Acrux (α Crucis) is a brilliant double star of magnitude 0.8.",
      "The Coalsack, a dark nebula, lies beside the cross as a black patch on the Milky Way.",
    ],
  },

};
